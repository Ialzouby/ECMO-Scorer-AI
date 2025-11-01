const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { mode, data } = req.body;

  console.log(`🔥 /api/sts-score POST hit with mode=${mode}`);

  if (!mode || !data) {
    return res.status(400).json({ error: "Missing mode or data" });
  }

  let prompt;

  if (mode === 'notes') {
    // STS uses patientNotes field, fallback to history for backward compatibility
    const patientNotes = data.patientNotes || data.history || '';
    
    if (!patientNotes.trim()) {
      return res.status(400).json({ error: "Patient notes are required" });
    }

    prompt = `
You are a clinical assistant specializing in cardiac surgery risk assessment. Based on the patient notes provided, calculate the STS (Society of Thoracic Surgeons) Risk Score for cardiac surgery.

Patient Notes:
${patientNotes}

Please provide a comprehensive analysis:

1. PATIENT INFORMATION EXTRACTION:
   - Age, gender, weight/BMI
   - Cardiac diagnosis and procedure type
   - Ejection fraction
   - NYHA functional class
   - Previous cardiac surgery history
   - Comorbidities (diabetes, hypertension, COPD, renal dysfunction, etc.)
   - Emergency/urgent status

2. STS RISK SCORE CALCULATION:
   - Calculate PROM (Predicted Risk of Mortality)
   - Calculate PROMM (Predicted Risk of Morbidity and Mortality)
   - Provide percentage scores

3. RISK STRATIFICATION:
   - Classify as Low risk (<1%), Moderate risk (1-5%), or High risk (>5%)
   - Explain the classification

4. KEY RISK FACTORS:
   - List and explain the major risk factors contributing to the score
   - Note any modifiable risk factors

5. PERIOPERATIVE RECOMMENDATIONS:
   - Specific recommendations based on the risk level
   - Suggested monitoring and management strategies
   - Considerations for patient/family discussion

Format your response clearly with bold headers and organized sections.
    `;
  } else {
    return res.status(400).json({ error: "Invalid mode for STS scoring" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: "system", content: "You are a clinical reasoning assistant specializing in cardiac surgery risk assessment and STS scoring." },
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

