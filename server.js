require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// WebRTC token endpoint - generate ephemeral token
app.post('/api/get-token', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not set' });
  }

  try {
    // Generate ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: `You are Spaghetti. You have exactly 30 seconds from NOW. Start immediately with this exact script:

"Hi! I'm Spaghetti. Every company builds AI, but most create digital spaghetti - beautiful outside, mess inside. We're different. We've helped Meta, Google, GM build AI that actually works. $50M+ saved, 50+ systems deployed, zero failures. We don't just build AI - we build AI that works for YOUR business. Ready to stop the spaghetti? Book Yousef at info@spgti.com. Let's build better AI together."

RULES:
- Start talking IMMEDIATELY when connected
- Use the exact script above - don't improvise
- If interrupted, say "Let me finish" and continue
- End with the email - that's your only goal
- No questions, no conversation - just deliver the pitch
- You have 30 seconds total - use every second`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Details:');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Body:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Token generated successfully:', tokenData);
    res.json(tokenData);
    
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Feature flags endpoint
app.get('/api/features', (req, res) => {
  res.json({
    webrtcEnabled: process.env.WEBRTC_ENABLED === 'true'
  });
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT}`);
});
