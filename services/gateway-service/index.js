const http = require('http');
const httpProxy = require('http-proxy');

// Create the proxy server
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true // Support WebSockets if needed
});

// Map prefix paths to local service ports
const targets = {
  '/auth': 'http://127.0.0.1:4000',
  '/user': 'http://127.0.0.1:4001',
  '/conversation': 'http://127.0.0.1:4002',
  '/file': 'http://127.0.0.1:4003',
  '/agent': 'http://127.0.0.1:7777',
};

const server = http.createServer((req, res) => {
  // Find which service this request belongs to
  const match = Object.keys(targets).find(prefix => req.url.startsWith(prefix));
  
  if (match) {
    const target = targets[match];
    
    // Strip prefix from the path
    // e.g. /auth/api/auth/login -> /api/auth/login
    const originalUrl = req.url;
    req.url = req.url.slice(match.length);
    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }
    
    // Log the request routing
    console.log(`[Proxy] Routing ${req.method} ${originalUrl} -> ${target}${req.url}`);
    
    proxy.web(req, res, { target }, (err) => {
      console.error(`[Proxy] Error routing ${req.method} ${originalUrl} to ${target}:`, err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
  } else {
    // Health check at root or unregistered route
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'gateway-healthy', 
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.log(`[Proxy] 404 Not Found: ${req.url}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

// Handle proxy WebSockets upgrading if needed
server.on('upgrade', (req, socket, head) => {
  const match = Object.keys(targets).find(prefix => req.url.startsWith(prefix));
  if (match) {
    const target = targets[match];
    req.url = req.url.slice(match.length);
    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }
    proxy.ws(req, socket, head, { target });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Gateway Server running on port ${PORT}`);
  console.log(`Routing mappings:`);
  Object.entries(targets).forEach(([prefix, target]) => {
    console.log(`  ${prefix} -> ${target}`);
  });
});
