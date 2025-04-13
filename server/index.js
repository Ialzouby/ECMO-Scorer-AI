const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');

const app = express();

// ✅ CORS Setup (Temporary: allow everything during dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());

app.use(express.json());

// ✅ Route Setup
app.use('/api/ecmo-score', ecmoRoute);

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ ECMO backend is alive and well.');
});

// ✅ Catch-all for 405s (log unrecognized requests)
app.all('*', (req, res) => {
  console.log(`🚫 Method not allowed: ${req.method} on ${req.originalUrl}`);
  res.status(405).send(`🚫 Method Not Allowed: ${req.method} on ${req.originalUrl}`);
});

// ✅ Port for both local and Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
