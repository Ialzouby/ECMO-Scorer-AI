const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');

const app = express();

// ✅ Serve frontend HTML + assets
app.use(express.static(path.join(__dirname, 'public')));

// ✅ CORS Setup for API
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ API Routes
app.use('/api/ecmo-score', ecmoRoute);

// ✅ Serve notes.html on root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

// ✅ 405 catch-all
app.all('*', (req, res) => {
  console.log(`🚫 Method not allowed: ${req.method} on ${req.originalUrl}`);
  res.status(405).send(`🚫 Method Not Allowed: ${req.method} on ${req.originalUrl}`);
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
