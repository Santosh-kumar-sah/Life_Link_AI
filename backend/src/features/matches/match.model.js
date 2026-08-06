import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: [true, "Donor reference is required"],
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      required: [true, "Recipient reference is required"],
      index: true
    },
    score: {
      type: Number,
      required: [true, "Match score is required"],
      min: [0, "Score cannot be less than 0"],
      max: [100, "Score cannot exceed 100"]
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "COMPLETED"],
      default: "PENDING",
      index: true
    },
    matchedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    responseDeadline: {
      type: Date
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    donorStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED"],
      default: "PENDING"
    },
    recipientStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED"],
      default: "PENDING"
    },
    declineReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Ensure a donor can have only one match with a specific recipient (prevent duplicate match items)
matchSchema.index({ donorId: 1, recipientId: 1 }, { unique: true });

const Match = mongoose.model("Match", matchSchema);

export default Match;
export { Match };
