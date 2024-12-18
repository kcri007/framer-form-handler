// api/submit-form.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, language } = req.body;

    // Configure voice settings based on language selection
    let voiceConfig;
    if (language === 'Spanish') {
      voiceConfig = {
        name: 'elena',
        language: 'es-ES'
      };
    } else {
      voiceConfig = {
        name: 'josh',
        language: 'en-US'
      };
    }

    // Configure greeting based on language
    let greeting;
    if (language === 'Spanish') {
      greeting = `Hola ${name}, ¿cómo puedo ayudarte hoy?`;
    } else {
      greeting = `Hello ${name}, how can I assist you today?`;
    }

    // Call Bland.ai Web Agent API
    const response = await fetch('https://api.bland.ai/v1/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "enhanced",
        voice: voiceConfig,
        name: "Customer Service Agent",
        first_sentence: greeting,
        knowledge_data: {
          role: "You are a helpful customer service representative",
          purpose: "Help customers with their inquiries",
          company_info: "We provide AI voice agent services"
        },
        phone_number: phone,
        max_duration: 300,
        temperature: 0.7,
        interrupt_threshold: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create web agent');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
