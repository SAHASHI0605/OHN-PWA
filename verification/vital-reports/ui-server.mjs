import { createServer } from '../../ohana.admin/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
process.env.VITE_API_BASE_URL = 'http://127.0.0.1:7210/api';
const server = await createServer({root:fileURLToPath(new URL('../../ohana.admin/',import.meta.url)),server:{host:'127.0.0.1',port:5179,strictPort:true}});
await server.listen();console.log('In-memory report UI: http://127.0.0.1:5179/admin/login');
