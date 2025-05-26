// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем seeding...');

  // Очищаем существующие данные
  await prisma.review.deleteMany();
  await prisma.buildComponent.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.build.deleteMany();
  await prisma.component.deleteMany();
  await prisma.user.deleteMany();

  // Создаем пользователей
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pcbuilder.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@pcbuilder.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('✅ Пользователи созданы');

  // Создаем компоненты
  const components = [
    // Процессоры
    {
      name: 'Intel Core i7-13700K',
      brand: 'Intel',
      model: 'i7-13700K',
      category: 'CPU',
      price: 185000,
      currency: 'KZT',
      description: 'Мощный 16-ядерный процессор для игр и работы',
      features: ['16 ядер', '24 потока', 'Частота до 5.4 ГГц', 'Разблокированный множитель'],
      specs: {
        cores: '16',
        threads: '24',
        frequency: '3.4 ГГц',
        boost: '5.4 ГГц',
        cache: '30 МБ',
        tdp: '125 Вт',
        socket: 'LGA1700',
        power: '125'
      },
      inStock: true,
      popularity: 150,
      rating: 4.8,
    },
    {
      name: 'AMD Ryzen 7 7700X',
      brand: 'AMD',
      model: '7700X',
      category: 'CPU',
      price: 162000,
      currency: 'KZT',
      description: '8-ядерный процессор на архитектуре Zen 4',
      features: ['8 ядер', '16 потоков', 'Частота до 5.4 ГГц', 'Техпроцесс 5 нм'],
      specs: {
        cores: '8',
        threads: '16',
        frequency: '4.5 ГГц',
        boost: '5.4 ГГц',
        cache: '32 МБ',
        tdp: '105 Вт',
        socket: 'AM5',
        power: '105'
      },
      inStock: true,
      popularity: 135,
      rating: 4.7,
    },
    // Видеокарты
    {
      name: 'NVIDIA RTX 4070',
      brand: 'NVIDIA',
      model: 'RTX 4070',
      category: 'GPU',
      price: 259000,
      currency: 'KZT',
      description: 'Отличная видеокарта для игр в 1440p с RTX',
      features: ['12 ГБ GDDR6X', 'Ray Tracing 3.0', 'DLSS 3.0', 'AV1 кодирование'],
      specs: {
        memory: '12 ГБ GDDR6X',
        power: '200',
        boost: '2475 МГц',
        memory_speed: '21 Гбит/с',
        bus: '192 бит',
        cuda_cores: '5888'
      },
      inStock: true,
      popularity: 200,
      rating: 4.9,
    },
    {
      name: 'AMD RX 7800 XT',
      brand: 'AMD',
      model: 'RX 7800 XT',
      category: 'GPU',
      price: 237000,
      currency: 'KZT',
      description: 'Мощная видеокарта с большим объемом памяти',
      features: ['16 ГБ GDDR6', 'Ray Tracing', 'FSR 3.0', 'AV1 кодирование'],
      specs: {
        memory: '16 ГБ GDDR6',
        power: '263',
        boost: '2430 МГц',
        memory_speed: '19.5 Гбит/с',
        bus: '256 бит',
        stream_processors: '3840'
      },
      inStock: true,
      popularity: 180,
      rating: 4.8,
    },
    // Память
    {
      name: 'Corsair Vengeance DDR5-5600 32GB',
      brand: 'Corsair',
      model: 'Vengeance DDR5-5600',
      category: 'RAM',
      price: 59000,
      currency: 'KZT',
      description: 'Высокоскоростная память DDR5 для современных систем',
      features: ['32 ГБ (2x16 ГБ)', 'DDR5-5600', 'RGB подсветка', 'Тайминги CL36'],
      specs: {
        capacity: '32 ГБ',
        speed: 'DDR5-5600',
        modules: '2x16 ГБ',
        timings: 'CL36-36-36-76',
        voltage: '1.25 В',
        power: '15'
      },
      inStock: true,
      popularity: 120,
      rating: 4.6,
    },
    // Накопители
    {
      name: 'Samsung 980 PRO 1TB',
      brand: 'Samsung',
      model: '980 PRO',
      category: 'STORAGE',
      price: 55000,
      currency: 'KZT',
      description: 'Флагманский NVMe SSD с максимальной производительностью',
      features: ['1 ТБ NVMe', 'Скорость до 7000 МБ/с', 'TLC NAND', '5 лет гарантии'],
      specs: {
        capacity: '1 ТБ',
        type: 'NVMe SSD',
        interface: 'PCIe 4.0 x4',
        read_speed: '7000 МБ/с',
        write_speed: '5000 МБ/с',
        power: '8'
      },
      inStock: true,
      popularity: 160,
      rating: 4.8,
    },
    // Блоки питания
    {
      name: 'Corsair RM850x',
      brand: 'Corsair',
      model: 'RM850x',
      category: 'PSU',
      price: 67000,
      currency: 'KZT',
      description: 'Премиальный блок питания с полной модульностью',
      features: ['850 Вт', '80+ Gold', 'Полностью модульный', '10 лет гарантии'],
      specs: {
        power: '850',
        efficiency: '80+ Gold',
        modular: 'Полностью',
        warranty: '10 лет',
        fan_size: '135 мм',
        cables: 'Плоские'
      },
      inStock: true,
      popularity: 90,
      rating: 4.8,
    },
  ];

  const createdComponents = [];
  for (const componentData of components) {
    const component = await prisma.component.create({
      data: componentData as any,
    });
    createdComponents.push(component);
  }

  console.log('✅ Компоненты созданы');

  // Создаем отзывы
  const reviews = [
    {
      userId: regularUser.id,
      componentId: createdComponents[0].id, // Intel i7-13700K
      rating: 5,
      title: 'Отличный процессор!',
      content: 'Очень доволен покупкой. Быстро работает, не греется.',
    },
    {
      userId: regularUser.id,
      componentId: createdComponents[2].id, // RTX 4070
      rating: 5,
      title: 'Супер видеокарта',
      content: 'Игры на максималках в 1440p идут отлично!',
    },
  ];

  for (const reviewData of reviews) {
    await prisma.review.create({
      data: reviewData,
    });
  }

  console.log('✅ Отзывы созданы');

  // Создаем тестовую сборку
  const build = await prisma.build.create({
    data: {
      name: 'Игровая сборка 2024',
      description: 'Мощная сборка для современных игр',
      userId: regularUser.id,
      totalPrice: 600000,
      isPublic: true,
    },
  });

  // Добавляем компоненты в сборку
  const buildComponents = [
    { buildId: build.id, componentId: createdComponents[0].id, quantity: 1 }, // CPU
    { buildId: build.id, componentId: createdComponents[2].id, quantity: 1 }, // GPU
    { buildId: build.id, componentId: createdComponents[4].id, quantity: 1 }, // RAM
  ];

  for (const buildComponentData of buildComponents) {
    await prisma.buildComponent.create({
      data: buildComponentData,
    });
  }

  console.log('✅ Сборки созданы');

  console.log('🎉 Seeding завершен!');
  console.log('📧 Тестовые аккаунты:');
  console.log('   Admin: admin@pcbuilder.com / password123');
  console.log('   User:  user@pcbuilder.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
