"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = validateCoupon;
const supabase_1 = require("../supabase");
const FALLBACK_COUPONS = {
    'LIFTZONE10': { percent: 10, desc: '10% Welcome Discount applied to entire order!' },
    'CHALK15': { percent: 15, desc: '15% Secret Chalk Scratch VIP Discount unlocked!' },
    'OBRERO20': { percent: 20, desc: '20% Butuan Lifter Community special discount!' },
    'CBUM25': { percent: 25, desc: '25% Olympian Champion deal applied!' }
};
async function validateCoupon(code) {
    const clean = String(code || '').trim().toUpperCase();
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('coupons')
                .select('*')
                .eq('code', clean)
                .eq('active', true)
                .single();
            if (!error && data) {
                return {
                    valid: true,
                    code: data.code,
                    percent: data.discount_percent,
                    message: data.description || `${data.discount_percent}% Discount applied!`,
                    source: 'supabase'
                };
            }
        }
        catch (err) {
            console.warn('Supabase coupon error, falling back to cache:', err);
        }
    }
    if (FALLBACK_COUPONS[clean]) {
        return {
            valid: true,
            code: clean,
            percent: FALLBACK_COUPONS[clean].percent,
            message: FALLBACK_COUPONS[clean].desc,
            source: 'verified_cache'
        };
    }
    return {
        valid: false,
        message: 'Invalid promo code. Try "LIFTZONE10" or scratch the gym chalk coupon above!'
    };
}
