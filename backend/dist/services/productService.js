"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackProducts = void 0;
exports.getProducts = getProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const supabase_1 = require("../supabase");
exports.fallbackProducts = [
    {
        id: 0,
        title: 'CBUM Itholate Pre-Workout',
        brand: 'RAW Nutrition',
        category: 'Pre-Workouts',
        price: 4290,
        original_price: 4990,
        rating: 4.9,
        reviews_count: 312,
        stock: 40,
        type: 'S',
        emoji: '⚡',
        description: 'Formulated alongside 5x Classic Physique Olympian Chris Bumstead. Massive pumps, laser tunnel-vision focus, and zero jittery crash.',
        specs: ['40 Scoops / Servings', '350mg Dual-Source Caffeine', '6000mg Pure L-Citrulline', '3200mg Beta-Alanine', 'US FDA Lab Tested'],
        flavors: ['Sour Watermelon', 'Orange Mango', 'Blue Raspberry Burst'],
        batch_code: 'RAW-8821-CBUM',
        authenticity_seal: 'Direct USA Import • Lot 2026-A109 • Authenticity Seal Verified'
    },
    {
        id: 1,
        title: 'Thavage Pre-Workout',
        brand: 'RAW Nutrition',
        category: 'Pre-Workouts',
        price: 3890,
        original_price: 4290,
        rating: 4.8,
        reviews_count: 201,
        stock: 6,
        type: 'S',
        emoji: '⚡',
        description: 'The original hard-hitting pre-workout. High beta-alanine tingle with Alpha-GPC for ruthless mental drive on heavy compound lifts.',
        specs: ['40 Servings', '305mg Caffeine', 'Alpha-GPC 400mg', 'Nitrosigine 750mg'],
        flavors: ['Green Goblin Apple', 'Rocket Candy', 'Peach Rings'],
        batch_code: 'RAW-7712-THAV',
        authenticity_seal: 'Direct USA Import • Lot 2026-T901 • Tamper Sealed'
    },
    {
        id: 2,
        title: 'Clear Whey Isolate 2lb',
        brand: 'Applied Nutrition',
        category: 'Whey Protein',
        price: 2990,
        original_price: 3490,
        rating: 4.7,
        reviews_count: 148,
        stock: 60,
        type: 'S',
        emoji: '🥛',
        description: 'Ultra-hydrolyzed whey isolate that drinks like refreshing fruit juice instead of a heavy milky shake. 90g protein per 100g.',
        specs: ['21g Protein / Serving', '0g Sugar & Fat', 'Under 90 Calories', 'Informed-Sport Certified'],
        flavors: ['Strawberry Kiwi', 'Cranberry & Pomegranate', 'Tropical Fruit Twist'],
        batch_code: 'APN-4491-CLW',
        authenticity_seal: 'UK Informed-Sport Tested • WADA Compliant • Batch #4491'
    },
    {
        id: 3,
        title: 'Whey Protein 5lb',
        brand: 'Ghost',
        category: 'Whey Protein',
        price: 5190,
        original_price: 5990,
        rating: 4.9,
        reviews_count: 420,
        stock: 30,
        type: 'S',
        emoji: '🥛',
        description: '100% transparent whey blend containing isolate, concentrate, and hydrolyzed whey with genuine digestive enzymes for zero bloating.',
        specs: ['25g 100% Whey Blend', 'Soy-Free & Gluten-Free', 'Full Disclosure Label', 'Digestive Enzymes Added'],
        flavors: ['Cereal Milk™', 'Milk Chocolate', 'Marshmallow Cereal'],
        batch_code: 'GHO-1102-W5',
        authenticity_seal: 'Official US Distributor Channel • Sealed Hologram Intact'
    },
    {
        id: 4,
        title: 'Creatine Monohydrate 300g',
        brand: 'RAW Nutrition',
        category: 'Creatine',
        price: 1590,
        original_price: 1890,
        rating: 4.8,
        reviews_count: 530,
        stock: 80,
        type: 'S',
        emoji: '💊',
        description: '100% pure micronized creatine monohydrate (200 mesh). Dissolves instantly without grit, boosting ATP regeneration and cellular water volume.',
        specs: ['60 Servings (5g each)', 'Micronized 200 Mesh', 'Zero Fillers or Flavors', 'GMP Certified Facility'],
        flavors: ['Unflavored Pure Micronized'],
        batch_code: 'RAW-3392-CR',
        authenticity_seal: 'HPLC 99.9% Purity Verified • Batch #3392'
    },
    {
        id: 5,
        title: 'Creapure Creatine',
        brand: 'Applied Nutrition',
        category: 'Creatine',
        price: 1790,
        original_price: 1790,
        rating: 4.7,
        reviews_count: 77,
        stock: 0,
        type: 'S',
        emoji: '💊',
        description: 'Synthesized in Germany by Alzchem Trostberg GmbH. The purest, benchmark-grade creatine monohydrate known in sports science.',
        specs: ['Made in Germany', 'Creapure® Gold Standard', 'Zero DCD/DHT byproducts', 'Halal & Kosher Certified'],
        flavors: ['Unflavored Creapure'],
        batch_code: 'APN-8802-CREA',
        authenticity_seal: 'Alzchem Germany Certificate of Analysis #8802'
    },
    {
        id: 6,
        title: '11-Gauge Leg Press 45°',
        brand: 'Hammer Strength',
        category: 'Leg Machines',
        price: 78500,
        original_price: 92000,
        rating: 4.9,
        reviews_count: 12,
        stock: 3,
        type: 'E',
        emoji: '🦵',
        description: 'Commercial heavy-duty 45-degree linear leg press. Oversized diamond-plate foot deck, dual safety stops, and 850kg maximum plate loading horn capacity.',
        specs: ['11-Gauge 50x100mm Steel', 'Industrial Linear Bearings', '850kg Rated Capacity', 'Adjustable Lumbar Angle'],
        flavors: ['Matte Black / Charcoal', 'Gunmetal Grey / Neon Accents'],
        batch_code: 'HS-LP45-2026',
        authenticity_seal: 'Hammer Strength Commercial Fitout Series • Heavy Steel Inspected',
        image: '/equipment/leg-press-45.png'
    },
    {
        id: 7,
        title: 'Commercial Smith Machine',
        brand: 'Hammer Strength',
        category: 'Smith Machines',
        price: 64900,
        original_price: 74900,
        rating: 4.8,
        reviews_count: 18,
        stock: 5,
        type: 'E',
        emoji: '🏗️',
        description: 'Counterbalanced 7-degree biomechanical angle smith machine. Silky smooth gliding guide rods for safe self-spotted benching and heavy squats.',
        specs: ['Counterbalanced Bar (7kg Net)', '7° Bio-Angle Path', 'Commercial Linear Rods', '6 Integrated Plate Pegs'],
        flavors: ['Matte Black / Steel', 'Midnight Carbon'],
        batch_code: 'HS-SM7-9910',
        authenticity_seal: 'Commercial Gym Fitout Grade • ISO9001 Certified',
        image: '/equipment/smith-machine.png'
    },
    {
        id: 8,
        title: 'Olympic Power Rack',
        brand: 'Inzer',
        category: 'Smith Machines',
        price: 38500,
        original_price: 42000,
        rating: 4.7,
        reviews_count: 24,
        stock: 8,
        type: 'E',
        emoji: '🏗️',
        description: 'Heavy 3x3-inch uprights with Westside 1-inch hole spacing through the bench press zone. Includes UHMW sandwich J-cups and heavy safety straps.',
        specs: ['3x3" 11-Gauge Uprights', 'Westside Hole Spacing', 'UHMW Lined J-Cups', 'Multi-Grip Chin-Up Bar'],
        flavors: ['Industrial Crinkle Black', 'Military OD Green'],
        batch_code: 'INZ-PR33-2026',
        authenticity_seal: 'Inzer Advance Designs Spec • Lifetime Structural Warranty',
        image: '/equipment/power-rack.png'
    },
    {
        id: 9,
        title: 'Hex Dumbbell Set 5–50kg',
        brand: 'Inzer',
        category: 'Free Weights',
        price: 48900,
        original_price: 55000,
        rating: 4.8,
        reviews_count: 31,
        stock: 4,
        type: 'E',
        emoji: '🏋️',
        description: 'Virgin rubber-encased solid steel hex dumbbells with contoured ergonomic chrome knurled handles. Dead-bounce and noise dampening.',
        specs: ['Pairs: 5, 10, 15, 20, 25, 30, 40, 50kg', 'Virgin Rubber Encasing', 'Hard Chrome Ergo Grip', 'Zero-Loosen Welded Heads'],
        flavors: ['Classic Matte Rubber'],
        batch_code: 'INZ-HEX-550',
        authenticity_seal: 'Calibrated ±1% Tolerance • Heavy Commercial Gym Rated',
        image: '/equipment/hex-dumbbells.png'
    },
    {
        id: 10,
        title: 'Hack Squat Machine',
        brand: 'Hammer Strength',
        category: 'Leg Machines',
        price: 59900,
        original_price: 66000,
        rating: 4.6,
        reviews_count: 9,
        stock: 2,
        type: 'E',
        emoji: '🦵',
        description: 'Quad-isolation specialist machine. Ergonomic shoulder pads with dual handles and easy-reach lockout mechanism for safe failure training.',
        specs: ['45° Quad Isolation Angle', 'Dual Weight Horns', 'High-Density Foam Pads', 'Quick-Flip Safety Release'],
        flavors: ['Onyx Black / Yellow Trim', 'Onyx Black / Neon Green'],
        batch_code: 'HS-HSQ-441',
        authenticity_seal: 'Biomechanically Validated Force Curve • Hammer Strength',
        image: '/equipment/hack-squat.png'
    },
    {
        id: 11,
        title: 'Powerlifting Belt 10mm',
        brand: 'Inzer',
        category: 'Free Weights',
        price: 4900,
        original_price: 5600,
        rating: 4.9,
        reviews_count: 140,
        stock: 35,
        type: 'E',
        emoji: '🏋️',
        description: 'IPF Approved Forever Lever Belt. Top-grade genuine sole leather with indestructible nickel-plated steel alloy lever buckle.',
        specs: ['10mm Solid Sole Leather', 'Patented Quick-Lever Buckle', 'IPF Approved for Competition', 'Four Rows Lock-Stitching'],
        flavors: ['Stealth Black Suede', 'Royal Crimson Red', 'Emerald Zone Green'],
        batch_code: 'INZ-BELT-10MM',
        authenticity_seal: 'IPF Competition Approved • Serialized Stamp Authenticated',
        image: '/equipment/belt-10mm.png'
    },
    {
        id: 12,
        title: 'Calibrated Olympic Steel Plates 150kg Set',
        brand: 'Inzer',
        category: 'Free Weights',
        price: 36500,
        original_price: 41000,
        rating: 5.0,
        reviews_count: 42,
        stock: 6,
        type: 'E',
        emoji: '🪙',
        description: 'Precision competition thin-cut cast steel discs calibrated within ±10 grams. Color-coded chromatic vibration powdercoat with raised lettering.',
        specs: ['Pairs: 25kg, 20kg, 15kg, 10kg, 5kg', 'Calibrated ±10g IPF Spec', 'Ultra-Slim 20mm Profile', 'Precision 50.4mm Collar Hole'],
        flavors: ['IPF Competition Chromatic', 'Stealth Matte Black Edition'],
        batch_code: 'INZ-CAL-150KG',
        authenticity_seal: 'Certified Weight Calibration Certificate Included',
        image: '/equipment/calibrated-plates.png'
    },
    {
        id: 13,
        title: 'Cerakote Olympic Barbell 20kg',
        brand: 'Hammer Strength',
        category: 'Free Weights',
        price: 14800,
        original_price: 16900,
        rating: 4.9,
        reviews_count: 89,
        stock: 14,
        type: 'E',
        emoji: '🏋️',
        description: 'Cerakote coated 28mm shaft with volcano knurling and dual powerlifting/weightlifting marks. 5x needle bearings per sleeve for frictionless whip.',
        specs: ['190,000 PSI Tensile Steel', '5 Needle Bearings Per Sleeve', 'Cerakote Corrosion Shield', '1500lb Static Weight Rating'],
        flavors: ['Zone Emerald Green / Black Sleeves', 'Stealth Gunmetal Grey'],
        batch_code: 'HS-BAR20-CER',
        authenticity_seal: 'Commercial Spec • 190k PSI Stress Lab Tested',
        image: '/equipment/cerakote-barbell.png'
    },
    {
        id: 14,
        title: 'Commercial 11-Gauge Adjustable Bench',
        brand: 'Hammer Strength',
        category: 'Free Weights',
        price: 21900,
        original_price: 25500,
        rating: 4.8,
        reviews_count: 33,
        stock: 7,
        type: 'E',
        emoji: '🪑',
        description: 'Laser-cut 11-gauge steel commercial ladder bench. 7 backrest angles from -15° decline to 85° military press with zero pad gap.',
        specs: ['11-Gauge 3x3 Steel Frame', '7 Back & 3 Seat Adjustments', 'Commercial High-Density Vinyl', 'Built-in Transport Handle & Wheels'],
        flavors: ['Matte Black / Charcoal', 'Matte Black / Neon Green Stitching'],
        batch_code: 'HS-ADJB-11G',
        authenticity_seal: 'Commercial Gym Fitout Grade • 1,000lb Load Rated',
        image: '/equipment/adjustable-bench.png'
    }
];
async function getProducts(category, type) {
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            let query = supabase_1.supabase.from('products').select('*').order('id', { ascending: true });
            if (category)
                query = query.eq('category', category);
            if (type)
                query = query.eq('type', type);
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
                return data;
            }
        }
        catch (err) {
            console.warn('Supabase query error, falling back to local dataset:', err);
        }
    }
    return exports.fallbackProducts.filter(p => (!category || p.category === category) && (!type || p.type === type));
}
async function createProduct(payload) {
    const newId = exports.fallbackProducts.length > 0 ? Math.max(...exports.fallbackProducts.map(p => p.id)) + 1 : 0;
    const item = {
        id: newId,
        title: payload.title || payload.t || 'New SKU',
        brand: payload.brand || payload.b || 'Lifting Zone Gear',
        category: payload.category || payload.c || 'Supplements',
        price: Number(payload.price || payload.p || 1990),
        original_price: Number(payload.originalPrice || payload.o || 2490),
        rating: 5.0,
        reviews_count: 1,
        stock: Number(payload.stock !== undefined ? payload.stock : 25),
        type: payload.type || payload.ty || 'S',
        emoji: payload.emoji || payload.e || '⚡',
        description: payload.description || payload.desc || '',
        specs: Array.isArray(payload.specs) ? payload.specs : ['100% Quality Inspected'],
        flavors: Array.isArray(payload.flavors) ? payload.flavors : ['Standard Edition'],
        batch_code: payload.batchCode || `LZO-${Math.floor(1000 + Math.random() * 9000)}`,
        authenticity_seal: 'Direct USA/UK Import Verified',
        image: payload.image || undefined
    };
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            const { data, error } = await supabase_1.supabase.from('products').insert(item).select().single();
            if (!error && data)
                return data;
        }
        catch (err) {
            console.warn('Supabase insert notice:', err);
        }
    }
    exports.fallbackProducts.push(item);
    return item;
}
async function updateProduct(id, payload) {
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            const { data, error } = await supabase_1.supabase.from('products').update(payload).eq('id', id).select().single();
            if (!error && data)
                return data;
        }
        catch (err) {
            console.warn('Supabase update notice:', err);
        }
    }
    const idx = exports.fallbackProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
        exports.fallbackProducts[idx] = { ...exports.fallbackProducts[idx], ...payload };
        return exports.fallbackProducts[idx];
    }
    return null;
}
async function deleteProduct(id) {
    if ((0, supabase_1.isSupabaseConfigured)()) {
        try {
            await supabase_1.supabase.from('products').delete().eq('id', id);
        }
        catch (err) {
            console.warn('Supabase delete notice:', err);
        }
    }
    const idx = exports.fallbackProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
        return exports.fallbackProducts.splice(idx, 1)[0];
    }
    return null;
}
