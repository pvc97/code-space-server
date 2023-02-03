const axios = require('axios');
require('dotenv').config();

const apiProvider = axios.create({
  baseURL: process.env.JUDGE0_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = apiProvider;
