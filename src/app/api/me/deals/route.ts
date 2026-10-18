import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { totalUnits, currentTier } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const participations = await prisma.participation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        deal: {
          include: {
            product: true,
            tiers: { orderBy: { minUnits: 'asc' } },
            participations: {
              select: { quantity: true, status: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const userDeals = participations.map((p) => {
      const allUnits = totalUnits(p.deal.participations);
      const activeTier = currentTier(p.deal.tiers, allUnits);
      const basePrice = p.deal.tiers[0]?.pricePerUnit ?? 0;
      const unitPrice = activeTier ? activeTier.pricePerUnit : basePrice;
      const totalCost = unitPrice * p.quantity;
      const depositPaid = p.depositPaid || 0;
      const balanceDue = Math.max(0, totalCost - depositPaid);

      return {
        participationId: p.id,
        quantity: p.quantity,
        depositPaid,
        balanceDue,
        paymentMethod: p.paymentMethod || 'JAZZCASH',
        status: p.status,
        joinedAt: p.joinedAt,
        deal: {
          id: p.deal.id,
          status: p.deal.status,
          deadline: p.deal.deadline.toISOString(),
          pickupLocation: p.deal.pickupLocation,
          pickupTime: p.deal.pickupTime,
          product: p.deal.product,
          totalUnitsClaimed: allUnits,
          activeTier,
          unitPrice,
          totalCost,
          balanceDue,
        },
      };
    });

    return NextResponse.json({
      participations: userDeals,
      reservations: userDeals,
      orders: userDeals,
    });
  } catch (error) {
    console.error('Failed to get user deals:', error);
    return NextResponse.json({ error: 'Failed to retrieve your deals' }, { status: 500 });
  }
}
