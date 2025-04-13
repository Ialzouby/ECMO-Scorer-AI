const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const ecmoRoute = require('./routes/ecmo');

const app = express();

// ✅ Middleware
app.use(cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }));
  
app.use(express.json());

// ✅ Route
app.use('/api/ecmo-score', ecmoRoute);

app.listen(5000, () => {
  console.log('✅ Backend running on http://localhost:5000');
});
