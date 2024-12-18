// pages/api/submit-form.js
export default async function handler(req, res) {
  console.log('Starting outbound call request...');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { name, phone, email, language } = req.body;
    
    console.log('Processing request for:', { name, email, language, phone: '[REDACTED]' });

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'x-bland-org-id': process.env.BLAND_ORG_ID
    };

    const prompt = `You are Jean, a health assistant at Nutriva Health making an outbound call. Your task is to:
1. Confirm you're speaking with ${name}
2. Introduce yourself as Jean from Nutriva Health
3. Explain you're calling because they submitted an inquiry through the website
4. Ask how you can assist them today
5. Be professional, friendly, and helpful throughout the conversation

Remember:
- Speak naturally and conversationally
- Listen carefully to their needs
- Take notes of their requirements
- Be patient and clear in your communication`;

    const blandAiData = {
      phone_number: phone,
      task: prompt,
      model: "gpt-4",
      language: language === 'Spanish' ? 'es-ES' : 'en-US',
      voice: language === 'Spanish' ? 'elena' : 'josh',
      pathway_id: process.env.BLAND_PATHWAY_ID,
      first_sentence: `Hello, may I speak with ${name}? This is Jean from Nutriva Health.`,
      max_duration: 300,
      wait_for_greeting: true,
      immediate: true,
      type: "outbound",
      background_track: null,
      tools: [],
      metadata: {
        name,
        email,
        phone,
        language,
        source: 'website_inquiry',
        call_type: 'outbound'
      }
    };

    console.log('Sending outbound call request to Bland.ai...');

    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers,
      body: JSON.stringify(blandAiData)
    });

    const data = await response.json();
    console.log('Bland.ai response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Bland.ai API Error:', data);
      return res.status(response.status).json({ error: data.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Outbound call initiated successfully',
      call_id: data.call?.id || data.agent?.id
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
