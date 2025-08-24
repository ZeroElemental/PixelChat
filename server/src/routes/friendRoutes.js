const express = require('express');
const router = express.Router();
const { addFriend } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addFriend);

module.exports = router;