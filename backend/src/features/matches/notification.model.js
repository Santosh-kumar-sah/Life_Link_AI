import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    type: {
      type: String
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

notificationSchema.post("save", async function (doc) {
  try {
    const { getIO } = await import("../../socket/index.js");
    const io = getIO();
    io.to(`user:${doc.userId.toString()}`).emit("notification:new", doc);
  } catch (err) {
    // Socket.io might not be initialized during scripts/tests
  }
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
export { Notification };
