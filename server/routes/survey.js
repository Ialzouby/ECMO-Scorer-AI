const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const surveyFile = path.join(__dirname, '..', 'data', 'survey_results.json');

// Ensure the file exists
if (!fs.existsSync(surveyFile)) {
  fs.writeFileSync(surveyFile, '[]'); // empty array to start
}

// POST /api/survey
router.post('/', (req, res) => {
  const newResponse = req.body;

  try {
    const data = fs.readFileSync(surveyFile, 'utf8');
    const responses = JSON.parse(data);
    responses.push(newResponse);
    fs.writeFileSync(surveyFile, JSON.stringify(responses, null, 2));
    res.status(200).json({ message: 'Survey submitted successfully.' });
  } catch (err) {
    console.error('❌ Error saving survey:', err);
    res.status(500).json({ error: 'Failed to save survey.' });
  }
});

module.exports = router;
