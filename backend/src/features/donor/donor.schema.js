import { z } from "zod";

export const donorProfileSchema = z.object({
  organs: z.array(
    z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"])
  ).min(1, "At least one organ must be specified").optional(),
  organType: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"]).optional(),
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], {
    errorMap: () => ({ message: "Invalid blood group" })
  }),
  availability: z.boolean().optional().default(true),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  weight: z.coerce.number().positive("Weight must be a positive number"),
  donorType: z.enum(["living", "deceased-registered"]).optional().default("living"),
  medicalHistory: z.string().optional().default(""),
  hospital: z.string().optional(),
  explicitConsent: z.boolean().optional().default(false)
}).refine(data => (data.organs && data.organs.length > 0) || data.organType, {
  message: "At least one organ or organType must be specified",
  path: ["organs"]
}).transform(data => {
  const finalData = { ...data };
  if (finalData.organType && (!finalData.organs || finalData.organs.length === 0)) {
    finalData.organs = [finalData.organType];
  }
  return finalData;
});

export default {
  donorProfileSchema
};
