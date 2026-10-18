import { PrismaClient, Role, DealStatus, ParticipationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Wholly database seed...');

  // Clean existing records in reverse dependency order
  await prisma.participation.deleteMany();
  await prisma.dealTier.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users (Admin & Demo Buyers)
  const admin = await prisma.user.create({
    data: {
      name: 'Abbas Admin',
      phone: '03001234567',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      name: 'Hamza Khan',
      phone: '03211112233',
      passwordHash,
      role: Role.BUYER,
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      name: 'Sara Ahmed',
      phone: '03334445566',
      passwordHash,
      role: Role.BUYER,
    },
  });

  const buyer3 = await prisma.user.create({
    data: {
      name: 'Bilal Tariq',
      phone: '03457778899',
      passwordHash,
      role: Role.BUYER,
    },
  });

  const buyer4 = await prisma.user.create({
    data: {
      name: 'Zainab Malik',
      phone: '03129990011',
      passwordHash,
      role: Role.BUYER,
    },
  });

  console.log('👤 Created Users (1 Admin, 4 Buyers).');

  // 2. Create Products
  const oil = await prisma.product.create({
    data: {
      name: 'Dalda Pure Cooking Oil (5 Litre Tin)',
      description:
        'Premium refined cooking oil enriched with Vitamins A & D. Ideal for everyday household cooking.',
      unit: '5 L tin',
      category: 'Cooking Oil',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    },
  });

  const rice = await prisma.product.create({
    data: {
      name: 'Guard Supreme Super Kernel Basmati Rice (10 kg)',
      description:
        'Aged aromatic long-grain basmati rice. Non-sticky texture, exceptional aroma, and rich taste.',
      unit: '10 kg bag',
      category: 'Rice & Grains',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    },
  });

  const tea = await prisma.product.create({
    data: {
      name: 'Mezan Danedar Premium Black Tea (900g)',
      description:
        'Strong, aromatic blend of high-grown Kenyan CTC tea leaves. Delivers rich color and bold Karak taste.',
      unit: '900g pack',
      category: 'Tea & Beverages',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    },
  });

  const sugar = await prisma.product.create({
    data: {
      name: 'Super Fine Refined White Sugar (5 kg)',
      description:
        'Triple-refined, sparkling white pure cane sugar. Essential pantry staple.',
      unit: '5 kg bag',
      category: 'Sugar & Sweeteners',
      imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=600&auto=format&fit=crop&q=80',
    },
  });

  const atta = await prisma.product.create({
    data: {
      name: 'Sunridge Fortified Chakki Atta (10 kg)',
      description:
        '100% whole wheat chakki atta stone-ground to perfection. Enriched with natural dietary fiber, iron, zinc, folic acid & Vitamin B12 for soft, healthy rotis.',
      unit: '10 kg bag',
      category: 'Flour & Grains',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    },
  });

  const milk = await prisma.product.create({
    data: {
      name: "Olper's All-Natural Full Cream Milk (Carton of 12 x 1L)",
      description:
        'Premium UHT treated pure cow & buffalo milk (12 x 1L Tetra Pak carton). Rich in calcium, protein, and essential vitamins without preservatives.',
      unit: 'Carton (12 x 1L)',
      category: 'Dairy & Breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    },
  });

  console.log('📦 Created Products (6 staple grocery categories).');

  // 3. Create Deals
  // Deal 1: Dalda Oil - ACTIVE, 14 units claimed (6 more to unlock 2,700 PKR)
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const oilDeal = await prisma.deal.create({
    data: {
      productId: oil.id,
      createdById: admin.id,
      status: DealStatus.OPEN,
      deadline: threeDaysLater,
      maxPerUser: 50,
      tokenPerUnit: 150,
      pickupLocation: 'Community Center / Mosque Parking, Block D, Model Town, Lahore',
      pickupTime: 'Saturday 4:00 PM - 7:00 PM',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 3000, supplierCostPerUnit: 2600 },
          { minUnits: 10, pricePerUnit: 2850, supplierCostPerUnit: 2550 },
          { minUnits: 20, pricePerUnit: 2700, supplierCostPerUnit: 2500 },
        ],
      },
    },
  });

  // Add participations to Dalda Oil deal: 14 units claimed
  await prisma.participation.createMany({
    data: [
      { dealId: oilDeal.id, userId: buyer1.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: oilDeal.id, userId: buyer2.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: oilDeal.id, userId: buyer3.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: oilDeal.id, userId: buyer4.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: oilDeal.id, userId: admin.id, quantity: 2, status: ParticipationStatus.RESERVED },
    ],
  });

  // Deal 2: Guard Basmati Rice - ACTIVE, 6 units claimed
  const riceDeal = await prisma.deal.create({
    data: {
      productId: rice.id,
      createdById: admin.id,
      status: DealStatus.OPEN,
      deadline: fiveDaysLater,
      maxPerUser: 50,
      tokenPerUnit: 150,
      pickupLocation: 'Wholly Hub @ PSO Fuel Station, Main Boulevard, Gulberg III, Lahore',
      pickupTime: 'Sunday 11:00 AM - 3:00 PM',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 4200, supplierCostPerUnit: 3700 },
          { minUnits: 10, pricePerUnit: 3900, supplierCostPerUnit: 3500 },
          { minUnits: 25, pricePerUnit: 3600, supplierCostPerUnit: 3300 },
        ],
      },
    },
  });

  await prisma.participation.createMany({
    data: [
      { dealId: riceDeal.id, userId: buyer1.id, quantity: 2, status: ParticipationStatus.RESERVED },
      { dealId: riceDeal.id, userId: buyer2.id, quantity: 2, status: ParticipationStatus.RESERVED },
      { dealId: riceDeal.id, userId: buyer3.id, quantity: 2, status: ParticipationStatus.RESERVED },
    ],
  });

  // Deal 3: Mezan Tea - ACTIVE, 21 units claimed (highest tier unlocked!)
  const teaDeal = await prisma.deal.create({
    data: {
      productId: tea.id,
      createdById: admin.id,
      status: DealStatus.OPEN,
      deadline: oneWeekLater,
      maxPerUser: 50,
      tokenPerUnit: 150,
      pickupLocation: 'Wholly Pickup Point, Street 5, F-7/2, Islamabad',
      pickupTime: 'Friday 3:00 PM - 6:00 PM',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 1650, supplierCostPerUnit: 1400 },
          { minUnits: 10, pricePerUnit: 1500, supplierCostPerUnit: 1300 },
          { minUnits: 20, pricePerUnit: 1350, supplierCostPerUnit: 1200 },
        ],
      },
    },
  });

  await prisma.participation.createMany({
    data: [
      { dealId: teaDeal.id, userId: buyer1.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: teaDeal.id, userId: buyer2.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: teaDeal.id, userId: buyer3.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: teaDeal.id, userId: buyer4.id, quantity: 3, status: ParticipationStatus.RESERVED },
      { dealId: teaDeal.id, userId: admin.id, quantity: 3, status: ParticipationStatus.RESERVED },
    ],
  });

  // Deal 4: White Sugar - FULFILLED (Demonstrates completed order & admin fulfillment)
  const pastDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const sugarDeal = await prisma.deal.create({
    data: {
      productId: sugar.id,
      createdById: admin.id,
      status: DealStatus.FULFILLED,
      deadline: pastDate,
      maxPerUser: 50,
      tokenPerUnit: 150,
      pickupLocation: 'Wholly Hub @ Phase 4 Commercial, DHA, Lahore',
      pickupTime: 'Completed on Wednesday',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 800, supplierCostPerUnit: 720 },
          { minUnits: 15, pricePerUnit: 740, supplierCostPerUnit: 680 },
          { minUnits: 30, pricePerUnit: 690, supplierCostPerUnit: 640 },
        ],
      },
    },
  });

  await prisma.participation.createMany({
    data: [
      { dealId: sugarDeal.id, userId: buyer1.id, quantity: 3, depositPaid: 720, paymentMethod: 'CARD', status: ParticipationStatus.COLLECTED },
      { dealId: sugarDeal.id, userId: buyer2.id, quantity: 3, depositPaid: 720, paymentMethod: 'JAZZCASH', status: ParticipationStatus.COLLECTED },
      { dealId: sugarDeal.id, userId: buyer3.id, quantity: 2, depositPaid: 480, paymentMethod: 'EASYPAISA', status: ParticipationStatus.NO_SHOW },
    ],
  });

  // Deal 5: Sunridge Fortified Chakki Atta - ACTIVE, 11 units claimed (close to 2nd tier!)
  const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const attaDeal = await prisma.deal.create({
    data: {
      productId: atta.id,
      createdById: admin.id,
      status: DealStatus.OPEN,
      deadline: fourDaysLater,
      maxPerUser: 100,
      tokenPerUnit: 150,
      pickupLocation: 'Wholly Hub @ PSO Station, Block C, Model Town, Lahore',
      pickupTime: 'Sunday 2:00 PM - 6:00 PM',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 1550, supplierCostPerUnit: 1350 },
          { minUnits: 10, pricePerUnit: 1420, supplierCostPerUnit: 1290 },
          { minUnits: 25, pricePerUnit: 1320, supplierCostPerUnit: 1220 },
        ],
      },
    },
  });

  await prisma.participation.createMany({
    data: [
      { dealId: attaDeal.id, userId: buyer1.id, quantity: 3, depositPaid: Math.round(1420 * 3 * 0.30), paymentMethod: 'JAZZCASH', status: ParticipationStatus.RESERVED },
      { dealId: attaDeal.id, userId: buyer2.id, quantity: 3, depositPaid: Math.round(1420 * 3 * 0.30), paymentMethod: 'EASYPAISA', status: ParticipationStatus.RESERVED },
      { dealId: attaDeal.id, userId: buyer3.id, quantity: 3, depositPaid: Math.round(1420 * 3 * 0.30), paymentMethod: 'CARD', status: ParticipationStatus.RESERVED },
      { dealId: attaDeal.id, userId: buyer4.id, quantity: 2, depositPaid: Math.round(1420 * 2 * 0.30), paymentMethod: 'JAZZCASH', status: ParticipationStatus.RESERVED },
    ],
  });

  // Deal 6: Olper's Milk - ACTIVE, 8 units claimed (needs 2 more for 10-unit tier)
  const sixDaysLater = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const milkDeal = await prisma.deal.create({
    data: {
      productId: milk.id,
      createdById: admin.id,
      status: DealStatus.OPEN,
      deadline: sixDaysLater,
      maxPerUser: 100,
      tokenPerUnit: 150,
      pickupLocation: 'Wholly Distribution Point @ Phase 5 Commercial, DHA, Lahore',
      pickupTime: 'Saturday 11:00 AM - 3:00 PM',
      tiers: {
        create: [
          { minUnits: 1, pricePerUnit: 3840, supplierCostPerUnit: 3400 },
          { minUnits: 10, pricePerUnit: 3480, supplierCostPerUnit: 3150 },
          { minUnits: 20, pricePerUnit: 3240, supplierCostPerUnit: 2950 },
        ],
      },
    },
  });

  await prisma.participation.createMany({
    data: [
      { dealId: milkDeal.id, userId: buyer1.id, quantity: 2, depositPaid: Math.round(3840 * 2 * 0.30), paymentMethod: 'CARD', status: ParticipationStatus.RESERVED },
      { dealId: milkDeal.id, userId: buyer2.id, quantity: 3, depositPaid: Math.round(3840 * 3 * 0.30), paymentMethod: 'JAZZCASH', status: ParticipationStatus.RESERVED },
      { dealId: milkDeal.id, userId: buyer3.id, quantity: 3, depositPaid: Math.round(3840 * 3 * 0.30), paymentMethod: 'EASYPAISA', status: ParticipationStatus.RESERVED },
    ],
  });

  console.log('✅ Seed finished successfully with 6 staple products and live wholesale deals!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
