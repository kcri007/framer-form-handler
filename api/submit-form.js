// pages/api/submit-form.js
export default async function handler(req, res) {
  console.log('Starting outbound call request with pathway...');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { name, phone, email, language } = req.body;
    
    console.log('Processing request for:', { name, email, language, phone: '[REDACTED]' });
    console.log('Using pathway ID:', process.env.BLAND_PATHWAY_ID);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'x-bland-org-id': process.env.BLAND_ORG_ID
    };

    const blandAiData = {
      phone_number: phone,
      task: `You are Jean, a health assistant at Nutriva Health. You are calling ${name} because they submitted an inquiry through our website. Start by confirming you're speaking with them, then ask how you can help them today. Be professional and friendly.`,
      first_sentence: `Hello, may I speak with ${name}? This is Jean from Nutriva Health.`,
      language: language === 'Spanish' ? 'es-ES' : 'en-US',
      voice: language === 'Spanish' ? 'elena' : 'josh',
      max_duration: 300,
      temperature: 0.7,
      pathway_id: process.env.BLAND_PATHWAY_ID,
      metadata: {
        name,
        email,
        language,
        source: 'website_inquiry',
        submission_time: new Date().toISOString()
      }
    };

    // Log request details (excluding sensitive data)
    console.log('Request payload:', {
      ...blandAiData,
      phone_number: '[REDACTED]',
      pathway_id: '[PRESENT]'
    });

    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers,
      body: JSON.stringify(blandAiData)
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();
    console.log('Bland.ai response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Bland.ai API Error:', data);
      return res.status(response.status).json({ error: data.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Call initiated successfully with pathway',
      call_id: data.call_id || data.id,
      pathway_id: process.env.BLAND_PATHWAY_ID
    });

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
}
