const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { mode, data } = req.body;

  console.log(`🔥 /api/ecmo-score POST hit with mode=${mode}`);

  if (!mode || !data) {
    return res.status(400).json({ error: "Missing mode or data" });
  }

  let prompt;

  if (mode === 'dropdown') {
    prompt = `
You are a clinical assistant evaluating ECMO timing for thoracic surgery in SVC syndrome.

Scoring Inputs:
Symptom Severity: ${data.symptom}
Vascular Congestion: ${data.vascular}
Anatomic Compression: ${data.anatomic}
Hemodynamic Status: ${data.hemodynamic}
Additional Notes: ${data.notes || "N/A"}

Please:
1. Score each domain
2. Calculate the ECMO-SVC Score
3. Recommend ECMO timing (None, Standby, Elective, Rescue)
4. Show a breakdown and clinical interpretation
    `;
  } else if (mode === 'notes') {
    prompt = `
You are a clinical assistant. Based on the admission note, assess ECMO timing using the ECMO-SVC scoring system.

History:
${data.history}

Physical Exam:
${data.exam}

Please:
1. Extract findings for each of the 4 scoring domains
2. Score them and compute the ECMO-SVC Score
3. Recommend timing (None, Standby, Elective, Rescue)
4. Explain your reasoning
    `;
  } else {
    return res.status(400).json({ error: "Invalid mode" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // ✅ Your model here
      messages: [
        { role: "system", content: "You are a clinical reasoning assistant for ECMO scoring." },
        { role: "user", content: prompt }
      ]
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (err) {
    console.error('❌ OpenAI API error:', err.response?.data || err.message || err);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
