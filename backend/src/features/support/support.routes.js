import { Router } from "express";
import { handleSupportChat } from "./support.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

// Endpoint is protected to authenticated users of LifeLink
router.post("/chat", protect, handleSupportChat);

export default router;
