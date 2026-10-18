import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

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
    const quantity = Number(body.quantity);

    // 1. Transaction to guarantee concurrency safety
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

      if (!quantity || quantity < 1 || quantity > deal.maxPerUser) {
        throw new Error(`You can reserve between 1 and ${deal.maxPerUser} units`);
      }

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
            status: 'RESERVED',
          },
        });
      } else {
        participation = await tx.participation.create({
          data: {
            dealId,
            userId: session.user.id,
            quantity,
            status: 'RESERVED',
          },
        });
      }

      return { deal, participation };
    });

    return NextResponse.json({ success: true, participation: result.participation });
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
