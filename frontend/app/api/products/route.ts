import { NextResponse } from 'next/server'
import { supabase, isSupabaseReady } from '../../../lib/supabase'
import { requireAdmin, handleAuthError } from '../../../lib/supabase/auth-guard'
import { products as localProducts, Product } from '../../../lib/data'

// In-memory working cache so CRUD changes persist even when offline
let currentProducts: Product[] = [...localProducts]

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const type = url.searchParams.get('type')

    if (isSupabaseReady()) {
      try {
        let query = supabase.from('products').select('*').order('id', { ascending: true })
        if (category) query = query.eq('category', category)
        if (type) query = query.eq('type', type)
        const { data, error } = await query
        if (!error && data && data.length > 0) {
          // Normalize Supabase columns
          const formatted: Product[] = data.map(row => ({
            id: row.id,
            t: row.title,
            b: row.brand,
            c: row.category,
            p: Number(row.price),
            o: Number(row.original_price),
            r: Number(row.rating || 5),
            n: Number(row.reviews_count || 0),
            s: Number(row.stock || 0),
            ty: row.type as 'S' | 'E',
            e: row.emoji || '⚡',
            desc: row.description || '',
            specs: Array.isArray(row.specs) ? row.specs : [],
            flavors: Array.isArray(row.flavors) ? row.flavors : [],
            batchCode: row.batch_code || `BATCH-${row.id}`,
            authenticity: row.authenticity_seal || 'Verified Import',
            image: row.image || undefined
          }))
          currentProducts = formatted
          return NextResponse.json({ success: true, data: formatted, source: 'supabase' })
        }
      } catch (err) {
        console.warn('Supabase query error, using active cache:', err)
      }
    }

    // Sync any newly added products or image mappings from local data
    for (const lp of localProducts) {
      const existing = currentProducts.find(p => p.id === lp.id)
      if (!existing) {
        currentProducts.push({ ...lp })
      } else if (lp.image) {
        existing.image = lp.image
      }
    }

    let filtered = currentProducts
    if (category) filtered = filtered.filter(p => p.c.toLowerCase() === category.toLowerCase())
    if (type) filtered = filtered.filter(p => p.ty === type)

    return NextResponse.json({ success: true, data: filtered, source: 'cache' })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Enforce Administrator Role on the Server
  try {
    await requireAdmin(req)
  } catch (err) {
    return handleAuthError(err)
  }

  try {
    const body = await req.json()
    const newId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 0

    const newProduct: Product = {
      id: newId,
      t: body.t || body.title || 'New SKU Item',
      b: body.b || body.brand || 'Lifting Zone Gear',
      c: body.c || body.category || 'Supplements',
      p: Number(body.p || body.price || 1990),
      o: Number(body.o || body.originalPrice || body.price || 2490),
      r: Number(body.r || 5.0),
      n: Number(body.n || 1),
      s: Number(body.s !== undefined ? body.s : 25),
      ty: (body.ty || (body.category === 'Leg Machines' || body.category === 'Smith Machines' || body.category === 'Free Weights' ? 'E' : 'S')) as 'S' | 'E',
      e: body.e || (body.category === 'Free Weights' ? '🏋️' : body.category === 'Whey Protein' ? '🥛' : '⚡'),
      desc: body.desc || body.description || 'Commercial grade fitness and nutrition equipment.',
      specs: Array.isArray(body.specs) ? body.specs : ['100% Quality Inspected'],
      flavors: Array.isArray(body.flavors) ? body.flavors : ['Standard Edition'],
      batchCode: body.batchCode || `LZO-${Math.floor(1000 + Math.random() * 9000)}`,
      authenticity: body.authenticity || 'Direct Channel Sealed Lot Verified',
      image: body.image || undefined
    }

    // Attempt Supabase insert
    if (isSupabaseReady()) {
      try {
        await supabase.from('products').insert({
          id: newProduct.id,
          title: newProduct.t,
          brand: newProduct.b,
          category: newProduct.c,
          price: newProduct.p,
          original_price: newProduct.o,
          rating: newProduct.r,
          reviews_count: newProduct.n,
          stock: newProduct.s,
          type: newProduct.ty,
          emoji: newProduct.e,
          description: newProduct.desc,
          specs: newProduct.specs,
          flavors: newProduct.flavors,
          batch_code: newProduct.batchCode,
          authenticity_seal: newProduct.authenticity
        })
      } catch (err) {
        console.warn('Supabase product insert notice:', err)
      }
    }

    currentProducts.push(newProduct)
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid product creation payload' }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  // Enforce Administrator Role on the Server
  try {
    await requireAdmin(req)
  } catch (err) {
    return handleAuthError(err)
  }

  try {
    const body = await req.json()
    const id = Number(body.id)

    const idx = currentProducts.findIndex(p => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    const updated: Product = {
      ...currentProducts[idx],
      t: body.t !== undefined ? body.t : currentProducts[idx].t,
      b: body.b !== undefined ? body.b : currentProducts[idx].b,
      c: body.c !== undefined ? body.c : currentProducts[idx].c,
      p: body.p !== undefined ? Number(body.p) : currentProducts[idx].p,
      o: body.o !== undefined ? Number(body.o) : currentProducts[idx].o,
      s: body.s !== undefined ? Number(body.s) : currentProducts[idx].s,
      desc: body.desc !== undefined ? body.desc : currentProducts[idx].desc,
      e: body.e !== undefined ? body.e : currentProducts[idx].e,
      specs: body.specs !== undefined ? body.specs : currentProducts[idx].specs,
      flavors: body.flavors !== undefined ? body.flavors : currentProducts[idx].flavors,
      image: body.image !== undefined ? body.image : currentProducts[idx].image
    }

    // Attempt Supabase update
    if (isSupabaseReady()) {
      try {
        await supabase
          .from('products')
          .update({
            title: updated.t,
            brand: updated.b,
            category: updated.c,
            price: updated.p,
            original_price: updated.o,
            stock: updated.s,
            description: updated.desc,
            emoji: updated.e,
            specs: updated.specs,
            flavors: updated.flavors
          })
          .eq('id', id)
      } catch (err) {
        console.warn('Supabase product update notice:', err)
      }
    }

    currentProducts[idx] = updated
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  // Enforce Administrator Role on the Server
  try {
    await requireAdmin(req)
  } catch (err) {
    return handleAuthError(err)
  }

  try {
    const url = new URL(req.url)
    const idParam = url.searchParams.get('id')
    if (!idParam) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 })
    }

    const id = Number(idParam)
    const idx = currentProducts.findIndex(p => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    // Attempt Supabase delete
    if (isSupabaseReady()) {
      try {
        await supabase.from('products').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase delete notice:', err)
      }
    }

    const deleted = currentProducts.splice(idx, 1)[0]
    return NextResponse.json({ success: true, data: deleted, message: `Product #${id} removed` })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 })
  }
}
