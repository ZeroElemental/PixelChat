// server/src/routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-request', protect, sendFriendRequest);
router.post('/accept-request', protect, acceptFriendRequest);
// You can add a '/reject-request' route here

module.exports = router;