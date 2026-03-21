const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DIST = path.join(__dirname, 'dist');

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Elite Esports running on port ${PORT}`);
});
