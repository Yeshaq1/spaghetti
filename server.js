require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8002;

// Pricing defaults (override with env vars)
const priceDefaults = {
  VIBE_BLUEPRINT_PRICE: '$4,500',
  VIBE_BUILD_SPRINT_PRICE: '$12,000',
  SPAGHETTI_REVIEW_PRICE: '$6,500',
  MAINTENANCE_PRICE: '$3,000'
};

const indexPath = path.join(__dirname, 'index.html');

const renderIndex = () => {
  let html = fs.readFileSync(indexPath, 'utf8');
  const replacements = {
    VIBE_BLUEPRINT_PRICE: process.env.VIBE_BLUEPRINT_PRICE || priceDefaults.VIBE_BLUEPRINT_PRICE,
    VIBE_BUILD_SPRINT_PRICE: process.env.VIBE_BUILD_SPRINT_PRICE || priceDefaults.VIBE_BUILD_SPRINT_PRICE,
    SPAGHETTI_REVIEW_PRICE: process.env.SPAGHETTI_REVIEW_PRICE || priceDefaults.SPAGHETTI_REVIEW_PRICE,
    MAINTENANCE_PRICE: process.env.MAINTENANCE_PRICE || priceDefaults.MAINTENANCE_PRICE
  };

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });

  const pricingScript = `<script>window.__PRICING__=${JSON.stringify(replacements)};</script>`;
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${pricingScript}</body>`);
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', `${pricingScript}</head>`);
  }

  return html;
};

// Middleware
app.use(express.json());

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

"Hi! I'm Spaghetti. Vibe coding is the future of building products, and most teams need guardrails to ship safely. We help you build while you vibe, then we harden it with real engineering. Pick a package: Vibe Blueprint for prompts and system design, Vibe Build Sprint for build plus wire-up, Spaghetti Review to stabilize what you have, and Maintenance + Reliability to keep it running. We've helped Meta, Google, and GM ship AI that works. Book Yousef at yousef+ai@hey.com. Let's build better AI together."

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

// Serve index with env-based pricing
app.get(['/', '/index.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(renderIndex());
});

// Static assets (after index route so /index.html is injected)
app.use(express.static('.'));

// Handle all other routes
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(renderIndex());
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT}`);
});
