import { Router } from "express";
import { handleSupportChat } from "./support.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Endpoint is protected to authenticated users of LifeLink
router.post("/chat", authenticate, handleSupportChat);

export default router;
