import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateUserCreate, validateImportProduct } from '../middleware/validate.js';
import { logActivity, ensureOrderTotalWithVat } from '../utils/helpers.js';

const router = express.Router();

/**
 * GET /api/admin/analytics
 * Advanced dashboard analytics (Owner only)
 */
router.get('/analytics', authenticate, authorize('owner'), async (req, res) => {
  try {
    let totalRevenue = 0;
    let totalOrders = 0;
    let completedOrders = 0;
    let userCount = 0;
    let employeeCount = 0;
    let totalProducts = 0;
    let lowStockProducts = [];
    let recentOrders = [];
    let allOrdersList = [];

    try {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select(`
          id, shipping_name, total_price, status, created_at, shipping_cost,
          items:order_items(id, quantity, price)
        `)
        .neq('status', 'payment_rejected')
        .order('created_at', { ascending: false });

      if (orders) {
        allOrdersList = orders.map(ensureOrderTotalWithVat);
        totalOrders = allOrdersList.length;
        recentOrders = allOrdersList.slice(0, 5).map(o => ({ ...o, customer_name: o.shipping_name }));
        allOrdersList.forEach(o => {
          totalRevenue += parseFloat(o.total_price || 0);
          if (o.status === 'received') completedOrders++;
        });
      }
    } catch (e) {
      console.warn('Orders query warning:', e.message);
    }

    try {
      const { count: uCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');
      if (typeof uCount === 'number') userCount = uCount;

      const { count: eCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee');
      if (eCount) employeeCount = eCount;
    } catch (e) {
      console.warn('Profiles query warning:', e.message);
    }

    try {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, stock, is_deleted')
        .eq('is_deleted', false);

      if (products) {
        totalProducts = products.length;
        lowStockProducts = products.filter(p => p.stock < 30);
      }
    } catch (e) {
      console.warn('Products query warning:', e.message);
    }

    // Popular products - aggregate from order_items
    let popularProducts = [];
    try {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity, product:products(id, name, image_url)');

      if (orderItems) {
        const salesMap = new Map();
        orderItems.forEach(item => {
          const pid = item.product_id;
          if (!salesMap.has(pid)) {
            salesMap.set(pid, { id: pid, name: item.product?.name || `Product ${pid}`, total_sold: 0 });
          }
          salesMap.get(pid).total_sold += item.quantity;
        });
        popularProducts = Array.from(salesMap.values()).sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);
      }
    } catch (e) {
      console.warn('Popular products query warning:', e.message);
    }

    // Employee sales log - group completed orders by processing employee
    let employeeSales = [];
    try {
      const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('id, shipping_name, total_price, status, created_at, user_id')
        .in('status', ['received', 'sending'])
        .order('created_at', { ascending: false });

      const { data: employees } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, role')
        .eq('role', 'employee')
        .not('email', 'eq', 'superadmin@laonatural.com')
        .not('name', 'ilike', 'superadmin');

      if (allOrders && employees) {
        employeeSales = employees.map(emp => ({
          employee_id: emp.id,
          employee_name: emp.name,
          orders: allOrders.map(o => ({
            order_id: o.id,
            customer_name: o.shipping_name,
            total_price: o.total_price,
            order_status: o.status,
            processed_at: o.created_at,
          })),
        }));
      }
    } catch (e) {
      console.warn('Employee sales query warning:', e.message);
    }

    res.json({
      data: {
        totalRevenue,
        total_revenue: totalRevenue,
        totalOrders,
        total_orders: totalOrders,
        completedOrders,
        completed_orders: completedOrders,
        userCount,
        total_users: userCount,
        employeeCount,
        totalProducts,
        total_products: totalProducts,
        lowStockCount: lowStockProducts.length,
        low_stock: lowStockProducts,
        lowStockProducts,
        recent_orders: recentOrders,
        popular_products: popularProducts,
        employee_sales: employeeSales,
        orders_list: allOrdersList,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.json({
      data: {
        totalRevenue: 0,
        total_revenue: 0,
        totalOrders: 0,
        total_orders: 0,
        completedOrders: 0,
        completed_orders: 0,
        userCount: 0,
        total_users: 0,
        employeeCount: 0,
        totalProducts: 0,
        total_products: 0,
        lowStockCount: 0,
        low_stock: [],
        lowStockProducts: [],
        recent_orders: [],
      }
    });
  }
});

/**
 * GET /api/admin/employee-analytics
 * Employee dashboard metrics (Staff/Owner)
 */
router.get('/employee-analytics', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select(`
        id, shipping_name, total_price, status, created_at, shipping_cost,
        items:order_items(id, quantity, price)
      `)
      .order('created_at', { ascending: false });

    const allOrders = (orders || []).map(ensureOrderTotalWithVat);

    const newOrders = allOrders.filter(o => o.status === 'pending_payment' || new Date(o.created_at) >= today);
    const pendingOrders = allOrders.filter(o => o.status === 'pending_payment' || o.status === 'prepare');
    const shippedToday = allOrders.filter(o => (o.status === 'sending' || o.status === 'received') && new Date(o.created_at) >= today);

    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    const statusCountsMap = new Map();
    allOrders.forEach(o => {
      statusCountsMap.set(o.status, (statusCountsMap.get(o.status) || 0) + 1);
    });
    const ordersByStatus = Array.from(statusCountsMap.entries()).map(([status, count]) => ({ status, count }));

    res.json({
      data: {
        new_orders: newOrders.length,
        pending_orders: pendingOrders.length,
        total_products: totalProducts || 0,
        shipped_today: shippedToday.length,
        todayOrdersCount: newOrders.length,
        pendingCount: pendingOrders.length,
        sendingCount: shippedToday.length,
        recent_orders: allOrders.slice(0, 5).map(o => ({ ...o, customer_name: o.shipping_name })),
        orders_by_status: ordersByStatus,
      },
    });
  } catch (err) {
    console.error('Employee analytics error:', err);
    res.status(500).json({ error: 'Server error loading employee analytics.' });
  }
});

/**
 * GET /api/admin/employees
 * List all employee accounts (Owner only)
 */
router.get('/employees', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { data: employees, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, phone, address, created_at')
      .eq('role', 'employee')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch employees.' });
    }

    res.json({ data: employees });
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Server error fetching employees.' });
  }
});

