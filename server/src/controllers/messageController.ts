import { Request, Response } from 'express';
import Message from '../model/Message';

// @desc    Get all messages between two users
// @route   GET /api/messages/:id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMessages = async (req: Request & { user?: any }, res: Response) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).populate('sender', 'username').populate('receiver', 'username');

    res.json(messages);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendMessage = async (req: Request & { user?: any }, res: Response) => {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    try {
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};