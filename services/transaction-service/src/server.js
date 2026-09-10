const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { connectRabbitMQ } = require('./config/rabbitmq');
const { connectRedis } = require('./config/redis');
const { startPaymentProcessor } = require('./workers/paymentProcessor');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'transaction-service', timestamp: new Date() });
});

app.use('/transactions', transactionRoutes);

app.listen(PORT, async () => {
    console.log(`[Transaction Service] Running on port ${PORT}`);
    await connectRabbitMQ();
    await connectRedis();
    await startPaymentProcessor();
})