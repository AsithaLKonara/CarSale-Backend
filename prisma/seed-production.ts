import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UltraDrive Full Production-Simulation Seeding...');

  // 1. Clean existing records in logical dependency order
  console.log('🧹 Purging existing database tables...');
  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.carImage.deleteMany();
  await prisma.carSpec.deleteMany();
  await prisma.car.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();
  console.log('✨ Database clean complete.');

  // 2. Create Default Organization
  const defaultOrg = await prisma.organization.create({
    data: {
      name: 'UltraDrive HQ',
      slug: 'ultradrive-hq',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    },
  });
  console.log(`🏢 Created Organization: ${defaultOrg.name} (${defaultOrg.id})`);

  // 3. Create Custom Access Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      permissions: ['*'],
    },
  });

  const salesAdvisorRole = await prisma.role.create({
    data: {
      name: 'Sales Advisor',
      permissions: [
        'cars:view',
        'bookings:view',
        'bookings:edit',
        'leads:view',
        'leads:edit',
        'analytics:view',
        'notifications:view',
      ],
    },
  });

  const showroomGuestRole = await prisma.role.create({
    data: {
      name: 'Showroom Guest',
      permissions: ['cars:view'],
    },
  });
  console.log('🔐 Access control roles initialized.');

  // 4. Create Standard Passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  // 5. Seed Users
  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@ultradrive.com',
      password: adminPassword,
      role: UserRole.admin,
      organizationId: defaultOrg.id,
      roleId: superAdminRole.id,
    },
  });

  const sales1 = await prisma.adminUser.create({
    data: {
      email: 'sales1@ultradrive.com',
      password: salesPassword,
      role: UserRole.editor,
      organizationId: defaultOrg.id,
      roleId: salesAdvisorRole.id,
    },
  });

  const sales2 = await prisma.adminUser.create({
    data: {
      email: 'sales2@ultradrive.com',
      password: salesPassword,
      role: UserRole.editor,
      organizationId: defaultOrg.id,
      roleId: salesAdvisorRole.id,
    },
  });

  const viewer = await prisma.adminUser.create({
    data: {
      email: 'viewer@ultradrive.com',
      password: viewerPassword,
      role: UserRole.viewer,
      organizationId: defaultOrg.id,
      roleId: showroomGuestRole.id,
    },
  });
  console.log('👤 Standard user accounts seeded.');

  // 6. Seed Inventory (16 realistic supercars)
  const carsData = [
    {
      name: 'Koenigsegg Jesko Absolut',
      slug: 'koenigsegg-jesko-absolut',
      brand: 'Koenigsegg',
      description: 'The Jesko Absolut is the fastest car Koenigsegg will ever build. Powered by a 1600 HP twin-turbo V8 engine, its streamlined body is engineered to slip through the air at speeds exceeding 300 mph.',
      horsepower: 1600,
      torque: 1500,
      topSpeed: 330,
      zeroTo100: 2.5,
      price: '$3,400,000',
      category: 'hypercar',
      isFeatured: true,
      featured: true,
      status: 'available',
      year: 2025,
      mileage: 12,
      fuelType: 'E85 Biofuel',
      transmission: '9-speed LST',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' },
        { url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=800', type: 'gallery' }
      ],
      specs: [
        { label: 'Engine', value: '5.0L Twin-Turbo V8' },
        { label: 'Transmission', value: '9-speed Light Speed' },
        { label: 'Aerodynamics', value: '0.278 Cd Drag Coefficient' }
      ]
    },
    {
      name: 'Koenigsegg Regera',
      slug: 'koenigsegg-regera',
      brand: 'Koenigsegg',
      description: 'The Regera combines a powerful twin-turbo V8 engine with three electric motors and cutting-edge Koenigsegg Direct Drive transmission, eliminating traditional gearboxes entirely for seamless power delivery.',
      horsepower: 1500,
      torque: 2000,
      topSpeed: 250,
      zeroTo100: 2.8,
      price: '$2,000,000',
      category: 'hypercar',
      isFeatured: false,
      featured: false,
      status: 'reserved',
      year: 2024,
      mileage: 180,
      fuelType: 'hybrid',
      transmission: 'Direct Drive',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '5.0L Twin-Turbo V8 Hybrid' },
        { label: 'Transmission', value: 'Direct Drive (Single Speed)' }
      ]
    },
    {
      name: 'Lamborghini Revuelto',
      slug: 'lamborghini-revuelto',
      brand: 'Lamborghini',
      description: 'The ultimate High Performance Electrified Vehicle (HPEV). Combining a raw naturally aspirated V12 engine with hybrid battery propulsion, generating incredible tractive force and modern handling.',
      horsepower: 1001,
      torque: 725,
      topSpeed: 217,
      zeroTo100: 2.5,
      price: '$608,000',
      category: 'luxury',
      isFeatured: true,
      featured: true,
      status: 'available',
      year: 2025,
      mileage: 45,
      fuelType: 'hybrid',
      transmission: '8-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '6.5L V12 + 3 Electric Motors' },
        { label: 'Chassis', value: 'Full Carbon MonoFuselage' }
      ]
    },
    {
      name: 'Lamborghini Huracan Sterrato',
      slug: 'lamborghini-huracan-sterrato',
      brand: 'Lamborghini',
      description: 'An all-terrain supercar featuring raised suspension, underbody protection, and specialized rally drive modes to conquer dirt tracks with authentic V10 mechanical aggression.',
      horsepower: 602,
      torque: 560,
      topSpeed: 160,
      zeroTo100: 3.4,
      price: '$275,000',
      category: 'track',
      isFeatured: false,
      featured: false,
      status: 'available',
      year: 2024,
      mileage: 1100,
      fuelType: 'petrol',
      transmission: '7-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '5.2L Naturally Aspirated V10' },
        { label: 'Suspension', value: '+44mm Ground Clearance' }
      ]
    },
    {
      name: 'Ferrari SF90 Stradale',
      slug: 'ferrari-sf90-stradale',
      brand: 'Ferrari',
      description: 'Ferrari’s state-of-the-art plug-in hybrid supercar. Seamlessly blending three high-torque electric motors with a twin-turbocharged V8 for unmatched lateral acceleration.',
      horsepower: 986,
      torque: 800,
      topSpeed: 211,
      zeroTo100: 2.5,
      price: '$507,000',
      category: 'luxury',
      isFeatured: false,
      featured: false,
      status: 'available',
      year: 2025,
      mileage: 65,
      fuelType: 'hybrid',
      transmission: '8-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L Twin-Turbo V8 PHEV' },
        { label: 'Traction', value: 'e4WD Electric Front Axle' }
      ]
    },
    {
      name: 'Ferrari Daytona SP3',
      slug: 'ferrari-daytona-sp3',
      brand: 'Ferrari',
      description: 'A limited Icona Series masterpiece celebrating retro endurance racing heritage, matching breathtaking organic body contours with a naturally aspirated screaming V12 engine.',
      horsepower: 829,
      torque: 697,
      topSpeed: 211,
      zeroTo100: 2.8,
      price: '$2,250,000',
      category: 'hypercar',
      isFeatured: true,
      featured: true,
      status: 'sold',
      year: 2024,
      mileage: 450,
      fuelType: 'petrol',
      transmission: '7-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '6.5L Naturally Aspirated V12' },
        { label: 'RPM Limit', value: '9,500 RPM Redline' }
      ]
    },
    {
      name: 'McLaren P1',
      slug: 'mclaren-p1',
      brand: 'McLaren',
      description: 'The legendary member of the hypercar holy trinity. A technological tour-de-force matching an electric torque-fill engine with an active rear wing and F1-style IPAS.',
      horsepower: 903,
      torque: 900,
      topSpeed: 217,
      zeroTo100: 2.8,
      price: '$1,300,000',
      category: 'hypercar',
      isFeatured: true,
      featured: true,
      status: 'sold',
      year: 2014,
      mileage: 3400,
      fuelType: 'hybrid',
      transmission: '7-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '3.8L Twin-Turbo V8 Hybrid' },
        { label: 'Chassis', value: 'MonoCage Carbon Tub' }
      ]
    },
    {
      name: 'McLaren 750S Spider',
      slug: 'mclaren-750s-spider',
      brand: 'McLaren',
      description: 'Refined weight reduction, extreme hydraulic roll control suspension, and optimized gear ratios make the 750S Spider the class-leading standard for driver involvement.',
      horsepower: 740,
      torque: 800,
      topSpeed: 206,
      zeroTo100: 2.8,
      price: '$345,000',
      category: 'track',
      isFeatured: false,
      featured: false,
      status: 'available',
      year: 2025,
      mileage: 50,
      fuelType: 'petrol',
      transmission: '7-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L Twin-Turbo V8' },
        { label: 'Suspension', value: 'PCC III Proactive Chassis' }
      ]
    },
    {
      name: 'Porsche 911 GT3 RS (992)',
      slug: 'porsche-911-gt3-rs-992',
      brand: 'Porsche',
      description: 'The absolute track weapon. Featuring motorsport DRS aerodynamics, central radiator concept, and infinitely adjustable steering-wheel dials controlling damping, differential, and traction.',
      horsepower: 518,
      torque: 465,
      topSpeed: 184,
      zeroTo100: 3.2,
      price: '$310,000',
      category: 'track',
      isFeatured: true,
      featured: true,
      status: 'available',
      year: 2024,
      mileage: 210,
      fuelType: 'petrol',
      transmission: '7-speed PDK',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L Naturally Aspirated Boxer-6' },
        { label: 'Downforce', value: '860 kg @ 285 km/h' }
      ]
    },
    {
      name: 'Porsche Taycan Turbo S',
      slug: 'porsche-taycan-turbo-s',
      brand: 'Porsche',
      description: 'An architectural electric masterpiece. Generating instantaneous launch-control torque through a dual-motor powertrain and advanced 800-volt charging technology.',
      horsepower: 938,
      torque: 1110,
      topSpeed: 161,
      zeroTo100: 2.4,
      price: '$215,000',
      category: 'luxury',
      isFeatured: false,
      featured: false,
      status: 'draft',
      year: 2025,
      mileage: 5,
      fuelType: 'electric',
      transmission: '2-speed Automatic',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Powertrain', value: 'Dual Permanent Magnet Motors' },
        { label: 'Voltage', value: '800V Architecture' }
      ]
    },
    {
      name: 'Mercedes-AMG ONE',
      slug: 'mercedes-amg-one',
      brand: 'Mercedes AMG',
      description: 'Bringing actual Formula 1 technology to the street. Equipped with a high-revving 1.6L turbocharged hybrid engine directly derived from Mercedes-AMG PETRONAS F1 racers.',
      horsepower: 1063,
      torque: 950,
      topSpeed: 219,
      zeroTo100: 2.9,
      price: '$2,720,000',
      category: 'hypercar',
      isFeatured: true,
      featured: true,
      status: 'available',
      year: 2024,
      mileage: 80,
      fuelType: 'hybrid',
      transmission: '7-speed Automated Manual',
      images: [
        { url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '1.6L V6 Turbocharged with MGU-H/K' },
        { label: 'RPM Limit', value: '11,000 RPM Limit' }
      ]
    },
    {
      name: 'Mercedes-AMG GT Black Series',
      slug: 'mercedes-amg-gt-black-series',
      brand: 'Mercedes AMG',
      description: 'The peak of AMG V8 front-engine performance. Driven by a flat-plane crank V8 engine coupled with extreme active hood scoops and manually adjustable carbon splitter.',
      horsepower: 720,
      torque: 800,
      topSpeed: 202,
      zeroTo100: 3.2,
      price: '$450,000',
      category: 'track',
      isFeatured: false,
      featured: false,
      status: 'reserved',
      year: 2021,
      mileage: 1200,
      fuelType: 'petrol',
      transmission: '7-speed Dual-Clutch',
      images: [
        { url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L Flat-Plane Crank BiTurbo V8' },
        { label: 'Drive', value: 'Rear Wheel Drive with 9-stage TC' }
      ]
    },
    {
      name: 'BMW M4 CSL',
      slug: 'bmw-m4-csl',
      brand: 'BMW M',
      description: 'Competition Sport Lightweight. Re-engineered inline-six matching 543 HP with strict 100 kg weight reduction, rear-seat deletions, and aggressive Michelin Cup 2 R track traction.',
      horsepower: 543,
      torque: 650,
      topSpeed: 191,
      zeroTo100: 3.6,
      price: '$140,000',
      category: 'track',
      isFeatured: false,
      featured: false,
      status: 'available',
      year: 2023,
      mileage: 850,
      fuelType: 'petrol',
      transmission: '8-speed Automatic',
      images: [
        { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '3.0L TwinPower Turbo Inline-6' },
        { label: 'Weight Reduction', value: 'Carbon Hood, Roof, and Trunk' }
      ]
    },
    {
      name: 'BMW M8 Competition',
      slug: 'bmw-m8-competition',
      brand: 'BMW M',
      description: 'The executive grand tourer. Driven by a muscular twin-turbocharged V8 engine paired with xDrive all-wheel traction capable of fully decoupling for pure rear-wheel slip drift modes.',
      horsepower: 617,
      torque: 750,
      topSpeed: 190,
      zeroTo100: 3.0,
      price: '$135,000',
      category: 'luxury',
      isFeatured: false,
      featured: false,
      status: 'draft',
      year: 2025,
      mileage: 10,
      fuelType: 'petrol',
      transmission: '8-speed Automatic',
      images: [
        { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.4L S63 Twin-Turbo V8' },
        { label: 'Traction', value: 'M xDrive AWD with 2WD mode' }
      ]
    },
    {
      name: 'Audi RS6 Avant GT',
      slug: 'audi-rs6-avant-gt',
      brand: 'Audi RS',
      description: 'The ultimate limited wagon. Retro-inspired Audi 90 IMSA GTO racing livery accents, bespoke adjustable coilover suspension, and a carbon-fiber hood.',
      horsepower: 621,
      torque: 850,
      topSpeed: 190,
      zeroTo100: 3.3,
      price: '$220,000',
      category: 'luxury',
      isFeatured: false,
      featured: false,
      status: 'available',
      year: 2025,
      mileage: 15,
      fuelType: 'petrol',
      transmission: '8-speed Tiptronic',
      images: [
        { url: 'https://images.unsplash.com/photo-1603584173870-7f3ca935fb64?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '4.0L BiTurbo V8' },
        { label: 'Drivetrain', value: 'Quattro Permanent AWD' }
      ]
    },
    {
      name: 'Audi R8 V10 Performance Decennium',
      slug: 'audi-r8-v10-decennium',
      brand: 'Audi RS',
      description: 'A gorgeous limited edition celebrating ten years of Audi V10 performance, finished in Mythos Black with matte bronze intake manifolds and bronze-finish wheels.',
      horsepower: 620,
      torque: 580,
      topSpeed: 205,
      zeroTo100: 3.1,
      price: '$215,000',
      category: 'track',
      isFeatured: false,
      featured: false,
      status: 'sold',
      year: 2020,
      mileage: 4800,
      fuelType: 'petrol',
      transmission: '7-speed S-Tronic',
      images: [
        { url: 'https://images.unsplash.com/photo-1603584173870-7f3ca935fb64?auto=format&fit=crop&q=80&w=2000', type: 'hero' }
      ],
      specs: [
        { label: 'Engine', value: '5.2L FSI V10' },
        { label: 'Exhaust', value: 'Sport Exhaust with Black Tips' }
      ]
    }
  ];

  for (const carItem of carsData) {
    const { images, specs, ...carDetails } = carItem;
    await prisma.car.create({
      data: {
        ...carDetails,
        organizationId: defaultOrg.id,
        images: {
          create: images,
        },
        specs: {
          create: specs,
        },
      },
    });
  }
  console.log(`🏎️ Seeded ${carsData.length} premium supercar listings.`);

  // 7. Seed Leads (26 realistic leads spanning pipeline stages)
  const leadsData = [
    { name: 'Michael Corleone', email: 'michael@corleone.org', phone: '+1 (555) 019-2831', status: 'new', priority: 'high', message: 'Inquiring on custom armored specs for the Daytona SP3.', source: 'Website' },
    { name: 'Tony Stark', email: 'tony@starkindustries.com', phone: '+1 (555) 468-0001', status: 'test-drive', priority: 'high', message: 'Send the Koenigsegg Jesko to Edwards AFB runway this Saturday.', source: 'Showroom Referral' },
    { name: 'Bruce Wayne', email: 'bwayne@waynecorp.com', phone: '+1 (555) 911-0911', status: 'negotiation', priority: 'high', message: 'I require the AMG GT Black Series finished in custom matte black. Contact my assistant Alfred.', source: 'Google Search' },
    { name: 'James Bond', email: 'j.bond@mi6.gov.uk', phone: '+44 7700 900077', status: 'contacted', priority: 'medium', message: 'Do you offer custom ejector seat retrofits for luxury category coupes?', source: 'Website' },
    { name: 'Elon Musk', email: 'elon@spacex.com', phone: '+1 (555) 420-6969', status: 'new', priority: 'low', message: 'Can you swap the Taycan battery with a custom SpaceX high-density solid-state pack?', source: 'Twitter/X' },
    { name: 'Lewis Hamilton', email: 'lewis@lh44.com', phone: '+44 7911 444444', status: 'won', priority: 'high', message: 'Stunning dealership selection. Thrilled with my AMG ONE delivery.', source: 'Showroom Referral' },
    { name: 'John Wick', email: 'baba.yaga@continental.hotel', phone: '+1 (555) 100-2000', status: 'lost', priority: 'high', message: 'Need a fast available coupe by tonight. Cash on hand.', source: 'Google Search' },
    { name: 'Christian Bale', email: 'cbale@hollywood.com', phone: '+1 (555) 832-1922', status: 'contacted', priority: 'medium', message: 'Loved the GT3 RS track review. Would love to sit down for a consultation.', source: 'YouTube Review' },
    { name: 'Steve Rogers', email: 'srogers@shield.gov', phone: '+1 (555) 194-1945', status: 'new', priority: 'low', message: 'Looking for a reliable domestic classic cruiser, but the RS6 looks interesting.', source: 'Instagram' },
    { name: 'Peter Parker', email: 'web@dailybugle.com', phone: '+1 (555) 123-4567', status: 'lost', priority: 'low', message: 'Interested in financing models for entry level M4. High school student budget.', source: 'Website' },
    { name: 'Selina Kyle', email: 'selina@gothamcats.com', phone: '+1 (555) 811-0811', status: 'test-drive', priority: 'high', message: 'Need to schedule an after-hours quiet private test run with the Taycan Turbo S.', source: 'Instagram' },
    { name: 'Clark Kent', email: 'ckent@dailyplanet.com', phone: '+1 (555) 001-9876', status: 'contacted', priority: 'low', message: 'Inquiring for a newspaper article on hypercar pricing metrics.', source: 'Google Search' },
    { name: 'Jordan Belfort', email: 'jordan@stratton.com', phone: '+1 (555) 777-8888', status: 'won', priority: 'high', message: 'Bought the Ferrari SF90 Stradale. Wire completed.', source: 'Showroom Referral' },
    { name: 'Diana Prince', email: 'diana@themyscira.org', phone: '+1 (555) 000-1000', status: 'new', priority: 'medium', message: 'Looking to purchase a classic luxury cruiser for my museum deliveries.', source: 'Website' },
    { name: 'Arthur Dent', email: 'arthur@hitchhiker.space', phone: '+44 1982 424242', status: 'contacted', priority: 'low', message: 'Do these cars come with integrated cup holders and towel brackets?', source: 'Google Search' },
    { name: 'Lara Croft', email: 'lara@croftmanor.co.uk', phone: '+44 7788 123456', status: 'negotiation', priority: 'medium', message: 'Need a durable luxury support wagon for rugged terrain. The RS6 Avant is perfect.', source: 'Website' },
    { name: 'Sherlock Holmes', email: 'sherlock@221b.co.uk', phone: '+44 7946 095855', status: 'contacted', priority: 'medium', message: 'I deduced that your Ferrari Daytona SP3 has custom bespoke manifolds. I would like to inspect them.', source: 'Google Search' },
    { name: 'Walter White', email: 'heisenberg@savewalterwhite.com', phone: '+1 (555) 509-3423', status: 'new', priority: 'high', message: 'I need to purchase a Porsche Taycan for cash. Send terms directly to my son.', source: 'Website' },
    { name: 'Jesse Pinkman', email: 'capncook@chili-p.biz', phone: '+1 (555) 509-4569', status: 'test-drive', priority: 'medium', message: 'Yo! Can I test drive that Audi R8 Decennium? That thing is sweet!', source: 'YouTube Review' },
    { name: 'Luke Skywalker', email: 'luke@tatooine.academy', phone: '+1 (555) 010-1100', status: 'new', priority: 'low', message: 'Does the Koenigsegg steering interface handle high altitude high G turns?', source: 'Website' },
    { name: 'Natasha Romanoff', email: 'blackwidow@shield.gov', phone: '+1 (555) 043-0000', status: 'won', priority: 'high', message: 'The R8 Decennium is delivered. Absolute masterpiece.', source: 'Showroom Referral' },
    { name: 'Barney Stinson', email: 'barney@goliathnational.com', phone: '+1 (555) 450-1893', status: 'negotiation', priority: 'medium', message: 'It’s gonna be legen... wait for it... dary. Let’s seal the lease for the M8 Competition.', source: 'Instagram' },
    { name: 'Harvey Specter', email: 'harvey@pearson-specter.com', phone: '+1 (555) 242-1093', status: 'won', priority: 'high', message: 'Leased the Revuelto. Top class customer service.', source: 'Showroom Referral' },
    { name: 'Wade Wilson', email: 'pool.dead@merc-hire.net', phone: '+1 (555) 666-1991', status: 'new', priority: 'low', message: 'Do you take payment in loose quarters and chimichangas?', source: 'YouTube Review' },
    { name: 'Frank Underwood', email: 'houseofcards@congress.gov', phone: '+1 (555) 202-4561', status: 'negotiation', priority: 'medium', message: 'Looking to lease a fleet of RS6 wagons for my DC security details.', source: 'Google Search' },
    { name: 'Patrick Bateman', email: 'bateman@pierce-pierce.com', phone: '+1 (555) 902-1209', status: 'test-drive', priority: 'medium', message: 'Excellent selection. I need to inspect the glove box spacing on the BMW M8.', source: 'Website' }
  ];

  for (const leadItem of leadsData) {
    await prisma.lead.create({
      data: {
        ...leadItem,
        organizationId: defaultOrg.id,
      },
    });
  }
  console.log(`👥 Seeded ${leadsData.length} qualified lead contacts.`);

  // 8. Seed Bookings (8 bookings with staff assignments)
  const bookingsData = [
    {
      name: 'Michael Corleone',
      email: 'michael@corleone.org',
      phone: '+1 (555) 019-2831',
      preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      carInterest: 'Ferrari Daytona SP3',
      status: 'confirmed',
      notes: 'Private screening of the Daytona. Assigned sales1 advisor.',
      assignedToId: sales1.id,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Tony Stark',
      email: 'tony@starkindustries.com',
      phone: '+1 (555) 468-0001',
      preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      carInterest: 'Koenigsegg Jesko Absolut',
      status: 'confirmed',
      notes: 'Track test slot reserved at dry lake beds.',
      assignedToId: sales1.id,
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Bruce Wayne',
      email: 'bwayne@waynecorp.com',
      phone: '+1 (555) 911-0911',
      preferredDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      carInterest: 'Mercedes-AMG GT Black Series',
      status: 'pending',
      notes: 'Awaiting financial document scans.',
      assignedToId: sales2.id,
    },
    {
      name: 'James Bond',
      email: 'j.bond@mi6.gov.uk',
      phone: '+44 7700 900077',
      preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      carInterest: 'Lamborghini Revuelto',
      status: 'pending',
      notes: 'Wants to inspect standard paint finishes.',
      assignedToId: sales2.id,
    },
    {
      name: 'John Wick',
      email: 'baba.yaga@continental.hotel',
      phone: '+1 (555) 100-2000',
      preferredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      carInterest: 'BMW M4 CSL',
      status: 'rejected',
      notes: 'Could not pass background screening checks.',
    },
    {
      name: 'Harvey Specter',
      email: 'harvey@pearson-specter.com',
      phone: '+1 (555) 242-1093',
      preferredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      carInterest: 'Lamborghini Revuelto',
      status: 'completed',
      notes: 'Vehicle delivered successfully. Signed invoice completed.',
      assignedToId: sales1.id,
    },
    {
      name: 'Lara Croft',
      email: 'lara@croftmanor.co.uk',
      phone: '+44 7788 123456',
      preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      carInterest: 'Audi RS6 Avant GT',
      status: 'pending',
      notes: 'Scheduled for custom rear-rack installation specs review.',
    },
    {
      name: 'Wade Wilson',
      email: 'pool.dead@merc-hire.net',
      phone: '+1 (555) 666-1991',
      preferredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      carInterest: 'Ferrari SF90 Stradale',
      status: 'rejected',
      notes: 'Requested complete payout in non-standard gold bullion.',
    }
  ];

  for (const bookingItem of bookingsData) {
    await prisma.booking.create({
      data: {
        ...bookingItem,
        organizationId: defaultOrg.id,
      },
    });
  }
  console.log(`📅 Seeded ${bookingsData.length} client showroom appointments.`);

  // 9. Seed Analytics Events
  const eventsData = [
    { eventType: 'page_view', path: '/', metadata: { browser: 'Chrome', country: 'US' } },
    { eventType: 'page_view', path: '/cars', metadata: { browser: 'Safari', country: 'UK' } },
    { eventType: 'car_detail', path: '/cars/koenigsegg-jesko-absolut', carId: 'jesko_id_mock', metadata: { viewport: 'mobile' } },
    { eventType: 'car_detail', path: '/cars/lamborghini-revuelto', carId: 'revuelto_id_mock', metadata: { viewport: 'desktop' } },
    { eventType: 'car_detail', path: '/cars/porsche-911-gt3-rs-992', carId: 'gt3_id_mock', metadata: { viewport: 'desktop' } },
    { eventType: 'booking_submit', path: '/api/bookings', metadata: { referer: 'google' } },
    { eventType: 'auth_login', path: '/api/auth/login', metadata: { status: 'success', email: 'admin@ultradrive.com' } },
    { eventType: 'page_view', path: '/dashboard', metadata: { role: 'admin' } },
    { eventType: 'page_view', path: '/dashboard/crm', metadata: { role: 'editor' } },
    { eventType: 'page_view', path: '/dashboard/bookings', metadata: { role: 'editor' } }
  ];

  for (const event of eventsData) {
    await prisma.analyticsEvent.create({
      data: {
        ...event,
        organizationId: defaultOrg.id,
      },
    });
  }
  console.log(`📊 Seeded ${eventsData.length} telemetry analytical events.`);

  console.log('🏁 UltraDrive Production-Simulation Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
