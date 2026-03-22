const https = require('https');
 
const RAZORPAY_KEY_ID = 'rzp_live_STQ1s2SvssyKe4';
const RAZORPAY_KEY_SECRET = 'YyMdoYeTC3dWEkUW8E9q5JlH';
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
 
  try {
    const {amount, currency = 'INR', receipt} = req.body;
    if (!amount) return res.status(400).json({error: 'Amount required'});
 
    const orderData = JSON.stringify({amount, currency, receipt: receipt || 'veluno_' + Date.now()});
    const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
 
    const result = await new Promise((resolve, reject) => {
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
        response.on('end', () => resolve({status: response.statusCode, data}));
      });
      request.on('error', reject);
      request.write(orderData);
      request.end();
    });
 
    res.status(result.status).send(result.data);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({error: error.message});
  }
};
