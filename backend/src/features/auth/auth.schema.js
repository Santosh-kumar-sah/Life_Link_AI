import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["donor", "recipient", "admin"], {
    errorMap: () => ({ message: "Role must be 'donor', 'recipient', or 'admin'" })
  }),
  hospital: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export default {
  registerSchema,
  loginSchema
};
