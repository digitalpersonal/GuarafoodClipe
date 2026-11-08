import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function createServer() {
  const app = express();
  
  // High limit for JSON
  app.use(express.json({ limit: '10mb' }));

  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: false 
    },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  // Fallback to index.html for SPA
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      const html = await vite.transformIndexHtml(url, `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>GuaraFood Studio - AI Video Generator</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      res.status(500).end((e as Error).message);
    }
  });

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

createServer();
