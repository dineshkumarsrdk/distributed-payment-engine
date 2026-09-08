const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initDb } = require('./config/db');
const {connectMongo} = require('./config/mongo')
const {connectRedis} = require('./config/redis');
const accountRoutes = require('./routes/accountRoutes');
const auditLogsRoutes =  require('./routes/auditLogsRoutes');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'account-service', timestamp: new Date() });
});

app.use('/accounts', accountRoutes);
// app.use('/auditLogs', (req, res) => {console.log('auditlogs')});
app.use('/auditLogs', auditLogsRoutes);

app.listen(PORT, async () => {
    console.log(`[Account Service] Running on port ${PORT}`);
    await initDb();
    await connectMongo();
    await connectRedis();
});