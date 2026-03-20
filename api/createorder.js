const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay keys not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { amount, currency = 'INR', receipt } = body || {};

  const orderData = JSON.stringify({
    amount: amount || 69900,
    currency,
    receipt: receipt || 'veluno_' + Date.now()
  });

  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.razorpay.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Content-Length': Buffer.byteLength(orderData)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(res.status(response.statusCode).json(JSON.parse(data)));
        } catch(e) {
          resolve(res.status(500).json({ error: 'Invalid response from Razorpay' }));
        }
      });
    });

    request.on('error', (e) => {
      resolve(res.status(500).json({ error: e.message }));
    });

    request.write(orderData);
    request.end();
  });
};
