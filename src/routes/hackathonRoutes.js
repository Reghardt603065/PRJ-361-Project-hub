const express = require('express');
const router = express.Router();
const { getHackathons, createHackathon, joinHackathon, leaveHackathon } = require('../controllers/hackathonController');
const mockAuth = require('../middleware/mockAuth');

router.get('/', getHackathons);
router.post('/', mockAuth, createHackathon);
router.post('/join', mockAuth, joinHackathon);
router.post('/leave', mockAuth, leaveHackathon);

module.exports = router;