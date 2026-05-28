const db = require('./setup');
const bcrypt = require('bcryptjs');

// Clear existing data
db.exec(`
  DELETE FROM cart_items;
  DELETE FROM orders;
  DELETE FROM product_requests;
  DELETE FROM reviews;
  DELETE FROM wishlist;
  DELETE FROM discount_codes;
  DELETE FROM products;
  DELETE FROM users;
`);

// Seed admin user
const adminHash = bcrypt.hashSync('admin123', 10);
db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(
  'Admin User', 'admin@eshop.com', adminHash, 'admin'
);

// Seed demo customer
const customerHash = bcrypt.hashSync('customer123', 10);
db.prepare(`INSERT INTO users (name, email, password_hash, role, address) VALUES (?, ?, ?, ?, ?)`).run(
  'Jane Doe', 'jane@example.com', customerHash, 'customer',
  JSON.stringify({ street: 'KG 11 Ave', city: 'Kigali', state: 'Kigali City', zip: '00000', country: 'Rwanda' })
);

const products = [
  // Women's
  {
    name: 'Classic White Linen Shirt',
    description: 'Effortlessly chic white linen shirt with a relaxed fit. Perfect for casual days or dressed up with trousers. Breathable fabric keeps you comfortable all day.',
    price: 18000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['White', 'Ivory']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'
    ]),
    stock: 45, featured: 1
  },
  {
    name: 'Floral Wrap Midi Dress',
    description: 'Elegant floral print wrap dress with a flattering silhouette. The midi length and wrap style create a sophisticated look for any occasion.',
    price: 32000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
    colors: JSON.stringify(['Floral Blue', 'Floral Pink']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80'
    ]),
    stock: 30, featured: 1
  },
  {
    name: 'High-Waist Tailored Trousers',
    description: 'Modern high-waist trousers with a tailored straight-leg cut. Versatile enough for the office or evening out. Made from a premium stretch blend for all-day comfort.',
    price: 25000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Black', 'Camel', 'Navy']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600&q=80',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'
    ]),
    stock: 50, featured: 0
  },
  {
    name: 'Cashmere Blend Turtleneck',
    description: 'Luxuriously soft cashmere-blend turtleneck sweater. The relaxed fit and ribbed texture make it the ultimate cozy essential for cooler months.',
    price: 42000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Cream', 'Camel', 'Charcoal', 'Dusty Rose']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80'
    ]),
    stock: 25, featured: 1
  },
  {
    name: 'Slim Fit Denim Jeans',
    description: 'Classic slim-fit jeans crafted from premium stretch denim. Five-pocket styling with a mid-rise waist. The perfect everyday denim.',
    price: 22000,
    category: 'women',
    sizes: JSON.stringify(['24', '25', '26', '27', '28', '29', '30']),
    colors: JSON.stringify(['Indigo Blue', 'Light Wash', 'Black']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80'
    ]),
    stock: 60, featured: 0
  },
  {
    name: 'Silk Blend Slip Dress',
    description: 'Minimalist slip dress crafted from a luxurious silk-blend fabric. The bias cut drapes beautifully. Wear alone or layered over a crisp white tee.',
    price: 48000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
    colors: JSON.stringify(['Champagne', 'Black', 'Sage Green']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80'
    ]),
    stock: 18, featured: 1
  },
  {
    name: 'Oversized Blazer',
    description: 'Power dressing meets relaxed style in this oversized single-button blazer. Structured shoulders with a relaxed body. Equally at home in the boardroom or at brunch.',
    price: 55000,
    category: 'women',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Black', 'Ecru', 'Cobalt Blue']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80',
      'https://images.unsplash.com/photo-1614093302611-8efc4c3c0b5d?w=600&q=80'
    ]),
    stock: 22, featured: 0
  },

  // Men's
  {
    name: 'Oxford Button-Down Shirt',
    description: 'A timeless Oxford shirt in a classic fit. Woven from soft, breathable cotton for lasting comfort. Ideal for smart-casual and office wear.',
    price: 20000,
    category: 'men',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['White', 'Light Blue', 'Pink']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=600&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80'
    ]),
    stock: 55, featured: 1
  },
  {
    name: 'Slim Fit Chino Trousers',
    description: 'Versatile slim-fit chinos made from lightweight stretch cotton. Clean lines and a modern cut make these the perfect smart-casual trouser.',
    price: 27000,
    category: 'men',
    sizes: JSON.stringify(['28', '30', '32', '34', '36', '38']),
    colors: JSON.stringify(['Khaki', 'Navy', 'Olive', 'Stone']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80'
    ]),
    stock: 40, featured: 0
  },
  {
    name: 'Merino Wool Crewneck Sweater',
    description: 'Premium merino wool crewneck with a classic fit. Naturally temperature-regulating and supremely soft. A wardrobe cornerstone for any season.',
    price: 38000,
    category: 'men',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Navy', 'Burgundy', 'Forest Green', 'Grey Marl']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
      'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=600&q=80'
    ]),
    stock: 35, featured: 1
  },
  {
    name: 'Slim Fit Dark Wash Jeans',
    description: 'Modern slim-fit jeans in a deep indigo wash. Cut from premium selvedge denim for durability and a refined look. Designed to age beautifully.',
    price: 28000,
    category: 'men',
    sizes: JSON.stringify(['28', '30', '32', '34', '36']),
    colors: JSON.stringify(['Dark Indigo', 'Black']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
      'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600&q=80'
    ]),
    stock: 48, featured: 0
  },
  {
    name: 'Technical Bomber Jacket',
    description: 'Contemporary bomber jacket crafted from water-resistant technical fabric. Ribbed collar, cuffs, and hem with a clean minimalist design. Lightweight but surprisingly warm.',
    price: 58000,
    category: 'men',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Black', 'Olive', 'Navy']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'
    ]),
    stock: 20, featured: 1
  },
  {
    name: 'Linen Resort Shirt',
    description: 'Lightweight short-sleeve linen shirt with a camp collar. The ideal summer companion — relaxed fit with a subtle texture. Made from 100% washed linen.',
    price: 17000,
    category: 'men',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['White', 'Sky Blue', 'Sand', 'Sage']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80'
    ]),
    stock: 42, featured: 0
  },

  // Kids
  {
    name: 'Organic Cotton T-Shirt Set',
    description: 'Pack of 3 soft organic cotton t-shirts in cheerful colors. Pre-washed for extra softness. GOTS certified organic cotton, gentle on sensitive skin.',
    price: 12000,
    category: 'kids',
    sizes: JSON.stringify(['2T', '3T', '4T', '5T', '6', '7', '8']),
    colors: JSON.stringify(['Multi Pack']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80',
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80'
    ]),
    stock: 70, featured: 1
  },
  {
    name: 'Denim Dungarees',
    description: 'Classic denim dungarees with adjustable straps and a roomy bib pocket. Durable stonewash denim built to keep up with active little ones.',
    price: 15000,
    category: 'kids',
    sizes: JSON.stringify(['2T', '3T', '4T', '5T', '6', '7', '8']),
    colors: JSON.stringify(['Mid Blue', 'Light Blue']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80',
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80'
    ]),
    stock: 38, featured: 0
  },
  {
    name: 'Fleece Zip-Up Hoodie',
    description: 'Super-soft fleece hoodie with front zip and kangaroo pocket. Warm, cozy, and easy to layer. Machine washable for busy families.',
    price: 14000,
    category: 'kids',
    sizes: JSON.stringify(['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12']),
    colors: JSON.stringify(['Navy', 'Red', 'Pink', 'Grey']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80',
      'https://images.unsplash.com/photo-1548454782-15b189d129ab?w=600&q=80'
    ]),
    stock: 55, featured: 1
  },
  {
    name: 'Printed Leggings',
    description: 'Fun printed leggings with an elasticated waistband for all-day comfort. Soft jersey fabric with a hint of stretch. Great for school, play, and everything in between.',
    price: 8500,
    category: 'kids',
    sizes: JSON.stringify(['2T', '3T', '4T', '5T', '6', '7', '8']),
    colors: JSON.stringify(['Star Print', 'Floral Print', 'Stripe']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1542406775-ade58c52d2e4?w=600&q=80',
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80'
    ]),
    stock: 65, featured: 0
  },
  {
    name: 'Puffer Jacket',
    description: 'Lightweight puffer jacket with recycled fill. Packable into its own pocket for easy storage. Keeps little ones warm without the bulk.',
    price: 19000,
    category: 'kids',
    sizes: JSON.stringify(['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12']),
    colors: JSON.stringify(['Red', 'Navy', 'Purple', 'Teal']),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80',
      'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=600&q=80'
    ]),
    stock: 30, featured: 0
  },
];

const insert = db.prepare(`
  INSERT INTO products (name, description, price, category, sizes, colors, images, stock, featured)
  VALUES (@name, @description, @price, @category, @sizes, @colors, @images, @stock, @featured)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});

insertMany(products);

// Seed discount codes
const discounts = [
  { code: 'WELCOME10', type: 'percent', value: 10, min_order: 0, max_uses: null, expires_at: null, active: 1 },
  { code: 'KIGALI20', type: 'percent', value: 20, min_order: 50000, max_uses: 100, expires_at: null, active: 1 },
  { code: 'FLAT5000', type: 'fixed', value: 5000, min_order: 30000, max_uses: null, expires_at: null, active: 1 },
];
const insertDiscount = db.prepare(`INSERT INTO discount_codes (code, type, value, min_order, max_uses, expires_at, active) VALUES (@code, @type, @value, @min_order, @max_uses, @expires_at, @active)`);
discounts.forEach(d => insertDiscount.run(d));

console.log(`✓ Seeded ${products.length} products with RWF prices`);
console.log(`✓ Seeded ${discounts.length} discount codes: WELCOME10, KIGALI20, FLAT5000`);
console.log('✓ Admin: admin@eshop.com / admin123');
console.log('✓ Customer: jane@example.com / customer123');
