import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  receiver: mongoose.Schema.Types.ObjectId;
  message: string;
}

const messageSchema: Schema<IMessage> = new Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
}, { timestamps: true });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
export default Message;