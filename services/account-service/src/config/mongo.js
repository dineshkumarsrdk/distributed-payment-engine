const mongoose = require('mongoose');
require('dotenv').config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[Account Service Mongo] Connected successfully.')
    } catch (error) {
        console.error('[Account Service Mongo] Connection error:', error);
    }
};

module.exports = {connectMongo};