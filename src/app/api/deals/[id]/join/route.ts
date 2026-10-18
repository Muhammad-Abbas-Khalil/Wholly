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

      const limit = deal.maxPerUser || 100;
      if (quantity > limit) {
        throw new Error(`The maximum order for this pool is ${limit} units`);
      }

      // Calculate commitment booking token to eliminate spam
      const tokenRate = deal.tokenPerUnit ?? 150;
      const depositPaid = Math.round(quantity * tokenRate);

      // Check existing participation
      const existing = await tx.participation.findUnique({
        where: {
          dealId_userId: {
            dealId,
            userId: session.user.id,
          },
        },
      });

      let participation;
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

      return { deal, participation };
    });

    return NextResponse.json({
      success: true,
      participation: result.participation,
      depositPaid: result.participation.depositPaid,
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
