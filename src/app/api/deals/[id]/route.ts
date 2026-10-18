import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import {
  totalUnits,
  currentTier,
  nextTier,
  unitsToNextTier,
  calculateDealProgress,
  calculateSavings,
  calculatePlatformMargin,
} from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        product: true,
        tiers: {
          orderBy: { minUnits: 'asc' },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const units = totalUnits(deal.participations);
    const activeTier = currentTier(deal.tiers, units);
    const upcomingTier = nextTier(deal.tiers, units);
    const neededUnits = unitsToNextTier(deal.tiers, units);
    const progress = calculateDealProgress(deal.tiers, units);
    const savings = calculateSavings(deal.tiers, activeTier);
    const platformMargin = calculatePlatformMargin(activeTier, units);

    const basePrice = deal.tiers[0]?.pricePerUnit ?? 0;
    const currentPrice = activeTier ? activeTier.pricePerUnit : basePrice;

    // Check if the current logged-in user has joined
    const userParticipation = session?.user
      ? deal.participations.find((p) => p.userId === session.user.id && p.status !== 'CANCELLED')
      : null;

    return NextResponse.json({
      deal: {
        id: deal.id,
        status: deal.status,
        deadline: deal.deadline.toISOString(),
        pickupLocation: deal.pickupLocation,
        pickupTime: deal.pickupTime,
        maxPerUser: deal.maxPerUser,
        tokenPerUnit: deal.tokenPerUnit ?? 150,
        product: deal.product,
        tiers: deal.tiers,
        unitsClaimed: units,
        participantCount: deal.participations.filter((p) => p.status !== 'CANCELLED').length,
        currentTier: activeTier,
        nextTier: upcomingTier,
        unitsToNextTier: neededUnits,
        currentPrice,
        basePrice,
        savings,
        progress,
        platformMargin: session?.user?.role === 'ADMIN' ? platformMargin : undefined,
        // Only return participant identities to admin or anonymized
        participations:
          session?.user?.role === 'ADMIN'
            ? deal.participations
            : deal.participations
                .filter((p) => p.status !== 'CANCELLED')
                .map((p) => ({
                  id: p.id,
                  quantity: p.quantity,
                  depositPaid: p.depositPaid,
                  paymentMethod: p.paymentMethod,
                  joinedAt: p.joinedAt,
                  userName: p.user.name.split(' ')[0] + ' ' + (p.user.name.split(' ')[1]?.[0] || '') + '.',
                })),
        userParticipation: userParticipation
          ? {
              id: userParticipation.id,
              quantity: userParticipation.quantity,
              depositPaid: userParticipation.depositPaid,
              paymentMethod: userParticipation.paymentMethod,
              status: userParticipation.status,
              joinedAt: userParticipation.joinedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Failed to get deal:', error);
    return NextResponse.json({ error: 'Failed to retrieve deal details' }, { status: 500 });
  }
}
