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
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Parse and validate request body
    const { 
      name, 
      phone, 
      language, 
      pathway_id, 
      model, 
      first_sentence,
      appointmentTime 
    } = req.body;

    // Validate required fields
    if (!name || !phone || !language || !pathway_id || !model || !first_sentence) {
      return res.status(400).json({
        error: 'Missing required fields: name, phone, language, pathway_id, model, or first_sentence.'
      });
    }

    // Validate phone number format
    if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    // Configure Bland.ai API request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'x-bland-org-id': process.env.BLAND_ORG_ID
    };

    const blandAiData = {
      phone_number: phone,
      task: `You're Jean, a health assistant at Nutriva Health. You're calling ${name} to confirm their upcoming appointment${appointmentTime ? ` at ${appointmentTime}` : ''}. Start by confirming their name and whether they can attend. If they need to reschedule, offer alternative times and help them find a suitable slot.`,
      model: model,
      language: language === 'Spanish' ? 'es-ES' : 'en-US',
      voice: language === 'Spanish' ? 'elena' : 'josh',
      pathway_id: pathway_id,
      first_sentence: first_sentence,
      max_duration: 300,
      background_track: "office",
      wait_for_greeting: false,
      timezone: "America/New_York",
      tools: [{}],
      dynamic_data: {},
      interruption_threshold: 123,
      keywords: ['callback', 'conversation'],
      metadata: {
        patient_name: name,
        appointment_time: appointmentTime,
        language: language
      }
    };

    // Send request to Bland.ai and await response
    const response = await fetch('https://api.bland.ai/v1/agents', {
      method: 'POST',
      headers,
      body: JSON.stringify(blandAiData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Bland.ai API Error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Bland.ai API request failed.' 
      });
    }

    // Return successful response
    return res.status(200).json({
      message: 'Request successfully processed.',
      data: {
        ...data,
        name,
        phone,
        language,
        appointmentTime,
        callType: 'appointment_confirmation'
      }
    });

  } catch (error) {
    console.error('Unexpected Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
