import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a valid name' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Please enter your Pakistani mobile number' },
        { status: 400 }
      );
    }

    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '').trim();
    if (cleanPhone.startsWith('+92')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('92') && cleanPhone.length === 12) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    if (!/^03\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be 11 digits starting with 03 (e.g. 03211234567 or +923211234567)' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        passwordHash,
        role: 'BUYER',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
