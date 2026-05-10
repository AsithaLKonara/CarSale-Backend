import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 3 Multi-Tenant Migration & Backfill Seeder...');

  // 1. Create Default Organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'ultradrive-hq' },
    update: {},
    create: {
      name: 'UltraDrive HQ',
      slug: 'ultradrive-hq',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    },
  });
  console.log(`🏢 Default Organization loaded: ${defaultOrg.name} (${defaultOrg.id})`);

  // 2. Create Default Dynamic Access Roles
  const rolesToCreate = [
    {
      name: 'Super Admin',
      permissions: ['*'], // Universal capabilities bypass
    },
    {
      name: 'Dealership Manager',
      permissions: [
        'cars:view',
        'cars:create',
        'cars:edit',
        'cars:delete',
        'bookings:view',
        'bookings:edit',
        'bookings:delete',
        'analytics:view',
        'audit:view',
        'notifications:view',
      ],
    },
    {
      name: 'Sales Advisor',
      permissions: [
        'cars:view',
        'bookings:view',
        'bookings:edit',
        'analytics:view',
        'notifications:view',
      ],
    },
    {
      name: 'Showroom Guest',
      permissions: ['cars:view'],
    },
  ];

  for (const roleDef of rolesToCreate) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { permissions: roleDef.permissions },
      create: {
        name: roleDef.name,
        permissions: roleDef.permissions,
      },
    });
    console.log(`🔐 Role loaded: ${role.name}`);
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });

  // 3. Backfill Car Inventory
  const carsToBackfill = await prisma.car.findMany({ where: { organizationId: null } });
  if (carsToBackfill.length > 0) {
    await prisma.car.updateMany({
      where: { organizationId: null },
      data: { organizationId: defaultOrg.id },
    });
    console.log(`🏎️  Backfilled ${carsToBackfill.length} cars with default Organization ID.`);
  }

  // 4. Backfill Concierge Bookings
  const bookingsToBackfill = await prisma.booking.findMany({ where: { organizationId: null } });
  if (bookingsToBackfill.length > 0) {
    await prisma.booking.updateMany({
      where: { organizationId: null },
      data: { organizationId: defaultOrg.id },
    });
    console.log(`📅 Backfilled ${bookingsToBackfill.length} bookings with default Organization ID.`);
  }

  // 5. Backfill Live Notifications
  const noticesToBackfill = await prisma.notification.findMany({ where: { organizationId: null } });
  if (noticesToBackfill.length > 0) {
    await prisma.notification.updateMany({
      where: { organizationId: null },
      data: { organizationId: defaultOrg.id },
    });
    console.log(`🔔 Backfilled ${noticesToBackfill.length} notifications with default Organization ID.`);
  }

  // 6. Backfill Analytics Telemetry Events
  const eventsToBackfill = await prisma.analyticsEvent.findMany({ where: { organizationId: null } });
  if (eventsToBackfill.length > 0) {
    await prisma.analyticsEvent.updateMany({
      where: { organizationId: null },
      data: { organizationId: defaultOrg.id },
    });
    console.log(`📊 Backfilled ${eventsToBackfill.length} analytics events with default Organization ID.`);
  }

  // 7. Backfill Admin Users
  const usersToBackfill = await prisma.adminUser.findMany({ where: { organizationId: null } });
  for (const user of usersToBackfill) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        organizationId: defaultOrg.id,
        // Upgrade admin roles automatically to db-backed Super Admin roles
        roleId: user.role === 'admin' ? superAdminRole?.id : undefined,
      },
    });
  }
  if (usersToBackfill.length > 0) {
    console.log(`👤 Backfilled ${usersToBackfill.length} admin users with default Organization and dynamic Roles.`);
  }

  console.log('✅ Multi-Tenant Database Backfill Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
