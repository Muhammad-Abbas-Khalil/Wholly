import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { totalUnits, currentTier } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional Bearer token validation for cron security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In development, allow manual triggering if no CRON_SECRET is set or for testing
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const now = new Date();

    // Find all OPEN deals past deadline
    const expiredDeals = await prisma.deal.findMany({
      where: {
        status: 'OPEN',
        deadline: {
          lte: now,
        },
      },
      include: {
        tiers: { orderBy: { minUnits: 'asc' } },
        participations: true,
      },
    });

    const summary = {
      totalExpired: expiredDeals.length,
      unlocked: 0,
      failed: 0,
      deals: [] as { id: string; status: string; units: number }[],
    };

    for (const deal of expiredDeals) {
      const units = totalUnits(deal.participations);
      const tier = currentTier(deal.tiers, units);

      const newStatus = tier ? 'UNLOCKED' : 'FAILED';

      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: newStatus },
      });

      if (newStatus === 'UNLOCKED') {
        summary.unlocked++;
      } else {
        summary.failed++;
      }

      summary.deals.push({
        id: deal.id,
        status: newStatus,
        units,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredDeals.length} expired deals`,
      summary,
    });
  } catch (error) {
    console.error('Cron job error closing deals:', error);
    return NextResponse.json({ error: 'Failed to process deal expirations' }, { status: 500 });
  }
}
