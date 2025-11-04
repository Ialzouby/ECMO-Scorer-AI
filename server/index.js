const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// FORCE NO CACHE
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const ecmoRoute = require('./routes/ecmo');
const stsRoute = require('./routes/sts');
const surveyRoute = require('./routes/survey');

app.use('/api/ecmo-score', ecmoRoute);
app.use('/api/sts-score', stsRoute);
app.use('/api/survey', surveyRoute);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('NO CACHE MODE - All responses force refresh');
});
