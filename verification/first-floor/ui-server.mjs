import { createServer } from '../../ohana.admin/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';

// Temporary process environment only; never change .env.development or production APIs.
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:7200/api';
const server = await createServer({
    root: fileURLToPath(new URL(process.argv.includes('--client') ? '../../ohana.client/' : '../../ohana.admin/', import.meta.url)),
    server: { host: '127.0.0.1', port: process.argv.includes('--client') ? 5180 : 5179, strictPort: true },
});
await server.listen();
console.log(process.argv.includes('--client') ? 'Verification client UI only: http://127.0.0.1:5180/' : 'Verification UI only: http://127.0.0.1:5179/admin/login');


