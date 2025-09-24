const http = require('http');

const data = JSON.stringify({
  method: 'tasks/sendSubscribe',
  params: {
    id: 'test123',
    sessionId: 'sess123',
    message: {
      role: 'user',
      parts: [{
        type: 'text',
        text: 'Hello'
      }]
    }
  },
  id: 'call123',
  jsonrpc: '2.0'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/a2a/38c389f2-cb03-4bc0-8159-9d3a1e501989',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing endpoint:', options.path);
console.log('Payload:', data);

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(data);
req.end();