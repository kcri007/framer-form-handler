// pages/api/submit-form.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate environment variable
    if (!process.env.BLAND_AI_API_KEY) {
      console.error('Missing BLAND_AI_API_KEY in environment variables.');
      return res.status(500).json({ error: 'Internal Server Error: Missing API Key.' });
    }

    // Parse and validate request body
    const { name, phone, language } = req.body;
    if (!name || !phone || !language) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, or language.' });
    }

    // Asynchronous fire-and-forget request to Bland.ai
    fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`
      },
      body: JSON.stringify({
        phone_number: phone,
        task: `Call ${name} and speak to them in ${language}`,
        reduce_latency: true,
        answer_immediately: true,
        voice: {
          name: language === 'Spanish' ? 'elena' : 'josh',
          language: language === 'Spanish' ? 'es-ES' : 'en-US'
        }
      })
    }).catch((err) => {
      console.error('Bland.ai API call failed:', err.message);
    });

    // Respond immediately to avoid timeout
    return res.status(202).json({
      message: 'Request accepted. Processing in the background.',
      data: { name, phone, language }
    });
  } catch (error) {
    // Catch unexpected errors
    console.error('Server Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
