import { Router } from "express";
import { getNotifications, markRead, markAllRead } from "./notification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/", getNotifications);
router.patch("/mark-all-read", markAllRead);
router.patch("/:id/read", markRead);

export default router;
