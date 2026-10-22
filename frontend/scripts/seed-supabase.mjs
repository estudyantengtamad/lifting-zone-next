import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

let env = process.env
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let val = match[2] || ''
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      env[match[1]] = val.trim()
    }
  })
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://zcxcivjzasmdcqmbbfyb.supabase.co'
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing in environment or .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const products = [
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
    authenticity_seal: 'Direct USA Import • Lot 2026-A109 • Authenticity Seal Verified',
    image: '/supplements/cbum-itholate.png'
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
    authenticity_seal: 'Direct USA Import • Lot 2026-T901 • Tamper Sealed',
    image: '/supplements/thavage-pre-workout.png'
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
    authenticity_seal: 'UK Import • Informed Sport Batch Verified',
    image: '/supplements/clear-whey-isolate.png'
  },
  {
    id: 3,
    title: 'Critical Whey Blend 4.4lb',
    brand: 'Applied Nutrition',
    category: 'Whey Protein',
    price: 3690,
    original_price: 4190,
    rating: 4.8,
    reviews_count: 260,
    stock: 45,
    type: 'S',
    emoji: '🥛',
    description: 'Tri-phase whey protein blend containing Whey Concentrate, Whey Isolate, and Hydrolyzed Whey. 24g protein with rich milkshake taste.',
    specs: ['24g Protein / Serving', '4.8g BCAAs', 'Gluten-Free', 'Halal Certified'],
    flavors: ['White Chocolate Raspberry', 'Chocolate Buena', 'Vanilla Ice Cream'],
    batch_code: 'APN-9912-CRIT',
    authenticity_seal: 'UK Import • Halal & GMP Certified Batch',
    image: '/supplements/critical-whey-blend.png'
  },
  {
    id: 4,
    title: 'Ghost Legend All-Out Pre-Workout',
    brand: 'Ghost Lifestyle',
    category: 'Pre-Workouts',
    price: 4190,
    original_price: 4690,
    rating: 4.9,
    reviews_count: 175,
    stock: 12,
    type: 'S',
    emoji: '👻',
    description: 'Maximum stim formula with 400mg total caffeine, 6g full-yield Citrulline, and licensed Sonic Ocean Water flavor.',
    specs: ['20 Full Scoops', '400mg Caffeine', '6g L-Citrulline', '3.2g Beta-Alanine'],
    flavors: ['Sonic Ocean Water', 'Blue Raspberry', 'Sour Pink Lemonade'],
    batch_code: 'GHT-3310-ALLOUT',
    authenticity_seal: 'Direct USA Import • Authentic Ghost Hologram',
    image: '/supplements/ghost-legend.png'
  },
  {
    id: 5,
    title: 'Ghost 100% Whey Protein',
    brand: 'Ghost Lifestyle',
    category: 'Whey Protein',
    price: 3990,
    original_price: 4490,
    rating: 4.9,
    reviews_count: 340,
    stock: 30,
    type: 'S',
    emoji: '👻',
    description: '100% transparent whey blend made with real Cinnabon cinnamon and real cereal pieces. Digestible digestive enzymes included.',
    specs: ['25g Pure Whey Isolate & Concentrate', 'Digestive Enzymes Included', 'Real Cinnabon Flavoring', 'Zero Amino Spiking'],
    flavors: ['Cinnabon', 'Oreo Cookie', 'Chips Ahoy!'],
    batch_code: 'GHT-1102-WHEY',
    authenticity_seal: 'Direct USA Import • Tamper Band Verified',
    image: '/supplements/ghost-whey.png'
  },
  {
    id: 6,
    title: 'Pure Creapure® Creatine 500g',
    brand: 'Applied Nutrition',
    category: 'Creatine',
    price: 1890,
    original_price: 2190,
    rating: 5.0,
    reviews_count: 512,
    stock: 100,
    type: 'S',
    emoji: '💪',
    description: 'The purest creatine monohydrate manufactured by Alzchem Trostberg GmbH in Germany. 99.99% pure HPLC tested.',
    specs: ['100 Servings (5g)', 'Creapure® Patented Source', 'Unflavored - Mixes Clean', 'Zero Bloat'],
    flavors: ['Unflavored Micronized'],
    batch_code: 'APN-8802-CREA',
    authenticity_seal: 'Germany Alzchem Certified • Lot 2026-CR55',
    image: '/supplements/creapure-creatine.png'
  },
  {
    id: 7,
    title: 'ABE Ultimate Pre-Workout 315g',
    brand: 'Applied Nutrition',
    category: 'Pre-Workouts',
    price: 2490,
    original_price: 2890,
    rating: 4.7,
    reviews_count: 188,
    stock: 25,
    type: 'S',
    emoji: '⚡',
    description: "Europe's best-selling pre-workout with added TeaCrine for long-lasting physical stamina and Breathe Easy™ airway cooling.",
    specs: ['30 Servings', '200mg Caffeine + TeaCrine', 'Breathe Easy™ Airway Cool', 'Informed-Choice Tested'],
    flavors: ['Energy Flavour', 'Sour Apple', 'Blue Lagoon'],
    batch_code: 'APN-5521-ABE',
    authenticity_seal: 'UK Import • Informed Choice Tamper Foil',
    image: '/supplements/abe-pre-workout.png'
  }
]

const coupons = [
  { code: 'CHALK15', discount_percent: 15, description: '15% Off storewide for verified lifters', active: true },
  { code: 'LIFTZONE10', discount_percent: 10, description: '10% Welcome lifter discount', active: true },
  { code: 'OBRERO20', discount_percent: 20, description: '20% Off local Butuan City lifters VIP promo', active: true }
]

async function run() {
  console.log('Seeding products...')
  const { error: pErr } = await supabase.from('products').upsert(products)
  if (pErr) console.error('Products seed error:', pErr)
  else console.log('✅ Products seeded successfully!')

  console.log('Seeding coupons...')
  const { error: cErr } = await supabase.from('coupons').upsert(coupons)
  if (cErr) console.error('Coupons seed error:', cErr)
  else console.log('✅ Coupons seeded successfully!')
}

run()
