import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env file');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
  } catch (err) {
    if (err instanceof Error) {
        console.error(err.message);
    } else {
        console.error('An unknown error occurred', err);
    }
    process.exit(1);
  }
};

export default connectDB;