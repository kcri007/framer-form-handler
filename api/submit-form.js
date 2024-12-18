// pages/api/submit-form.js
export default async function handler(req, res) {
  // Enable CORS for Framer
  res.setHeader('Access-Control-Allow-Origin', 'https://framer.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests from Framer
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    console.log('Received webhook data:', req.body); // Debug incoming data

    // Parse webhook data from Framer form
    const { 
      name, 
      phone, 
      email,
      language 
    } = req.body;

    // Log the parsed data
    console.log('Parsed form data:', { name, phone, email, language });

    // Validate required fields
    if (!name || !phone || !email || !language) {
      console.log('Missing required fields:', { name, phone, email, language });
      return res.status(400).json({
        error: 'Missing required fields: name, phone, email, or language.'
      });
    }

    // Configure Bland.ai API request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'x-bland-org-id': process.env.BLAND_ORG_ID
    };

    const blandAiData = {
      phone_number: phone,
      task: `You're Jean, a health assistant at Nutriva Health. You're calling ${name} who just submitted an inquiry through our website. Start by confirming their name and ask how you can help them today.`,
      model: "gpt-4",
      language: language === 'Spanish' ? 'es-ES' : 'en-US',
      voice: language === 'Spanish' ? 'elena' : 'josh',
      pathway_id: process.env.BLAND_PATHWAY_ID,
      first_sentence: `Hello, may I speak with ${name}? This is Jean from Nutriva Health.`,
      max_duration: 300,
      background_track: "office",
      wait_for_greeting: false,
      timezone: "America/New_York",
      tools: [],
      dynamic_data: {},
      metadata: {
        name,
        email,
        phone,
        language,
        source: 'website_inquiry',
        submission_timestamp: new Date().toISOString()
      }
    };

    console.log('Sending request to Bland.ai:', blandAiData); // Debug outgoing data

    // Send request to Bland.ai
    const response = await fetch('https://api.bland.ai/v1/agents', {
      method: 'POST',
      headers,
      body: JSON.stringify(blandAiData)
    });

    const data = await response.json();
    console.log('Bland.ai response:', data); // Debug API response
    
    if (!response.ok) {
      console.error('Bland.ai API Error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Bland.ai API request failed.' 
      });
    }

    // Return successful response to Framer
    return res.status(200).json({
      message: 'Call request successfully processed.',
      data: {
        ...data,
        name,
        phone,
        email,
        language
      }
    });

  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
