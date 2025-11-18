// Test basic HTTP server with beta11-rc1
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Beta 11 RC1 HTTP Works!',
    url: req.url,
    method: req.method
  }));
});

const port = 3000;
server.listen(port, () => {
  console.log(`✅ HTTP server running on http://localhost:${port}`);
  console.log('🎉 Beta 11 RC1 native HTTP is working!');
});
