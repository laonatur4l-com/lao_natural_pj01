import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting MySQL to Supabase PostgreSQL Data Migration...');

  // 1. Connect to local MySQL database
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'lao_natural_essentials',
  });

  console.log('✅ Connected to MySQL database.');

  try {
    // ─── 1. Migrate Categories ──────────────────────────────────────
    console.log('📦 Migrating categories...');
    const [categories] = await connection.query('SELECT * FROM categories');
    for (const cat of categories) {
      await supabase.from('categories').upsert({
        id: cat.id,
        name: cat.name,
      });
    }
    console.log(`  ✓ ${categories.length} categories migrated.`);

    // ─── 2. Migrate Users to Profiles ───────────────────────────────
    console.log('👤 Migrating users...');
    const [users] = await connection.query('SELECT * FROM users');
    for (const u of users) {
      // Create user in Supabase Auth if missing
      let authId = null;
      try {
        const { data: authUser } = await supabase.auth.admin.createUser({
          email: u.email,
          password: 'Password123!', // Default temporary password for migrated users
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role },
        });
        if (authUser && authUser.user) {
          authId = authUser.user.id;
        }
      } catch (err) {
        // User might already exist in Supabase Auth
      }

      await supabase.from('profiles').upsert({
        id: u.id,
        auth_id: authId,
        name: u.name,
        email: u.email,
        role: u.role,
        address: u.address || null,
        phone: u.phone || null,
        express_company: u.express_company || null,
        profile_picture: u.profile_picture || null,
      });
    }
    console.log(`  ✓ ${users.length} users migrated.`);

    // ─── 3. Migrate Products ─────────────────────────────────────────
    console.log('🛍️ Migrating products...');
    const [products] = await connection.query('SELECT * FROM products');
    for (const p of products) {
      await supabase.from('products').upsert({
        id: String(p.id),
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        size: p.size || null,
        price: p.price || 0,
        price_lak: p.price_lak || p.price || 0,
        price_thb: p.price_thb || 0,
        price_usd: p.price_usd || 0,
        import_price: p.import_price || 0,
        import_price_lak: p.import_price_lak || p.import_price || 0,
        import_price_thb: p.import_price_thb || 0,
        import_price_usd: p.import_price_usd || 0,
        currency: p.currency || 'LAK',
        import_currency: p.import_currency || 'LAK',
        stock: p.stock || 0,
        image_url: p.image_url || null,
        ingredients: p.ingredients || null,
        imported_by: p.imported_by || null,
        is_deleted: false,
      });
    }
    console.log(`  ✓ ${products.length} products migrated.`);

    // ─── 4. Migrate Orders & Order Items ────────────────────────────
    console.log('🧾 Migrating orders...');
    const [orders] = await connection.query('SELECT * FROM orders');
    for (const o of orders) {
      await supabase.from('orders').upsert({
        id: o.id,
        user_id: o.user_id,
        status: o.status,
        total_price: o.total_price,
        express_tracking: o.express_tracking || null,
        express_company: o.express_company || null,
        shipping_name: o.shipping_name || null,
        shipping_phone: o.shipping_phone || null,
        shipping_address: o.shipping_address || null,
        created_at: o.created_at,
      });
    }
    console.log(`  ✓ ${orders.length} orders migrated.`);

    console.log('🛒 Migrating order items...');
    const [orderItems] = await connection.query('SELECT * FROM order_items');
    for (const item of orderItems) {
      await supabase.from('order_items').upsert({
        id: item.id,
        order_id: item.order_id,
        product_id: String(item.product_id),
        quantity: item.quantity,
        price: item.price,
        size: item.size || null,
      });
    }
    console.log(`  ✓ ${orderItems.length} order items migrated.`);

    // ─── 5. Migrate Hero Banners & Distributors ──────────────────────
    console.log('🖼️ Migrating banners & distributors...');
    try {
      const [banners] = await connection.query('SELECT * FROM hero_banners');
      for (const b of banners) {
        await supabase.from('hero_banners').upsert({
          id: b.id,
          image_url: b.image_url,
          title: b.title || null,
          subtitle: b.subtitle || null,
          link_url: b.link_url || null,
        });
      }
    } catch {}

    try {
      const [distributors] = await connection.query('SELECT * FROM distributors');
      for (const d of distributors) {
        await supabase.from('distributors').upsert({
          id: d.id,
          name: d.name,
          address: d.address || null,
          image_url: d.image_url || null,
          map_url: d.map_url || null,
          facebook_url: d.facebook_url || null,
          website_url: d.website_url || null,
          phone: d.phone || null,
        });
      }
    } catch {}

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
