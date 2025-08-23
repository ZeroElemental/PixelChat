import { Request, Response } from 'express';
import User from '../model/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAllUsers = async (req: Request & { user?: any }, res: Response) => {
  try {
    // Find all users except the one who is currently logged in
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};