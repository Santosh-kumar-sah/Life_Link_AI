import { z } from "zod";

export const recipientProfileSchema = z.object({
  organNeeded: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"], {
    errorMap: () => ({ message: "Organ needed must be Kidney, Liver, Heart, Lung, or Pancreas" })
  }),
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], {
    errorMap: () => ({ message: "Invalid blood group" })
  }),
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    errorMap: () => ({ message: "Urgency level must be LOW, MEDIUM, HIGH, or CRITICAL" })
  }).optional(),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  weight: z.coerce.number().positive("Weight must be a positive number"),
  age: z.coerce.number().positive("Age must be a positive number").optional().default(35),
  hla: z.object({
    a1: z.string().optional().default(""),
    a2: z.string().optional().default(""),
    b1: z.string().optional().default(""),
    b2: z.string().optional().default(""),
    dr1: z.string().optional().default(""),
    dr2: z.string().optional().default("")
  }).optional(),
  hospital: z.string().optional(),
  medicalHistory: z.string().optional().default("")
});

export default {
  recipientProfileSchema
};
