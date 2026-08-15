import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  { _id: false }
);

const recipientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true
    },
    organNeeded: {
      type: String,
      enum: ["Kidney", "Liver", "Heart", "Lung", "Pancreas"],
      required: [true, "Organ needed is required"]
    },
    bloodGroup: {
      type: String,
      enum: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
      required: [true, "Blood group is required"]
    },
    urgencyLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: [true, "Urgency level is required"]
    },
    location: {
      type: pointSchema,
      required: [true, "Location coordinates are required"]
    },
    weight: {
      type: Number,
      required: [true, "Recipient weight in kg is required"],
      min: [1, "Weight must be greater than 0"]
    },
    age: {
      type: Number,
      default: 35
    },
    hla: {
      a1: { type: String, default: "" },
      a2: { type: String, default: "" },
      b1: { type: String, default: "" },
      b2: { type: String, default: "" },
      dr1: { type: String, default: "" },
      dr2: { type: String, default: "" }
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    hospital: {
      type: String
    },
    medicalHistory: {
      type: String,
      default: ""
    },
    verificationDocuments: {
      type: [
        {
          fileUrl: String,
          docType: { type: String, enum: ["ID", "physician_referral"] },
          status: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING" },
          rejectionReason: String
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Define 2dsphere index for location
recipientSchema.index({ location: "2dsphere" });

const Recipient = mongoose.model("Recipient", recipientSchema);

export default Recipient;
export { Recipient };
