import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Define the base user properties
export interface IUser {
  username: string;
  email: string;
  password?: string; // Make password optional on the base type
}

// 2. Create the Mongoose document interface, extending the base and Document
export interface IUserDocument extends IUser, Document {
  // Add any instance methods here
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// 3. Create the Schema using the document interface
const userSchema: Schema<IUserDocument> = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 4. Create and export the Model
const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);
export default User;