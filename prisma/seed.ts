import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records to prevent duplicates
  await prisma.carImage.deleteMany();
  await prisma.carSpec.deleteMany();
  await prisma.car.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.adminUser.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Default Administrators
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@ultradrive.com',
      password: adminPassword,
      role: UserRole.admin,
    },
  });

  const editor = await prisma.adminUser.create({
    data: {
      email: 'editor@ultradrive.com',
      password: editorPassword,
      role: UserRole.editor,
    },
  });

  const viewer = await prisma.adminUser.create({
    data: {
      email: 'viewer@ultradrive.com',
      password: viewerPassword,
      role: UserRole.viewer,
    },
  });

  console.log('👥 Seeded default users: admin@ultradrive.com, editor@ultradrive.com, viewer@ultradrive.com');

  // 3. Seed Supercars
  const carsData = [
    {
      name: 'Koenigsegg Jesko',
      slug: 'koenigsegg-jesko',
      brand: 'Koenigsegg',
      description: 'The Jesko is Koenigsegg’s all-new hypercar that was designed to be the ultimate track-focused car for the road. It features a redesigned 5.0 liter twin-turbo V8 engine and a revolutionary 9-speed Light Speed Transmission.',
      horsepower: 1600,
      torque: 1500,
      topSpeed: 300,
      zeroTo100: 2.5,
      price: '$3,000,000',
      category: 'hypercar',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' },
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1603584173870-7f3ca935fb64?auto=format&fit=crop&q=80&w=800', type: 'gallery' }
      ],
      specs: [
        { label: 'Engine', value: '5.0L V8 Twin-Turbo' },
        { label: 'Transmission', value: '9-speed Koenigsegg LST' },
        { label: 'Dimensions', value: '4610mm L x 2030mm W x 1210mm H' },
        { label: 'Weight', value: '1420 kg (Curb weight)' },
        { label: 'Brakes', value: 'Ventilated Ceramic Discs' },
        { label: 'Tires', value: 'Michelin Pilot Sport Cup 2' }
      ]
    },
    {
      name: 'Lamborghini Revuelto',
      slug: 'lamborghini-revuelto',
      brand: 'Lamborghini',
      description: 'The first V12 hybrid plug-in HPEV (High Performance Electrified Vehicle) supercar. Defining a new paradigm in terms of performance, sportiness and driving pleasure.',
      horsepower: 1001,
      torque: 725,
      topSpeed: 217,
      zeroTo100: 2.5,
      price: '$608,000',
      category: 'luxury',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=2000', type: 'hero' },
        { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1544636331-e268592033c2?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800', type: 'gallery' }
      ],
      specs: [
        { label: 'Engine', value: '6.5L V12 + 3 Electric Motors' },
        { label: 'Transmission', value: '8-speed Dual-Clutch' },
        { label: 'Dimensions', value: '4947mm L x 2266mm W x 1160mm H' },
        { label: 'Weight', value: '1772 kg' },
        { label: 'Brakes', value: 'CCB+ (Carbon Ceramic Brakes Plus)' },
        { label: 'Tires', value: 'Bridgestone Potenza Sport' }
      ]
    },
    {
      name: 'McLaren P1',
      slug: 'mclaren-p1',
      brand: 'McLaren',
      description: 'The McLaren P1 is a limited-production plug-in hybrid hypercar produced by British automobile manufacturer McLaren Automotive. Combining massive hybrid electric assistance with an active air wing and aerodynamic body contours.',
      horsepower: 903,
      torque: 900,
      topSpeed: 217,
      zeroTo100: 2.8,
      price: '$1,300,000',
      category: 'track',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000', type: 'hero' },
        { url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf048?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800', type: 'gallery' }
      ],
      specs: [
        { label: 'Engine', value: '3.8L V8 Twin-Turbo + Electric Motor' },
        { label: 'Transmission', value: '7-speed Dual-Clutch' },
        { label: 'Dimensions', value: '4588mm L x 1946mm W x 1188mm H' },
        { label: 'Weight', value: '1395 kg (Dry weight)' },
        { label: 'Brakes', value: 'Akebono Carbon Ceramic Discs' },
        { label: 'Tires', value: 'Pirelli P Zero Corsa' }
      ]
    },
    {
      name: 'Ferrari SF90 Stradale',
      slug: 'ferrari-sf90',
      brand: 'Ferrari',
      description: 'The Ferrari SF90 Stradale is a mid-engine plug-in hybrid sports car produced by the Italian automotive manufacturer Ferrari. It features a twin-turbocharged V8 engine combined with three high-voltage electric motors.',
      horsepower: 986,
      torque: 800,
      topSpeed: 211,
      zeroTo100: 2.5,
      price: '$507,000',
      category: 'luxury',
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000', type: 'hero' },
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800', type: 'gallery' },
        { url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf048?auto=format&fit=crop&q=80&w=800', type: 'gallery' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L V8 Twin-Turbo + 3 Electric Motors' },
        { label: 'Transmission', value: '8-speed Dual-Clutch' },
        { label: 'Dimensions', value: '4710mm L x 1972mm W x 1186mm H' },
        { label: 'Weight', value: '1570 kg' },
        { label: 'Brakes', value: 'Carbon Ceramic' },
        { label: 'Tires', value: 'Michelin Pilot Sport Cup 2' }
      ]
    }
  ];

  for (const carItem of carsData) {
    const { images, specs, ...carDetails } = carItem;

    const car = await prisma.car.create({
      data: {
        ...carDetails,
        images: {
          create: images,
        },
        specs: {
          create: specs,
        },
      },
    });

    console.log(`🚗 Seeded car: ${car.name} (${car.slug})`);
  }

  // 4. Seed Mock Bookings
  await prisma.booking.createMany({
    data: [
      {
        name: 'Alex Mercer',
        email: 'alex@example.com',
        phone: '+1 (555) 901-2345',
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        carInterest: 'Koenigsegg Jesko',
        status: 'pending',
        notes: 'Would love to explore financing details for the Jesko.',
      },
      {
        name: 'Clara Oswald',
        email: 'clara@example.com',
        phone: '+1 (555) 432-1098',
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        carInterest: 'Lamborghini Revuelto',
        status: 'confirmed',
        notes: 'Requesting a private weekend slot in the LA showroom.',
      }
    ]
  });

  console.log('📅 Seeded mock bookings.');
  console.log('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
