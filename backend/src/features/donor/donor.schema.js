import { z } from "zod";

export const donorProfileSchema = z.object({
  organType: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"], {
    errorMap: () => ({ message: "Organ type must be Kidney, Liver, Heart, Lung, or Pancreas" })
  }),
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], {
    errorMap: () => ({ message: "Invalid blood group" })
  }),
  availability: z.boolean().optional().default(true),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  weight: z.coerce.number().positive("Weight must be a positive number")
});

export default {
  donorProfileSchema
};
