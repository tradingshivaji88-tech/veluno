const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const firebaseUrl = `https://firestore.googleapis.com/v1/projects/veluno-145b0/databases/(default)/documents/orders`;

  const payload = JSON.stringify({
    fields: {
      id:         { stringValue: order.id || 'ORD-' + Date.now() },
      customer:   { stringValue: JSON.stringify(order.customer || {}) },
      items:      { stringValue: JSON.stringify(order.items || []) },
      total:      { numberValue: order.total || 0 },
      status:     { stringValue: order.status || 'New' },
      paymentId:  { stringValue: order.paymentId || '' },
      date:       { stringValue: new Date().toLocaleString('en-IN') }
    }
  });

  return new Promise((resolve) => {
    const url = new URL(firebaseUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve(res.status(response.statusCode).json(JSON.parse(data)));
      });
    });

    request.on('error', (e) => {
      resolve(res.status(500).json({ error: e.message }));
    });

    request.write(payload);
    request.end();
  });
};
