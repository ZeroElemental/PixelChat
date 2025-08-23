import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types'; // We will define this interface soon

// Extend the IUser interface with Mongoose's Document properties
export interface IUserDocument extends IUser, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<IUserDocument> = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre<IUserDocument>('save', async function (next) {
  // Check if the password field was modified and is a string
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt); // This will now work
    next();
  } catch (error) {
    // Pass error to the next middleware
    if (error instanceof Error) {
       return next(error);
    }
    return next(new Error('Password hashing failed'));
  }
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;