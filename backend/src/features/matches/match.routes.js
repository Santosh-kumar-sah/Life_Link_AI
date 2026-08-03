import { Router } from "express";
import { getMyMatches, adminGetMatches, adminUpdateMatchStatus } from "./match.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

// Secure all match routes with global authentication middleware
router.use(authenticate);

// Get user-specific matching records (Donors or Recipients)
router.get("/", getMyMatches);

// Hospital Admin oversight routes
router.get("/admin", authorize("admin"), adminGetMatches);
router.patch("/admin/:matchId", authorize("admin"), adminUpdateMatchStatus);

export default router;
export { router as matchRoutes };
