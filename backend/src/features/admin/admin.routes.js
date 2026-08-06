import { Router } from "express";
import { verifyDocument, updateUrgency, dashboard, analytics, matchingCandidates, proposeMatch } from "./admin.controller.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();
router.use(authenticate, authorize("admin"));

router.post("/verify-document", verifyDocument);
router.post("/urgency", updateUrgency);
router.get("/dashboard", dashboard);
router.get("/analytics", analytics);
router.get("/matching-candidates", matchingCandidates);
router.post("/propose-match", proposeMatch);

export default router;
