-- =============================================================================
-- LIFTING ZONE OBRERO — SUPABASE SEED DATA
-- Populate initial verified products, coupons, and lab certifications
-- =============================================================================

-- 1. Insert Products
INSERT INTO public.products (id, title, brand, category, price, original_price, rating, reviews_count, stock, type, emoji, description, specs, flavors, batch_code, authenticity_seal)
VALUES
(
    0,
    'CBUM Itholate Pre-Workout',
    'RAW Nutrition',
    'Pre-Workouts',
    4290,
    4990,
    4.9,
    312,
    40,
    'S',
    '⚡',
    'Formulated alongside 5x Classic Physique Olympian Chris Bumstead. Massive pumps, laser tunnel-vision focus, and zero jittery crash.',
    '["40 Scoops / Servings", "350mg Dual-Source Caffeine", "6000mg Pure L-Citrulline", "3200mg Beta-Alanine", "US FDA Lab Tested"]'::jsonb,
    '["Sour Watermelon", "Orange Mango", "Blue Raspberry Burst"]'::jsonb,
    'RAW-8821-CBUM',
    'Direct USA Import • Lot 2026-A109 • Authenticity Seal Verified'
),
(
    1,
    'Thavage Pre-Workout',
    'RAW Nutrition',
    'Pre-Workouts',
    3890,
    4290,
    4.8,
    201,
    6,
    'S',
    '⚡',
    'The original hard-hitting pre-workout. High beta-alanine tingle with Alpha-GPC for ruthless mental drive on heavy compound lifts.',
    '["40 Servings", "305mg Caffeine", "Alpha-GPC 400mg", "Nitrosigine 750mg"]'::jsonb,
    '["Green Goblin Apple", "Rocket Candy", "Peach Rings"]'::jsonb,
    'RAW-7712-THAV',
    'Direct USA Import • Lot 2026-T901 • Tamper Sealed'
),
(
    2,
    'Clear Whey Isolate 2lb',
    'Applied Nutrition',
    'Whey Protein',
    2990,
    3490,
    4.7,
    148,
    60,
    'S',
    '🥛',
    'Ultra-hydrolyzed whey isolate that drinks like refreshing fruit juice instead of a heavy milky shake. 90g protein per 100g.',
    '["21g Protein / Serving", "0g Sugar & Fat", "Under 90 Calories", "Informed-Sport Certified"]'::jsonb,
    '["Strawberry Kiwi", "Cranberry & Pomegranate", "Tropical Fruit Twist"]'::jsonb,
    'APN-4491-CLW',
    'UK Informed-Sport Tested • WADA Compliant • Batch #4491'
),
(
    3,
    'Whey Protein 5lb',
    'Ghost',
    'Whey Protein',
    5190,
    5990,
    4.9,
    420,
    30,
    'S',
    '🥛',
    '100% transparent whey blend containing isolate, concentrate, and hydrolyzed whey with genuine digestive enzymes for zero bloating.',
    '["25g 100% Whey Blend", "Soy-Free & Gluten-Free", "Full Disclosure Label", "Digestive Enzymes Added"]'::jsonb,
    '["Cereal Milk™", "Milk Chocolate", "Marshmallow Cereal"]'::jsonb,
    'GHO-1102-W5',
    'Official US Distributor Channel • Sealed Hologram Intact'
),
(
    4,
    'Creatine Monohydrate 300g',
    'RAW Nutrition',
    'Creatine',
    1590,
    1890,
    4.8,
    530,
    80,
    'S',
    '💊',
    '100% pure micronized creatine monohydrate (200 mesh). Dissolves instantly without grit, boosting ATP regeneration and cellular water volume.',
    '["60 Servings (5g each)", "Micronized 200 Mesh", "Zero Fillers or Flavors", "GMP Certified Facility"]'::jsonb,
    '["Unflavored Pure Micronized"]'::jsonb,
    'RAW-3392-CR',
    'HPLC 99.9% Purity Verified • Batch #3392'
),
(
    5,
    'Creapure Creatine',
    'Applied Nutrition',
    'Creatine',
    1790,
    1790,
    4.7,
    77,
    0,
    'S',
    '💊',
    'Synthesized in Germany by Alzchem Trostberg GmbH. The purest, benchmark-grade creatine monohydrate known in sports science.',
    '["Made in Germany", "Creapure® Gold Standard", "Zero DCD/DHT byproducts", "Halal & Kosher Certified"]'::jsonb,
    '["Unflavored Creapure"]'::jsonb,
    'APN-8802-CREA',
    'Alzchem Germany Certificate of Analysis #8802'
),
(
    6,
    '11-Gauge Leg Press 45°',
    'Hammer Strength',
    'Leg Machines',
    78500,
    92000,
    4.9,
    12,
    3,
    'E',
    '🦵',
    'Commercial heavy-duty 45-degree linear leg press. Oversized diamond-plate foot deck, dual safety stops, and 850kg maximum plate loading horn capacity.',
    '["11-Gauge 50x100mm Steel", "Industrial Linear Bearings", "850kg Rated Capacity", "Adjustable Lumbar Angle"]'::jsonb,
    '["Matte Black / Charcoal", "Gunmetal Grey / Neon Accents"]'::jsonb,
    'HS-LP45-2026',
    'Hammer Strength Commercial Fitout Series • Heavy Steel Inspected'
),
(
    7,
    'Commercial Smith Machine',
    'Hammer Strength',
    'Smith Machines',
    64900,
    74900,
    4.8,
    18,
    5,
    'E',
    '🏗️',
    'Counterbalanced 7-degree biomechanical angle smith machine. Silky smooth gliding guide rods for safe self-spotted benching and heavy squats.',
    '["Counterbalanced Bar (7kg Net)", "7° Bio-Angle Path", "Commercial Linear Rods", "6 Integrated Plate Pegs"]'::jsonb,
    '["Matte Black / Steel", "Midnight Carbon"]'::jsonb,
    'HS-SM7-9910',
    'Commercial Gym Fitout Grade • ISO9001 Certified'
),
(
    8,
    'Olympic Power Rack',
    'Inzer',
    'Smith Machines',
    38500,
    42000,
    4.7,
    24,
    8,
    'E',
    '🏗️',
    'Heavy 3x3-inch uprights with Westside 1-inch hole spacing through the bench press zone. Includes UHMW sandwich J-cups and heavy safety straps.',
    '["3x3\" 11-Gauge Uprights", "Westside Hole Spacing", "UHMW Lined J-Cups", "Multi-Grip Chin-Up Bar"]'::jsonb,
    '["Industrial Crinkle Black", "Military OD Green"]'::jsonb,
    'INZ-PR33-2026',
    'Inzer Advance Designs Spec • Lifetime Structural Warranty'
),
(
    9,
    'Hex Dumbbell Set 5–50kg',
    'Inzer',
    'Free Weights',
    48900,
    55000,
    4.8,
    31,
    4,
    'E',
    '🏋️',
    'Virgin rubber-encased solid steel hex dumbbells with contoured ergonomic chrome knurled handles. Dead-bounce and noise dampening.',
    '["Pairs: 5, 10, 15, 20, 25, 30, 40, 50kg", "Virgin Rubber Encasing", "Hard Chrome Ergo Grip", "Zero-Loosen Welded Heads"]'::jsonb,
    '["Classic Matte Rubber"]'::jsonb,
    'INZ-HEX-550',
    'Calibrated ±1% Tolerance • Heavy Commercial Gym Rated'
),
(
    10,
    'Hack Squat Machine',
    'Hammer Strength',
    'Leg Machines',
    59900,
    66000,
    4.6,
    9,
    2,
    'E',
    '🦵',
    'Quad-isolation specialist machine. Ergonomic shoulder pads with dual handles and easy-reach lockout mechanism for safe failure training.',
    '["45° Quad Isolation Angle", "Dual Weight Horns", "High-Density Foam Pads", "Quick-Flip Safety Release"]'::jsonb,
    '["Onyx Black / Yellow Trim", "Onyx Black / Neon Green"]'::jsonb,
    'HS-HSQ-441',
    'Biomechanically Validated Force Curve • Hammer Strength'
),
(
    11,
    'Powerlifting Belt 10mm',
    'Inzer',
    'Free Weights',
    4900,
    5600,
    4.9,
    140,
    35,
    'E',
    '🏋️',
    'IPF Approved Forever Lever Belt. Top-grade genuine sole leather with indestructible nickel-plated steel alloy lever buckle.',
    '["10mm Solid Sole Leather", "Patented Quick-Lever Buckle", "IPF Approved for Competition", "Four Rows Lock-Stitching"]'::jsonb,
    '["Stealth Black Suede", "Royal Crimson Red", "Emerald Zone Green"]'::jsonb,
    'INZ-BELT-10MM',
    'IPF Competition Approved • Serialized Stamp Authenticated'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock;

-- Adjust sequence to continue after seeded IDs
SELECT setval('products_id_seq', (SELECT MAX(id) FROM public.products));

-- 2. Insert Coupons
INSERT INTO public.coupons (code, discount_percent, description, active)
VALUES
('LIFTZONE10', 10, '10% Welcome Discount applied to entire order!', true),
('CHALK15', 15, '15% Secret Chalk Scratch VIP Discount unlocked!', true),
('OBRERO20', 20, '20% Butuan Lifter Community special discount!', true),
('CBUM25', 25, '25% Olympian Champion deal applied!', true)
ON CONFLICT (code) DO UPDATE SET
    discount_percent = EXCLUDED.discount_percent;

-- 3. Insert Batch Lab Verifications
INSERT INTO public.batch_verifications (batch_code, brand, product_name, production_date, expiry_date, purity, origin, fda_registration, lab_notes, verified)
VALUES
(
    'RAW-8821-CBUM',
    'RAW Nutrition USA',
    'CBUM Itholate Pre-Workout',
    'Jan 2026',
    'Jan 2028',
    '99.9% Active Compound Spec',
    'Miami, Florida, USA',
    'FDA-REG# 18942-004',
    'Heavy metal screen passed (Lead < 0.01ppm, Cadmium ND). WADA banned substance tested negative.',
    true
),
(
    'RAW-7712-THAV',
    'RAW Nutrition USA',
    'Thavage Pre-Workout',
    'Feb 2026',
    'Feb 2028',
    '100% Label Claim Compliance',
    'Miami, Florida, USA',
    'FDA-REG# 18942-004',
    'HPLC potency assay verified. Moisture content 1.8%.',
    true
),
(
    'APN-4491-CLW',
    'Applied Nutrition UK',
    'Clear Whey Isolate',
    'Dec 2025',
    'Dec 2027',
    '90.2g Protein / 100g Dry Basis',
    'Liverpool, United Kingdom',
    'UK-MHRA-REG# 9942',
    'Informed-Sport Batch Tested #L4491-ISO. Lactose < 0.1g.',
    true
),
(
    'GHO-1102-W5',
    'GHOST Lifestyle',
    'Ghost 100% Whey 5lb',
    'Nov 2025',
    'Nov 2027',
    '25.3g Protein Verified per scoop',
    'Chicago, Illinois, USA',
    'FDA-REG# 77102-09',
    'Full disclosure enzymatic breakdown tested. Zero amino spiking.',
    true
),
(
    'RAW-3392-CR',
    'RAW Nutrition USA',
    'Creatine Monohydrate 300g',
    'Jan 2026',
    'Jan 2029',
    '99.95% HPLC Micronized Mesh 200',
    'Miami, Florida, USA',
    'FDA-REG# 18942-004',
    'Microbiological assay clear. Instant water dispersion verified.',
    true
),
(
    'APN-8802-CREA',
    'Alzchem Trostberg GmbH',
    'Creapure® Creatine',
    'Oct 2025',
    'Oct 2029',
    '99.99% Creapure® Standard',
    'Trostberg, Bavaria, Germany',
    'EU-ALZCHEM-CERT# 8802-DE',
    'Zero dicyandiamide (DCD) and dihydrotriazine (DHT) detectable.',
    true
)
ON CONFLICT (batch_code) DO NOTHING;
