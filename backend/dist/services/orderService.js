"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
const supabase_1 = require("../supabase");
async function createOrder(input) {
    const { items, customer, deliveryMethod, paymentMethod, coupon } = input;
    if (!items || Object.keys(items).length === 0) {
        throw new Error('Order items cannot be empty');
    }
    const orderNumber = `LZO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const estimatedDelivery = deliveryMethod === 'butuan-express'
        ? 'Same-Day Motorbike Express (Within 2-4 Hours in Butuan City)'
        : 'Door-to-Door Cargo Express (2-3 Business Days nationwide)';
    // If Supabase is configured, record into database
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            const { data: orderData, error: orderError } = await supabase_1.supabase
                .from('orders')
                .insert({
                order_number: orderNumber,
                customer_name: customer.name || 'Valued Lifter',
                customer_phone: customer.phone || 'N/A',
                customer_address: customer.address || 'Salvador Calo St., Butuan City',
                delivery_method: deliveryMethod,
                payment_method: paymentMethod,
                subtotal: 0,
                total_amount: 0,
                coupon_code: coupon?.code || null,
                status: 'Confirmed & Queued for Packing'
            })
                .select()
                .single();
            if (!orderError && orderData) {
                return {
                    success: true,
                    orderNumber,
                    orderId: orderData.id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    address: customer.address,
                    deliveryMethod,
                    estimatedDelivery,
                    paymentMethod,
                    couponApplied: coupon || null,
                    status: 'Confirmed & Queued for Packing',
                    source: 'supabase'
                };
            }
        }
        catch (err) {
            console.warn('Supabase order creation notice:', err);
        }
    }
    return {
        success: true,
        orderNumber,
        customerName: customer.name || 'Valued Lifter',
        customerPhone: customer.phone || 'N/A',
        address: customer.address || 'Salvador Calo St., Obrero, Butuan City',
        deliveryMethod,
        estimatedDelivery,
        paymentMethod,
        couponApplied: coupon || null,
        status: 'Confirmed & Queued for Packing',
        source: 'local_fulfillment'
    };
}
