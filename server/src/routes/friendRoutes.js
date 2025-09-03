// server/src/routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest, getFriendRequests } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-request', protect, sendFriendRequest);
router.post('/accept-request', protect, acceptFriendRequest);
router.get('/requests', protect, getFriendRequests); // Add this line

module.exports = router;