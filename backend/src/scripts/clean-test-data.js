import { supabaseAdmin } from '../config/supabase.js';

async function cleanup() {
  console.log('--- Starting Database Cleanup ---');

  // 1. Delete all order line items
  const { error: itemsErr } = await supabaseAdmin.from('order_items').delete().neq('id', 0);
  console.log('Deleted order_items:', itemsErr?.message || 'SUCCESS');

  // 2. Delete all orders
  const { error: ordersErr } = await supabaseAdmin.from('orders').delete().neq('id', 0);
  console.log('Deleted orders:', ordersErr?.message || 'SUCCESS');

  // 3. Products to keep: Clean soap, lotion, conditioner
  const keepProductIds = ['PROD_1790157499938', 'PROD_1790157228272', 'PROD_B1G1_1791264269960'];

  // Delete all promotions that do not belong to the active products
  const { data: allPromos } = await supabaseAdmin.from('promotions').select('id, product_id');
  const promoIdsToDelete = (allPromos || [])
    .filter(p => !keepProductIds.includes(p.product_id))
    .map(p => p.id);

  if (promoIdsToDelete.length > 0) {
    const { error: promoDeleteErr } = await supabaseAdmin
      .from('promotions')
      .delete()
      .in('id', promoIdsToDelete);
    console.log('Deleted stale promotions:', promoDeleteErr?.message || `Removed ${promoIdsToDelete.length} promos`);
  }

  // Delete all products that are NOT in keepProductIds (including 3543g and all duplicates)
  const { data: allProds } = await supabaseAdmin.from('products').select('id, name');
  const prodIdsToDelete = (allProds || [])
    .filter(p => !keepProductIds.includes(p.id))
    .map(p => p.id);

  if (prodIdsToDelete.length > 0) {
    const { error: prodDeleteErr } = await supabaseAdmin
      .from('products')
      .delete()
      .in('id', prodIdsToDelete);
    console.log('Deleted stale/duplicate products:', prodDeleteErr?.message || `Removed ${prodIdsToDelete.length} products`);
  }

  // Reset promo_sold counter to 0 for fresh start
  await supabaseAdmin
    .from('promotions')
    .update({ promo_sold: 0 })
    .eq('product_id', 'PROD_B1G1_1791264269960');

  // Verify remaining records
  const { data: remainingProds } = await supabaseAdmin.from('products').select('id, name, price, stock, is_deleted');
  const { data: remainingOrders } = await supabaseAdmin.from('orders').select('id');
  const { data: remainingPromos } = await supabaseAdmin.from('promotions').select('id, product_id, title, promo_stock, promo_sold');
  const { data: rates } = await supabaseAdmin.from('exchange_rates').select('*');

  console.log('Remaining Products in Store:', remainingProds);
  console.log('Remaining Orders count:', remainingOrders?.length || 0);
  console.log('Remaining Promotions:', remainingPromos);
  console.log('Exchange Rates:', rates);
  console.log('--- Cleanup Finished Successfully ---');
}

cleanup().catch(console.error);
