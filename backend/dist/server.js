"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const productService_1 = require("./services/productService");
const verifyService_1 = require("./services/verifyService");
const couponService_1 = require("./services/couponService");
const orderService_1 = require("./services/orderService");
const supabase_1 = require("./supabase");
const PORT = process.env.PORT || 3001;
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            }
            catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}
const server = http_1.default.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    try {
        // Health check
        if (pathname === '/health' || pathname === '/') {
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'online',
                service: 'Lifting Zone Obrero Backend API',
                supabaseConfigured: (0, supabase_1.isSupabaseConfigured)(),
                timestamp: new Date().toISOString()
            }));
            return;
        }
        // GET /api/products (READ)
        if (pathname === '/api/products' && req.method === 'GET') {
            const category = url.searchParams.get('category') || undefined;
            const type = url.searchParams.get('type') || undefined;
            const products = await (0, productService_1.getProducts)(category, type);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: products }));
            return;
        }
        // POST /api/products (CREATE)
        if (pathname === '/api/products' && req.method === 'POST') {
            const body = await parseBody(req);
            const created = await (0, productService_1.createProduct)(body);
            res.writeHead(201);
            res.end(JSON.stringify({ success: true, data: created }));
            return;
        }
        // PUT /api/products (UPDATE)
        if (pathname === '/api/products' && req.method === 'PUT') {
            const body = await parseBody(req);
            const id = Number(body.id);
            const updated = await (0, productService_1.updateProduct)(id, body);
            res.writeHead(updated ? 200 : 404);
            res.end(JSON.stringify({ success: Boolean(updated), data: updated }));
            return;
        }
        // DELETE /api/products (DELETE)
        if (pathname === '/api/products' && req.method === 'DELETE') {
            const id = Number(url.searchParams.get('id'));
            const deleted = await (0, productService_1.deleteProduct)(id);
            res.writeHead(deleted ? 200 : 404);
            res.end(JSON.stringify({ success: Boolean(deleted), data: deleted }));
            return;
        }
        // POST /api/verify
        if (pathname === '/api/verify' && req.method === 'POST') {
            const body = await parseBody(req);
            const result = await (0, verifyService_1.verifyBatch)(body.batchCode);
            res.writeHead(result.success ? 200 : 404);
            res.end(JSON.stringify(result));
            return;
        }
        // POST /api/coupon
        if (pathname === '/api/coupon' && req.method === 'POST') {
            const body = await parseBody(req);
            const result = await (0, couponService_1.validateCoupon)(body.code);
            res.writeHead(result.valid ? 200 : 400);
            res.end(JSON.stringify(result));
            return;
        }
        // POST /api/orders
        if (pathname === '/api/orders' && req.method === 'POST') {
            const body = await parseBody(req);
            const result = await (0, orderService_1.createOrder)(body);
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return;
        }
        // 404
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
    catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
});
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Lifting Zone Backend running on http://localhost:${PORT}`);
    });
}
exports.default = server;
