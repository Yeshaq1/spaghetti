const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST;
const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');

app.use(express.static(rootDir));

app.get('/api/features', (_req, res) => {
  res.json({ webrtcEnabled: false });
});

app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(indexPath);
});

app.get('*', (_req, res) => {
  res.sendFile(indexPath);
});

const onListen = () => {
  const hostLabel = HOST || 'localhost';
  console.log(`Server running at http://${hostLabel}:${PORT}`);
};

if (HOST) {
  app.listen(PORT, HOST, onListen);
} else {
  app.listen(PORT, onListen);
}
