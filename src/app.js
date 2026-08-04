const express = require('express');
const app = express();
app.use(express.json());
app.use('/hackathons', require('./routes/hackathonRoutes'));
app.get('/health', (req, res) => res.json({status: 'Okay'}));
module.exports = app;
