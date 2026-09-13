const CircuitBreaker = require('opossum');
const axios = require('axios');

const { circuitBreakerState } = require('./metrics');

const makeAccountTransferCall = async ({url, payload, headers}) => {
    return await axios.post(url, payload, { headers, timeout: 3000 });
};

// Circuit breaker options
const options = {
  timeout: 3000, // If request takes longer than 3 seconds, trigger failure
  errorThresholdPercentage: 50, // Trip breaker if 50% of requests fail
  resetTimeout: 10000, // Wait 10 seconds in OPEN state before trying HALF-OPEN
};

const accountTransferBreaker = new CircuitBreaker(makeAccountTransferCall, options);

accountTransferBreaker.on('open', () => {
  circuitBreakerState.labels('account-service').set(1);
  console.warn('[Circuit Breaker] OPEN: Downstream Account Service failing. Fast-failing requests.');
});

accountTransferBreaker.on('halfOpen', () => {
  circuitBreakerState.labels('account-service').set(0.5);
  console.log('[Circuit Breaker] HALF-OPEN: Testing downstream health with next request...');
});

accountTransferBreaker.on('close', () => {
  circuitBreakerState.labels('account-service').set(0);
  console.log('[Circuit Breaker] CLOSED: Downstream Account Service restored to healthy state.');
});

module.exports = { accountTransferBreaker };