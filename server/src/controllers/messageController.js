const Message = require('../models/Message');

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

module.exports = { getMessages, sendMessage };