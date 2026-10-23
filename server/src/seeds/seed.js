import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Table } from '../models/Table.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Config } from '../models/Config.js';
import { generateTableQRDataUrl } from '../utils/qrHelper.js';
import { MONGODB_URI, QR_BASE_URL } from '../config/env.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    // 1. Seed Config
    const baseUrl = process.env.QR_BASE_URL || QR_BASE_URL || 'http://localhost:5173';
    await Config.findOneAndUpdate(
      { key: 'qr_base_url' },
      { key: 'qr_base_url', value: baseUrl },
      { upsert: true }
    );
    console.log(`[Seed] QR Base URL configured: ${baseUrl}`);

    // 2. Seed Admin User
    await User.deleteMany({});
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const admin = await User.create({
      username: 'admin',
      email: 'admin@brewandbean.cafe',
      password: adminPassword,
      name: 'Chef & Head Barista',
      role: 'admin',
    });
    console.log(`[Seed] Admin user created: admin / ${adminPassword}`);

    // 3. Seed Tables
    await Table.deleteMany({});
    const initialTables = [
      { tableNumber: 'T01', name: 'Window Nook', capacity: 2, notes: 'Quiet window seat with street view' },
      { tableNumber: 'T02', name: 'Sunlit Alcove', capacity: 4, notes: 'Morning light corner table' },
      { tableNumber: 'T03', name: 'Artisan Bar High-top', capacity: 2, notes: 'Direct view of manual brew station' },
      { tableNumber: 'T04', name: 'Courtyard Patio', capacity: 4, notes: 'Semi-outdoor garden table with umbrella' },
      { tableNumber: 'T05', name: 'Mezzanine Lounge', capacity: 6, notes: 'Cozy velvet sofa table for groups' },
      { tableNumber: 'T06', name: 'Garden Terrace', capacity: 4, notes: 'Fresh air & lush greenery' },
      { tableNumber: 'T07', name: 'Library Booth', capacity: 4, notes: 'Power plugs available for laptop work' },
      { tableNumber: 'T08', name: 'Roaster High Table', capacity: 2, notes: 'Beside the Probat roaster' },
    ];

    for (const t of initialTables) {
      const { dataUrl } = await generateTableQRDataUrl(t.tableNumber, baseUrl);
      await Table.create({
        ...t,
        isActive: true,
        qrCodeDataUrl: dataUrl,
      });
    }
    console.log(`[Seed] Created ${initialTables.length} tables with generated QR codes.`);

    // 4. Seed Categories
    await Category.deleteMany({});
    const categoriesData = [
      { name: 'Espresso & Coffee', slug: 'espresso-coffee', order: 1, icon: 'Coffee', description: 'Single origin roasts, freshly pulled espresso and rich milk drinks' },
      { name: 'Cold Coffee', slug: 'cold-coffee', order: 2, icon: 'CupSoda', description: 'Slow-steeped cold brews, iced lattes and blended shakes' },
      { name: 'Tea & Refreshers', slug: 'tea-refreshers', order: 3, icon: 'Leaf', description: 'Loose-leaf brews, matcha lattes and sparkling botanicals' },
      { name: 'Bakery', slug: 'bakery', order: 4, icon: 'Croissant', description: 'Artisanal hand-laminated viennoiserie baked fresh every morning' },
      { name: 'Sandwiches', slug: 'sandwiches', order: 5, icon: 'Utensils', description: 'Artisan sourdough melts, focaccias and house-cured fillings' },
      { name: 'Desserts', slug: 'desserts', order: 6, icon: 'Cake', description: 'Decadent chocolate treats, burnt cheesecakes and classic sweets' },
    ];
    await Category.insertMany(categoriesData);
    console.log(`[Seed] Created ${categoriesData.length} menu categories.`);

    // 5. Seed Menu Items
    await MenuItem.deleteMany({});

    const standardCoffeeCustomizations = [
      {
        name: 'Size',
        type: 'single',
        required: true,
        options: [
          { name: 'Regular (240ml)', price: 0 },
          { name: 'Large (360ml)', price: 40 },
        ],
      },
      {
        name: 'Milk Choice',
        type: 'single',
        required: false,
        options: [
          { name: 'Whole Milk', price: 0 },
          { name: 'Oat Milk (Oatly Barista)', price: 35 },
          { name: 'Almond Milk', price: 35 },
          { name: 'Soy Milk', price: 30 },
        ],
      },
      {
        name: 'Extra Shot',
        type: 'single',
        required: false,
        options: [
          { name: 'Standard Single Shot', price: 0 },
          { name: 'Double Shot (Stronger)', price: 45 },
        ],
      },
      {
        name: 'Sweetener & Flavor',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Madagascar Vanilla Syrup', price: 25 },
          { name: 'Salted Caramel Drizzle', price: 25 },
          { name: 'Raw Demerara Sugar', price: 0 },
          { name: 'Sugar-Free Stevia', price: 0 },
        ],
      },
    ];

    const coldCoffeeCustomizations = [
      {
        name: 'Size',
        type: 'single',
        required: true,
        options: [
          { name: 'Regular (350ml)', price: 0 },
          { name: 'Grande (500ml)', price: 50 },
        ],
      },
      {
        name: 'Milk Choice',
        type: 'single',
        required: false,
        options: [
          { name: 'Whole Milk', price: 0 },
          { name: 'Oat Milk', price: 35 },
          { name: 'Almond Milk', price: 35 },
        ],
      },
      {
        name: 'Toppings',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Whipped Cream', price: 30 },
          { name: 'Espresso Jelly', price: 35 },
          { name: 'Dark Chocolate Curls', price: 20 },
        ],
      },
    ];

    const bakeryCustomizations = [
      {
        name: 'Preparation',
        type: 'single',
        required: false,
        options: [
          { name: 'Warmed Up / Crisp Toasting', price: 0 },
          { name: 'As Is (Room Temp)', price: 0 },
        ],
      },
      {
        name: 'Accompaniment',
        type: 'multiple',
        required: false,
        options: [
          { name: 'French Salted Butter Pat', price: 20 },
          { name: 'Wild Strawberry Jam', price: 25 },
        ],
      },
    ];

    const sandwichCustomizations = [
      {
        name: 'Bread Choice',
        type: 'single',
        required: true,
        options: [
          { name: 'Artisan Country Sourdough', price: 0 },
          { name: 'Rosemary Garlic Focaccia', price: 20 },
          { name: 'Multigrain Rye', price: 15 },
        ],
      },
      {
        name: 'Add-ons',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Cheddar Cheese', price: 40 },
          { name: 'Caramelized Onions', price: 25 },
          { name: 'Jalapeño Pickles', price: 15 },
        ],
      },
    ];

    const menuItemsData = [
      // Espresso & Coffee
      {
        name: 'Artisan Cappuccino',
        description: 'Double ristretto of Chikmagalur estate beans, textured silky milk foam, dusting of Valrhona cocoa.',
        price: 140,
        category: 'Espresso & Coffee',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 4,
        customizations: standardCoffeeCustomizations,
      },
      {
        name: 'Velvet Café Latte',
        description: 'Smooth, creamy steamed micro-foam over a rich shot of medium-roast Arabica.',
        price: 160,
        category: 'Espresso & Coffee',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 4,
        customizations: standardCoffeeCustomizations,
      },
      {
        name: 'Spanish Cinnamon Cortado',
        description: 'Equal parts bold espresso and condensed milk, dusted with Ceylon cinnamon bark.',
        price: 180,
        category: 'Espresso & Coffee',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 4,
        customizations: standardCoffeeCustomizations,
      },
      {
        name: 'Flat White',
        description: 'Pure velvety micro-foam poured seamlessly over an intense double ristretto shot.',
        price: 170,
        category: 'Espresso & Coffee',
        image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 4,
        customizations: standardCoffeeCustomizations,
      },

      // Cold Coffee
      {
        name: 'Signature Cold Coffee',
        description: 'Classic rich espresso blended with chilled milk, vanilla bean infusion, and artisan ice cream scoop.',
        price: 180,
        category: 'Cold Coffee',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 5,
        customizations: coldCoffeeCustomizations,
      },
      {
        name: 'Caramel Macchiato Frappé',
        description: 'Blended espresso with sea-salted caramel swirl, crunchy waffle crunchies and whipped cream crown.',
        price: 210,
        category: 'Cold Coffee',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 5,
        customizations: coldCoffeeCustomizations,
      },
      {
        name: 'Nitro Cold Brew Tonic',
        description: '18-hour cold steeped single estate coffee infused with botanical tonic water and charred orange wheel.',
        price: 195,
        category: 'Cold Coffee',
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegan', 'Gluten-Free'],
        prepTimeMinutes: 3,
        customizations: coldCoffeeCustomizations,
      },
      {
        name: 'Hazelnut Crunch Frappé',
        description: 'Blended chilled espresso with slow-roasted Piedmont hazelnut praline, velvety milk, and Belgian dark chocolate drizzle.',
        price: 220,
        category: 'Cold Coffee',
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 5,
        customizations: coldCoffeeCustomizations,
      },

      // Tea & Refreshers
      {
        name: 'Ceremonial Uji Matcha Latte',
        description: 'Stone-ground first-harvest Japanese green tea whisked with oat milk and blossom honey.',
        price: 210,
        category: 'Tea & Refreshers',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 5,
        customizations: [
          {
            name: 'Milk Choice',
            type: 'single',
            required: false,
            options: [
              { name: 'Oat Milk', price: 0 },
              { name: 'Almond Milk', price: 20 },
              { name: 'Whole Milk', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'Kashmiri Saffron Kahwa',
        description: 'Green tea simmered with whole cinnamon, green cardamom, roasted almond slivers, and saffron strands.',
        price: 150,
        category: 'Tea & Refreshers',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegan', 'Gluten-Free'],
        prepTimeMinutes: 4,
        customizations: [],
      },
      {
        name: 'Sparkling Peach Hibiscus Fizz',
        description: 'Cold-pressed white peach puree, steeped crimson hibiscus flowers, mint leaves, sparkling soda.',
        price: 165,
        category: 'Tea & Refreshers',
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegan', 'Gluten-Free'],
        prepTimeMinutes: 3,
        customizations: [],
      },

      // Bakery
      {
        name: 'Pure Butter Croissant',
        description: 'Traditional 72-layer hand-laminated French pastry with golden caramelized crust and airy honeycomb interior.',
        price: 120,
        category: 'Bakery',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 3,
        customizations: bakeryCustomizations,
      },
      {
        name: 'Pain au Chocolat',
        description: 'Flaky buttery layers rolled around dual batons of 58% Belgian dark chocolate.',
        price: 145,
        category: 'Bakery',
        image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 3,
        customizations: bakeryCustomizations,
      },
      {
        name: 'Cinnamon Brioche Swirl',
        description: 'Soft pillowy spiced dough layered with brown sugar cinnamon paste, topped with cream cheese glaze.',
        price: 135,
        category: 'Bakery',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 3,
        customizations: bakeryCustomizations,
      },
      {
        name: 'Garlic Herb Cream Cheese Bagel',
        description: 'Freshly toasted artisan sesame bagel generously layered with whipped garlic-herb cream cheese and micro-greens.',
        price: 195,
        category: 'Bakery',
        image: 'https://images.unsplash.com/photo-1585478259715-876a6a81ae08?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 4,
        customizations: bakeryCustomizations,
      },

      // Sandwiches
      {
        name: 'Truffled 3-Cheese Sourdough Melt',
        description: 'Sharp English cheddar, aged Gruyère, and smoked mozzarella with black truffle butter on toasted sourdough.',
        price: 190,
        category: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 8,
        customizations: sandwichCustomizations,
      },
      {
        name: 'Smoked Paneer & Basil Pesto Focaccia',
        description: 'Tandoor-smoked cottage cheese steaks, house pine-nut pesto, sun-dried tomatoes, and wild rocket.',
        price: 220,
        category: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 8,
        customizations: sandwichCustomizations,
      },
      {
        name: 'Avocado Tartine with Feta & Dukkah',
        description: 'Hass avocado mash on toasted country loaf, creamy crumbled Greek feta, cherry tomatoes, Egyptian dukkah spice.',
        price: 240,
        category: 'Sandwiches',
        image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 7,
        customizations: sandwichCustomizations,
      },

      // Desserts
      {
        name: 'Warm Sea Salt Fudgy Brownie',
        description: 'Rich dark chocolate brownie baked with 70% chocolate chunks, Maldon flake sea salt, served with vanilla bean cream.',
        price: 130,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: true,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 3,
        customizations: [
          {
            name: 'Serving Style',
            type: 'single',
            required: false,
            options: [
              { name: 'Warm with Vanilla Bean Ice Cream', price: 40 },
              { name: 'Warm Solo', price: 0 },
              { name: 'Chilled Solo', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'Classic Venetian Tiramisu Jar',
        description: 'Savoiardi ladyfingers soaked in our double espresso and Marsala reduction, layered with whipped mascarpone.',
        price: 185,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 2,
        customizations: [],
      },
      {
        name: 'Basque Caramelized Burnt Cheesecake',
        description: 'Creamy custardy center with a rich caramelized outer crust, finished with fresh raspberry coulis.',
        price: 230,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: false,
        isFeatured: false,
        dietary: ['Vegetarian'],
        prepTimeMinutes: 2,
        customizations: [],
      },
    ];

    await MenuItem.insertMany(menuItemsData);
    console.log(`[Seed] Created ${menuItemsData.length} menu items with photography and customizations.`);

    console.log('[Seed] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
