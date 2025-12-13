const axios = require('axios');
const url = process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:5500';
const apiKey = process.env.API_KEY || process.env.BOT_API_KEY || '';

const client = axios.create({
  baseURL: url,
  timeout: 5000,
  headers: apiKey ? { 'x-api-key': apiKey } : {}
});

module.exports = {
  async get(path, params) {
    const res = await client.get(`/api${path}`, { params });
    return res.data;
  },
  async post(path, body) {
    const res = await client.post(`/api${path}`, body);
    return res.data;
  },
  async delete(path) {
    const res = await client.delete(`/api${path}`);
    return res.data;
  }
};