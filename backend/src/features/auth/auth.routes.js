import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, logout, me } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Stricter rate limits for authentication actions to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 login requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many login attempts. Please try again after 15 minutes."
    }
  }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 registration requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many accounts created from this IP. Please try again after 15 minutes."
    }
  }
});

router.post("/register", registerLimiter, validate({ body: registerSchema }), register);
router.post("/login", loginLimiter, validate({ body: loginSchema }), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

import { inviteAdmin, updateAdminStatus } from "./auth.controller.js";
import { authorize } from "../../middleware/authenticate.js";

router.post("/admin/invite", authenticate, authorize("admin"), inviteAdmin);
router.patch("/admin/:adminId/status", authenticate, authorize("admin"), updateAdminStatus);

export default router;
export { router as authRoutes };
