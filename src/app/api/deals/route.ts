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
} from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const deals = await prisma.deal.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(category ? { product: { category } } : {}),
      },
      include: {
        product: true,
        tiers: {
          orderBy: { minUnits: 'asc' },
        },
        participations: {
          select: {
            id: true,
            quantity: true,
            status: true,
            depositPaid: true,
            paymentMethod: true,
            joinedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { deadline: 'asc' },
      ],
    });

    const enrichedDeals = deals.map((deal) => {
      const units = totalUnits(deal.participations);
      const activeTier = currentTier(deal.tiers, units);
      const upcomingTier = nextTier(deal.tiers, units);
      const neededUnits = unitsToNextTier(deal.tiers, units);
      const progress = calculateDealProgress(deal.tiers, units);
      const savings = calculateSavings(deal.tiers, activeTier);

      const basePrice = deal.tiers[0]?.pricePerUnit ?? 0;
      const currentPrice = activeTier ? activeTier.pricePerUnit : basePrice;

      return {
        id: deal.id,
        status: deal.status,
        deadline: deal.deadline.toISOString(),
        pickupLocation: deal.pickupLocation,
        pickupTime: deal.pickupTime,
        maxPerUser: deal.maxPerUser,
        product: deal.product,
        tiers: deal.tiers,
        unitsClaimed: units,
        participations: deal.participations,
        participantCount: deal.participations.filter((p) => p.status !== 'CANCELLED').length,
        currentTier: activeTier,
        nextTier: upcomingTier,
        unitsToNextTier: neededUnits,
        currentPrice,
        basePrice,
        savings,
        progress,
      };
    });

    return NextResponse.json({ deals: enrichedDeals });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    return NextResponse.json({ error: 'Failed to retrieve deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      productId,
      deadline,
      pickupLocation,
      pickupTime,
      maxPerUser = 50,
      tokenPerUnit = 150,
      tiers,
    } = body;

    if (!productId || !deadline || !pickupLocation || !pickupTime || !Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json({ error: 'Missing required deal fields or tiers' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        productId,
        deadline: new Date(deadline),
        pickupLocation,
        pickupTime,
        maxPerUser: Number(maxPerUser) || 50,
        tokenPerUnit: Number(tokenPerUnit) || 150,
        createdById: session.user.id,
        tiers: {
          create: tiers.map((t: { minUnits: number; pricePerUnit: number; supplierCostPerUnit: number }) => ({
            minUnits: Number(t.minUnits),
            pricePerUnit: Number(t.pricePerUnit),
            supplierCostPerUnit: Number(t.supplierCostPerUnit),
          })),
        },
      },
      include: {
        product: true,
        tiers: true,
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
