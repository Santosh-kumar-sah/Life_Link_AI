import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true
    },
    response: {
      type: String
    },
    status: {
      type: String,
      enum: ["PENDING", "RESOLVED"],
      default: "PENDING"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
export { Message };
