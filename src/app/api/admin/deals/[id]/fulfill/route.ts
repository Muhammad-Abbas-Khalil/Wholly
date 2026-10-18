import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { action, participationId, newStatus } = body;

    if (action === 'MARK_FULFILLED') {
      const deal = await prisma.deal.update({
        where: { id: dealId },
        data: { status: 'FULFILLED' },
      });
      return NextResponse.json({ success: true, deal });
    }

    if (action === 'UPDATE_PARTICIPANT' && participationId && newStatus) {
      const participation = await prisma.participation.update({
        where: { id: participationId },
        data: { status: newStatus },
        include: { user: true },
      });

      // If marked as NO_SHOW, increment user's noShowCount
      if (newStatus === 'NO_SHOW') {
        await prisma.user.update({
          where: { id: participation.userId },
          data: { noShowCount: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true, participation });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update deal fulfillment:', error);
    return NextResponse.json({ error: 'Failed to process admin action' }, { status: 500 });
  }
}
