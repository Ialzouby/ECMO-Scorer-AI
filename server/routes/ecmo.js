const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
    console.log('🔥 POST /api/ecmo-score HIT');
  
    const { mode, data } = req.body;
    console.log('🧾 Mode:', mode);
    console.log('📄 Data:', data);
  
    if (!mode || !data) {
      return res.status(400).json({ error: 'Missing mode or data' });
    }
  
    const fakeResponse = {
      response: `
  🧠 ECMO-SVC Score: 8/10  
  🕒 Recommendation: Elective ECMO  
  📊 Breakdown:
  - History: ${data.history}
  - Exam: ${data.exam}`
    };
  
    console.log('✅ Returning fake GPT output');
    res.json(fakeResponse);
  });
  
module.exports = router;
