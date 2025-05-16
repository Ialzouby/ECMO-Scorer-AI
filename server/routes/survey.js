const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Save to a JSON file (or connect to a DB in production)
const surveyFile = path.join(__dirname, '../data/survey_results.json');

router.post('/', (req, res) => {
  const survey = req.body;

  let existing = [];
  if (fs.existsSync(surveyFile)) {
    existing = JSON.parse(fs.readFileSync(surveyFile));
  }
  existing.push(survey);
  fs.writeFileSync(surveyFile, JSON.stringify(existing, null, 2));

  res.json({ success: true });
});

module.exports = router;
