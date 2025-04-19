const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');
const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

// Parse JSON
app.use(express.json());

// ✅ Serve static HTML file (for notes.html in root)
app.use(express.static(path.join(__dirname, '.')));

// ✅ API route
app.use('/api/ecmo-score', ecmoRoute);

// ✅ Root route = serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'notes.html'));
});

// Catch-all 405s
app.all('*', (req, res) => {
  console.log(`🚫 Method not allowed: ${req.method} on ${req.originalUrl}`);
  res.status(405).send(`🚫 Method Not Allowed: ${req.method} on ${req.originalUrl}`);
});

// Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
