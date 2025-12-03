const express = require('express');
const axios = require('axios');

const router = express.Router();

const ACTIONS = [
  { id: 'logout', description: 'Log the user out' },
  { id: 'openProfile', description: 'Open the profile page' },
  { id: 'goHome', description: 'Go to the home screen' },
  { id: 'openCart', description: 'Open the cart page' },
  { id: 'calculateTotalPrice', description: 'Calculate the total price of items in the cart' },
];

const ACTION_IDS = ACTIONS.map((action) => action.id);
const ACTION_SET = new Set(ACTION_IDS);

const buildPrompt = (userText) => {
  const safeText = String(userText || '').replace(/\s+/g, ' ').trim();
  const actionsText = ACTIONS.map(a => `${a.id}: ${a.description}`).join('\n');

  return `You are an action classifier for our app.
The user said: "${safeText}"

Available actions (id: description):
${actionsText}

Choose EXACTLY ONE action id from the list above that best matches the user's intent.
Respond with ONLY the action id (no quotes, no punctuation, no explanation). If multiple actions could apply, pick the single most appropriate one.`;
};

router.post('/classify', async (req, res) => {
  try {
    const { userText } = req.body || {};

    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({ error: 'userText is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing.' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
    const baseUrl = 'https://generativelanguage.googleapis.com';

    const url = `${baseUrl}/${apiVersion}/models/${model}:generateContent`;

    const prompt = buildPrompt(userText);
    console.log('PROMPT:', prompt);
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        params: { key: apiKey },
      }
    );

    const actionId =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('ACTION ID:', actionId);

    if (!actionId || !ACTION_SET.has(actionId)) {
      return res
        .status(422)
        .json({ error: 'Unable to interpret Gemini response.', raw: actionId });
    }

    return res.json({ actionId });
  } catch (error) {
    console.error(
      'Gemini classification error:',
      error.response?.data || error.message
    );
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: 'Gemini classification failed.',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
