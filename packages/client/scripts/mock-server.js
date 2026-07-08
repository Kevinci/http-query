const http = require('http');
const url = require('url');

const port = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, QUERY');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const response = {
        method: req.method,
        url: parsedUrl.pathname,
        query: parsedUrl.query,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log('Supports: GET, POST, PUT, DELETE, HEAD, QUERY (with CORS)');
});

