const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');

const getMessages = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).populate('sender', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const sendMessage = async (req, res) => {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;
    try {
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message,
        });
        await newMessage.save();
        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username');
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const uploadFile = async (req, res) => {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // Upload file to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "auto" }, // Automatically detect file type
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Create a new message with the Cloudinary URL
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: result.secure_url,
            messageType: result.resource_type === 'image' ? 'image' : 'file',
        });
        
        await newMessage.save();
        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username');
        res.status(201).json(populatedMessage);

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Server Error during file upload.' });
    }
};

module.exports = { getMessages, sendMessage, uploadFile  };