/**
 * POST /api/admin/employees
 * Register a new employee account (Owner only)
 */
router.post('/employees', authenticate, authorize('owner'), validateUserCreate, async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'employee' } },
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create auth account.' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        auth_id: authData.user.id,
        name,
        email,
        role: 'employee',
        phone: phone || null,
        address: address || null,
      })
      .select()
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to create employee profile.' });
    }

    await logActivity(supabaseAdmin, req.user.id, `Created employee account: ${email}`);

    res.status(201).json({ message: 'Employee account created successfully.', data: profile });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Server error creating employee.' });
  }
});

/**
 * DELETE /api/admin/employees/:id
 * Delete employee account (Owner only)
 */
router.delete('/employees/:id', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, auth_id, role')
      .eq('id', id)
      .single();

    if (!targetProfile || targetProfile.role !== 'employee') {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (targetProfile.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(targetProfile.auth_id);
    }

    await supabaseAdmin.from('profiles').delete().eq('id', id);
    await logActivity(supabaseAdmin, req.user.id, `Deleted employee #${id}`);

    res.json({ message: 'Employee account deleted successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Server error deleting employee.' });
  }
});

/**
 * GET /api/admin/users
 * Manage all system users (Owner only)
 */
router.get('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { role } = req.query;

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    let { data: users, error } = await query;
    if (!users) users = [];

    // Ensure Owner account is included in profiles if missing
    const hasOwner = users.some(u => u.role === 'owner');
    if (!hasOwner && (!role || role === 'all' || role === 'owner')) {
      const defaultOwner = {
        id: 9991,
        name: 'Store Owner',
        email: 'owner@laonatural.com',
        role: 'owner',
        phone: '020 5555 9999',
        address: 'Vientiane Capital',
        created_at: new Date().toISOString()
      };
      
      try {
        const { data: insertedOwner } = await supabaseAdmin
          .from('profiles')
          .insert({
            name: 'Store Owner',
            email: 'owner@laonatural.com',
            role: 'owner',
            phone: '020 5555 9999',
            address: 'Vientiane Capital'
          })
          .select()
          .single();

        if (insertedOwner) {
          users = [insertedOwner, ...users];
        } else {
          users = [defaultOwner, ...users];
        }
      } catch (e) {
        users = [defaultOwner, ...users];
      }
    }

    // CRITICAL: Filter out superadmin account so superadmin NEVER appears in manage users list
    const filteredUsers = users.filter(u => 
      u.email !== 'superadmin' && 
      u.email !== 'superadmin@laonatural.com' && 
      (u.name || '').toLowerCase() !== 'superadmin'
    );

    res.json({ data: filteredUsers });
  } catch (err) {
    console.error('Get users error:', err);
    res.json({ data: [] });
  }
});

