const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');

const app = express();

// ✅ Put CORS at the very top
app.use(cors({
  origin: '*', // 🔥 TEMPORARILY allow all during development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ Handle OPTIONS requests globally
app.options('*', cors());

app.use(express.json());
app.use('/api/ecmo-score', ecmoRoute);

const PORT = process.env.PORT || 5050;

app.get('/', (req, res) => {
    res.send('✅ ECMO backend is alive and well.');
  });
  

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

