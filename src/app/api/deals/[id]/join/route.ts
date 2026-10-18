import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to join a deal' }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1));
    const paymentMethod = body.paymentMethod || 'JAZZCASH';

    // Transaction to guarantee concurrency safety
    const result = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        include: {
          tiers: { orderBy: { minUnits: 'asc' } },
        },
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      if (deal.status !== 'OPEN') {
        throw new Error('This deal is no longer open for reservations');
      }

      if (new Date() >= new Date(deal.deadline)) {
        throw new Error('The deadline for this deal has already passed');
      }

      // No artificial limit on units - users can order any quantity they need
      if (quantity < 1 || quantity > 50000) {
        throw new Error('Please select a valid order quantity');
      }

      const basePrice = deal.tiers[0]?.pricePerUnit ?? 3000;

      // Check existing participation
      const existing = await tx.participation.findUnique({
        where: {
          dealId_userId: {
            dealId,
            userId: session.user.id,
          },
        },
      });

      const isExistingActive = existing && existing.status !== 'CANCELLED';

      let participation;
      let additionalUnits = quantity;
      let additionalDeposit = 0;
      let isUpdate = false;

      if (isExistingActive) {
        if (quantity <= existing.quantity) {
          throw new Error(
            `You already have ${existing.quantity} unit(s) reserved. To maintain wholesale discount commitments, you can only add more units.`
          );
        }

        isUpdate = true;
        additionalUnits = quantity - existing.quantity;
        additionalDeposit = body.additionalDeposit
          ? Math.max(1, Math.round(Number(body.additionalDeposit)))
          : Math.max(1, Math.round(basePrice * additionalUnits * 0.30));

        const newTotalDeposit = (existing.depositPaid || 0) + additionalDeposit;

        participation = await tx.participation.update({
          where: { id: existing.id },
          data: {
            quantity,
            depositPaid: newTotalDeposit,
            paymentMethod,
            status: 'RESERVED',
          },
        });
      } else {
        const totalOrderValue = basePrice * quantity;
        const depositPaid = body.depositPaid
          ? Math.max(1, Math.round(Number(body.depositPaid)))
          : Math.max(1, Math.round(totalOrderValue * 0.30));

        additionalDeposit = depositPaid;

        if (existing) {
          participation = await tx.participation.update({
            where: { id: existing.id },
            data: {
              quantity,
              depositPaid,
              paymentMethod,
              status: 'RESERVED',
            },
          });
        } else {
          participation = await tx.participation.create({
            data: {
              dealId,
              userId: session.user.id,
              quantity,
              depositPaid,
              paymentMethod,
              status: 'RESERVED',
            },
          });
        }
      }

      return {
        deal,
        participation,
        isUpdate,
        additionalUnits,
        additionalDeposit,
        totalDeposit: participation.depositPaid,
      };
    });

    return NextResponse.json({
      success: true,
      participation: result.participation,
      depositPaid: result.participation.depositPaid,
      additionalDeposit: result.additionalDeposit,
      additionalUnits: result.additionalUnits,
      isUpdate: result.isUpdate,
    });
  } catch (error: any) {
    console.error('Join deal error:', error);
    const message = error.message || 'Failed to join deal';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dealId } = await params;

    await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        include: {
          tiers: { orderBy: { minUnits: 'asc' } },
          participations: true,
        },
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      if (deal.status !== 'OPEN') {
        throw new Error('Cannot cancel reservation once a deal is locked or fulfilled');
      }

      if (new Date() >= new Date(deal.deadline)) {
        throw new Error('Cannot cancel after the deal deadline has passed');
      }

      const existing = await tx.participation.findUnique({
        where: {
          dealId_userId: {
            dealId,
            userId: session.user.id,
          },
        },
      });

      if (!existing || existing.status === 'CANCELLED') {
        throw new Error('You have not joined this deal');
      }

      // Anti-Cancellation / Anti-Spam protection:
      // If pool has active participants or unlocked wholesale rates, lock cancellation to prevent pool collapse!
      const totalActiveUnits = deal.participations
        .filter((p) => p.status !== 'CANCELLED')
        .reduce((sum, p) => sum + p.quantity, 0);

      const baseTier = deal.tiers[0];
      if (baseTier && totalActiveUnits >= baseTier.minUnits) {
        throw new Error(
          'Orders are locked once group wholesale tiers are active to guarantee the discounted price for all neighbors. You must collect your reserved units at pickup.'
        );
      }

      await tx.participation.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error: any) {
    console.error('Leave deal error:', error);
    const message = error.message || 'Failed to cancel reservation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
