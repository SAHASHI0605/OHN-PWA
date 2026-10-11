import { createServer } from '../../ohana.admin/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';

// Temporary process environment only; never change .env.development or production APIs.
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:7198/api';
const server = await createServer({
    root: fileURLToPath(new URL(process.argv.includes('--client') ? '../../ohana.client/' : '../../ohana.admin/', import.meta.url)),
    server: { host: '127.0.0.1', port: process.argv.includes('--client') ? 5177 : 5176, strictPort: true },
});
await server.listen();
console.log(process.argv.includes('--client') ? 'Verification client UI only: http://127.0.0.1:5177/' : 'Verification UI only: http://127.0.0.1:5176/admin/login');
