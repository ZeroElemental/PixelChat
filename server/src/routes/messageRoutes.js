const express = require('express');
const router = express.Router();
const { getMessages, sendMessage,uploadFile  } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.get('/:id', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadFile); // New upload route

module.exports = router;