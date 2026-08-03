import { Router } from "express";
import { updateProfile, getMyProfile } from "./recipient.controller.js";
import { recipientProfileSchema } from "./recipient.schema.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

// Secure all recipient endpoints to authenticated recipients only
router.use(authenticate);
router.use(authorize("recipient"));

router.route("/profile")
  .get(getMyProfile)
  .post(validate({ body: recipientProfileSchema }), updateProfile);

export default router;
export { router as recipientRoutes };
