const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');

const app = express();

// ✅ CORRECT AND SAFE LOCAL DEV CORS SETUP
app.use(cors({
  origin: 'http://localhost:5174',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/ecmo-score', ecmoRoute);

app.listen(5000, () => {
  console.log('✅ Backend running on http://localhost:5000');
});
