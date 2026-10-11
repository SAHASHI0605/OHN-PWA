import { createServer } from './ohana.admin/node_modules/vite/dist/node/index.js';
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:5175/api';
const server = await createServer({
    root: 'C:/D/Oha/ohana.admin',
    server: { host: '127.0.0.1', port: 5175, strictPort: true },
    plugins: [{ name: 'local-ui-verification', configureServer(server) {
        server.middlewares.use('/api/auth/login', (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const { employeeNumber } = JSON.parse(body);
                const payload = { sub: 'UI-TEST', name: '画面確認用管理者', role: employeeNumber === 'non-admin' ? '1' : '0', exp: Math.floor(Date.now() / 1000) + 3600 };
                const token = [Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url'), 'ui-test'].join('.');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ token }));
            });
        });
    } }],
});
await server.listen();
console.log('UI verification only: http://127.0.0.1:5175/admin/login');
