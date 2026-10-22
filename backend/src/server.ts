import http from 'http'
import { getProducts, createProduct, updateProduct, deleteProduct } from './services/productService'
import { verifyBatch } from './services/verifyService'
import { validateCoupon } from './services/couponService'
import { createOrder } from './services/orderService'
import { isSupabaseConfigured } from './supabase'

const PORT = process.env.PORT || 3001

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => (data += chunk))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname

  try {
    // Health check
    if (pathname === '/health' || pathname === '/') {
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 'online',
        service: 'Lifting Zone Obrero Backend API',
        supabaseConfigured: isSupabaseConfigured(),
        timestamp: new Date().toISOString()
      }))
      return
    }

    // GET /api/products (READ)
    if (pathname === '/api/products' && req.method === 'GET') {
      const category = url.searchParams.get('category') || undefined
      const type = url.searchParams.get('type') || undefined
      const products = await getProducts(category, type)
      res.writeHead(200)
      res.end(JSON.stringify({ success: true, data: products }))
      return
    }

    // POST /api/products (CREATE)
    if (pathname === '/api/products' && req.method === 'POST') {
      const body = await parseBody(req)
      const created = await createProduct(body)
      res.writeHead(201)
      res.end(JSON.stringify({ success: true, data: created }))
      return
    }

    // PUT /api/products (UPDATE)
    if (pathname === '/api/products' && req.method === 'PUT') {
      const body = await parseBody(req)
      const id = Number(body.id)
      const updated = await updateProduct(id, body)
      res.writeHead(updated ? 200 : 404)
      res.end(JSON.stringify({ success: Boolean(updated), data: updated }))
      return
    }

    // DELETE /api/products (DELETE)
    if (pathname === '/api/products' && req.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'))
      const deleted = await deleteProduct(id)
      res.writeHead(deleted ? 200 : 404)
      res.end(JSON.stringify({ success: Boolean(deleted), data: deleted }))
      return
    }

    // POST /api/verify
    if (pathname === '/api/verify' && req.method === 'POST') {
      const body = await parseBody(req)
      const result = await verifyBatch(body.batchCode)
      res.writeHead(result.success ? 200 : 404)
      res.end(JSON.stringify(result))
      return
    }

    // POST /api/coupon
    if (pathname === '/api/coupon' && req.method === 'POST') {
      const body = await parseBody(req)
      const result = await validateCoupon(body.code)
      res.writeHead(result.valid ? 200 : 400)
      res.end(JSON.stringify(result))
      return
    }

    // POST /api/orders
    if (pathname === '/api/orders' && req.method === 'POST') {
      const body = await parseBody(req)
      const result = await createOrder(body)
      res.writeHead(200)
      res.end(JSON.stringify(result))
      return
    }

    // 404
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Endpoint not found' }))
  } catch (err: any) {
    res.writeHead(500)
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
  }
})

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Lifting Zone Backend running on http://localhost:${PORT}`)
  })
}

export default server
