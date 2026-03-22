import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DIST = join(__dirname, '..', 'dist');

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (_req, res) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Elite Esports running on port ${PORT}`);
});
