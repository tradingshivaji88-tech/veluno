const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const firebaseUrl = `https://firestore.googleapis.com/v1/projects/veluno-145b0/databases/(default)/documents/orders`;

  return new Promise((resolve) => {
    const url = new URL(firebaseUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const raw = JSON.parse(data);
          const orders = (raw.documents || []).map(doc => {
            const f = doc.fields;
            return {
              id:        f.id?.stringValue || '',
              customer:  JSON.parse(f.customer?.stringValue || '{}'),
              items:     JSON.parse(f.items?.stringValue || '[]'),
              total:     f.total?.numberValue || 0,
              status:    f.status?.stringValue || 'New',
              paymentId: f.paymentId?.stringValue || '',
              date:      f.date?.stringValue || ''
            };
          });
          resolve(res.status(200).json(orders));
        } catch(e) {
          resolve(res.status(500).json({ error: e.message }));
        }
      });
    });

    request.on('error', (e) => {
      resolve(res.status(500).json({ error: e.message }));
    });

    request.end();
  });
};
