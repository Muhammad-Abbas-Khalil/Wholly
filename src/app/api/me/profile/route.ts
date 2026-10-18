import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        noShowCount: true,
        createdAt: true,
        participations: {
          include: {
            deal: {
              include: {
                product: true,
                tiers: { orderBy: { minUnits: 'asc' } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalOrders = user.participations.length;
    const activeOrders = user.participations.filter(
      (p) => p.status === 'RESERVED' && p.deal.status === 'OPEN'
    ).length;
    const totalDepositPaid = user.participations.reduce(
      (sum, p) => sum + (p.depositPaid || 0),
      0
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        noShowCount: user.noShowCount,
        createdAt: user.createdAt,
      },
      stats: {
        totalOrders,
        activeOrders,
        totalDepositPaid,
      },
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Validate and update name
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    // Validate and update phone
    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/[-\s]/g, '').trim();
      if (!/^03\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Invalid Pakistani mobile number. Must be 11 digits starting with 03 (e.g., 03211234567)' },
          { status: 400 }
        );
      }

      if (cleanPhone !== user.phone) {
        const existingWithPhone = await prisma.user.findUnique({
          where: { phone: cleanPhone },
        });

        if (existingWithPhone) {
          return NextResponse.json(
            { error: 'This phone number is already registered to another account' },
            { status: 409 }
          );
        }
        updateData.phone = cleanPhone;
      }
    }

    // Handle Password Change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'Current password does not match' },
          { status: 400 }
        );
      }

      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes provided' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
