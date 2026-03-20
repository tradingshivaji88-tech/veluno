const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_STQ1s2SvssyKe4';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'YyMdoYeTC3dWEkUW8E9q5JlH';

  const { amount, currency = 'INR', receipt } = JSON.parse(event.body || '{}');

  const orderData = JSON.stringify({
    amount: amount,
    currency: currency,
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
        'Content-Length': orderData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message })
      });
    });

    req.write(orderData);
    req.end();
  });
};
