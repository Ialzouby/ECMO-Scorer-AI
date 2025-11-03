const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const ecmoRoute = require('./routes/ecmo');
const stsRoute = require('./routes/sts');
const surveyRoute = require('./routes/survey');

const app = express();

// ✅ Serve frontend HTML + assets (MUST come before catch-all)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ CORS Setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

// ✅ Parse JSON
app.use(express.json());

// ✅ API Routes
app.use('/api/ecmo-score', ecmoRoute);
app.use('/api/sts-score', stsRoute);
app.use('/api/survey', surveyRoute);

// ✅ Serve notes.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

// ✅ 405 Catch-all (move this LAST!)
app.all('*', (req, res) => {
  console.log(`🚫 Method not allowed: ${req.method} on ${req.originalUrl}`);
  res.status(405).send(`🚫 Method Not Allowed: ${req.method} on ${req.originalUrl}`);
});

// ✅ Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