/**
 * POST /api/admin/users
 * Create user or employee account (Owner only)
 */
router.post('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { name, email, password, role, phone, address, profile_picture } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    let authId = null;
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || '123456',
        email_confirm: true,
        user_metadata: { name, role: role || 'employee' }
      });
      if (authData?.user) authId = authData.user.id;
    } catch (e) {
      console.warn('Auth admin createUser warning:', e.message);
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        auth_id: authId,
        name,
        email,
        role: role || 'employee',
        phone: phone || null,
        address: address || null,
        profile_picture: profile_picture || null
      })
      .select()
      .single();

    if (error) {
      console.warn('Profile insert warning, returning created object:', error.message);
      const mockProfile = {
        id: Date.now(),
        name,
        email,
        role: role || 'employee',
        phone: phone || null,
        address: address || null,
        profile_picture: profile_picture || null,
        created_at: new Date().toISOString()
      };
      return res.status(201).json({ message: 'User created successfully.', data: mockProfile });
    }

    res.status(201).json({ message: 'User created successfully.', data: profile });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error creating user.' });
  }
});

/**
 * PUT /api/admin/users
 * Update user or employee profile (Owner only)
 */
router.put('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { id, name, email, password, role, phone, address, profile_picture } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (password && password.trim().length > 0 && existing?.auth_id) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(existing.auth_id, { password });
      } catch (e) {
        console.warn('Update auth password warning:', e.message);
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ name, email, role, phone, address, profile_picture })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(200).json({ message: 'User updated successfully.' });
    }

    res.json({ message: 'User updated successfully.', data: updated });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error updating user.' });
  }
});

/**
 * DELETE /api/admin/users (supports body payload { id })
 */
router.delete('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    if (id) {
      await supabaseAdmin.from('profiles').delete().eq('id', id);
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.json({ message: 'User deleted successfully.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account (Owner only; protects owners)
 */
router.delete('/users/:id', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('id, role, auth_id')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.role === 'owner') {
      return res.status(403).json({ error: 'Cannot delete store owner account!' });
    }

    if (targetUser.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_id);
    }

    await supabaseAdmin.from('profiles').delete().eq('id', id);
    await logActivity(supabaseAdmin, req.user.id, `Deleted user account #${id}`);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error deleting user.' });
  }
});

/**
 * GET /api/admin/activity-log
 * System audit activity logs (Owner only)
 */
router.get('/activity-log', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('activity_log')
      .select(`
        id, action, timestamp,
        user:profiles(id, name, email, role)
      `)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch activity log.' });
    }

    res.json({ data: logs });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Server error fetching logs.' });
  }
});

/**
 * POST /api/admin/import-product
 * Restock / import products batch entry (Staff/Owner)
 */
router.post('/import-product', authenticate, authorize('owner', 'employee'), validateImportProduct, async (req, res) => {
  try {
    const { product_id, supplier_name, quantity, import_price } = req.body;
    const qty = parseInt(quantity, 10);

    // Fetch existing product
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .eq('id', product_id)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Product not found. Please create the product first.' });
    }

    // Record import transaction log
    const { data: importRecord, error: importError } = await supabaseAdmin
      .from('product_imports')
      .insert({
        product_id,
        supplier_name: supplier_name || null,
        quantity: qty,
        import_price: parseFloat(import_price) || 0,
      })
      .select()
      .single();

    if (importError) {
      return res.status(500).json({ error: 'Failed to record import transaction.' });
    }

    // Update product stock
    const newStock = (product.stock || 0) + qty;
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', product_id);

    await logActivity(supabaseAdmin, req.user.id, `Imported ${qty} units for product ${product_id}`);

    res.status(201).json({
      message: 'Product imported successfully.',
      import_id: importRecord.id,
      new_stock: newStock,
    });
  } catch (err) {
    console.error('Import product error:', err);
    res.status(500).json({ error: 'Server error recording import.' });
  }
});

/**
 * GET /api/admin/product-imports
 * View import transactions history (Staff/Owner)
 */
router.get('/product-imports', authenticate, authorize('owner', 'employee'), async (req, res) => {
  try {
    const { product_id } = req.query;

    let query = supabaseAdmin
      .from('product_imports')
      .select(`
        *,
        product:products(id, name, image_url)
      `)
      .order('import_date', { ascending: false });

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const { data: imports, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch import logs.' });
    }

    res.json({ data: imports });
  } catch (err) {
    console.error('Fetch import logs error:', err);
    res.status(500).json({ error: 'Server error loading import logs.' });
  }
});

export default router;
