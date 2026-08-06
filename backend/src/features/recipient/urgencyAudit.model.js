import mongoose from "mongoose";

const urgencyAuditSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      required: true,
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    previousLevel: {
      type: String,
      required: true
    },
    newLevel: {
      type: String,
      required: true
    },
    justification: {
      type: String,
      required: true
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

const UrgencyAudit = mongoose.model("UrgencyAudit", urgencyAuditSchema);

export default UrgencyAudit;
export { UrgencyAudit };
