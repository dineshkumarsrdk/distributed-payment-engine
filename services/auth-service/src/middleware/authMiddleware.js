const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const accessToken = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);

        const cachedToken = await redisClient.get(`session:${decodedToken.userId}`);
        if (!cachedToken || cachedToken != accessToken) {
            res.status(401).json({ error: 'Session expired or revoked. Please log in again.' });
        }
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = { verifyToken };