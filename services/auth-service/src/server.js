const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initDb } = require('./config/db');
const { redisClient } = require('./config/redis');
const authRoutes = require('./routes/authRoutes'); 

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'auth-service', timestamp: new Date() });
});

// app.use('/auth', (req, res, next) => {
//   console.log(req.body);
//   next();
// });

app.use('/auth', authRoutes);

app.listen(PORT, async () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
  await initDb();
  await redisClient.connect();
});