const http = require('http');

const postData = JSON.stringify({
  jsonrpc: '2.0',
  method: 'tasks/sendSubscribe',
  params: {
    id: 'test123',
    sessionId: 'sess123',
    message: {
      role: 'user',
      parts: [{
        type: 'text',
        text: 'Hello test'
      }]
    }
  },
  id: 'call123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/a2a/565cd289-aa46-49a5-8ea6-b547aef1a5d4',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Payload:', postData);

const req = http.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);
  console.log('Response Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:', data);
    if (res.statusCode === 404) {
      console.log('\n❌ Endpoint returning 404 - route not found!');
    } else {
      console.log('\n✅ Endpoint responded successfully!');
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Request failed:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('Server is not running on port 3001');
  }
});

req.write(postData);
req.end();