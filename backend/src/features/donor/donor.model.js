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

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true
    },
    organs: [
      {
        type: String,
        enum: ["Kidney", "Liver", "Heart", "Lung", "Pancreas"]
      }
    ],
    bloodGroup: {
      type: String,
      enum: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
      required: [true, "Blood group is required"]
    },
    availability: {
      type: Boolean,
      default: true,
      index: true
    },
    location: {
      type: pointSchema,
      required: [true, "Location coordinates are required"]
    },
    weight: {
      type: Number,
      required: [true, "Donor weight in kg is required"],
      min: [1, "Weight must be greater than 0"]
    },
    donorType: {
      type: String,
      enum: ["living", "deceased-registered"],
      default: "living"
    },
    medicalHistory: {
      type: String,
      default: ""
    },
    hospital: {
      type: String
    },
    explicitConsent: {
      type: Boolean,
      default: false
    },
    verificationDocuments: {
      type: [
        {
          fileUrl: String,
          docType: { type: String, enum: ["ID", "medical_records"] },
          status: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING" },
          rejectionReason: String
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: ["active", "matched", "inactive"],
      default: "inactive"
    }
  },
  {
    timestamps: true
  }
);

// Define 2dsphere geospatial index for distance queries
donorSchema.index({ location: "2dsphere" });

donorSchema.virtual("organType").get(function () {
  return this.organs && this.organs[0];
});

donorSchema.set("toJSON", { virtuals: true });
donorSchema.set("toObject", { virtuals: true });

const Donor = mongoose.model("Donor", donorSchema);

export default Donor;
export { Donor };
