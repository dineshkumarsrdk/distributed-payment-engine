const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

const { connectRabbitMQ } = require('./config/rabbitmq');
const { connectRedis } = require('./config/redis');
const { startPaymentProcessor } = require('./workers/paymentProcessor');
const transactionRoutes = require('./routes/transactionRoutes');
const { getMetrics } = require('./utils/metrics');
const { requestLogger } = require('./middleware/requestLogger');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(requestLogger);

app.get('/metrics', getMetrics);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'transaction-service', timestamp: new Date() });
});

app.use('/transactions', transactionRoutes);

app.listen(PORT, async () => {
    logger.info('system', `[Transaction Service] Running on port ${PORT}`);
    await connectRabbitMQ();
    await connectRedis();
    await startPaymentProcessor();
})