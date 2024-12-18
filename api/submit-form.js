// pages/api/submit-form.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Log raw request body
    console.log('Raw request body:', req.body);

    const { 
      name, 
      phone, 
      email,
      language 
    } = req.body;

    // Log parsed values
    console.log('Parsed form values:', {
      name,
      phone,
      email,
      language,
      apiKey: process.env.BLAND_AI_API_KEY ? 'Present' : 'Missing',
      orgId: process.env.BLAND_ORG_ID ? 'Present' : 'Missing',
      pathwayId: process.env.BLAND_PATHWAY_ID ? 'Present' : 'Missing'
    });

    // Additional validation for phone number format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    if (!/^\+?[1-9]\d{1,14}$/.test(formattedPhone)) {
      console.error('Invalid phone format:', formattedPhone);
      return res.status(400).json({ error: 'Invalid phone number format. Must include country code.' });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'x-bland-org-id': process.env.BLAND_ORG_ID
    };

    const blandAiData = {
      phone_number: formattedPhone,
      task: `You're Jean, a health assistant at Nutriva Health. You're calling ${name} who just submitted an inquiry through our website. Start by confirming their name and ask how you can help them today.`,
      model: "gpt-4",
      language: language === 'Spanish' ? 'es-ES' : 'en-US',
      voice: language === 'Spanish' ? 'elena' : 'josh',
      pathway_id: process.env.BLAND_PATHWAY_ID,
      first_sentence: `Hello, may I speak with ${name}? This is Jean from Nutriva Health.`,
      max_duration: 300,
      background_track: "office",
      wait_for_greeting: true,
      timezone: "America/New_York",
      tools: [],
      dynamic_data: {},
      metadata: {
        name,
        email,
        phone: formattedPhone,
        language,
        source: 'website_inquiry',
        submission_timestamp: new Date().toISOString()
      }
    };

    console.log('Sending to Bland.ai:', JSON.stringify(blandAiData, null, 2));

    const response = await fetch('https://api.bland.ai/v1/agents', {
      method: 'POST',
      headers,
      body: JSON.stringify(blandAiData)
    });

    const data = await response.json();
    
    // Log full response from Bland.ai
    console.log('Full Bland.ai response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Bland.ai API Error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Bland.ai API request failed.' 
      });
    }

    // Verify call initiation
    if (!data.agent || !data.agent.id) {
      console.error('Call not initiated properly:', data);
      return res.status(500).json({ 
        error: 'Call creation failed - no agent ID returned' 
      });
    }

    return res.status(200).json({
      message: 'Call request successfully processed.',
      data: {
        ...data,
        name,
        phone: formattedPhone,
        email,
        language
      }
    });

  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
