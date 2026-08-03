import { Router } from "express";
import { updateProfile, getMyProfile } from "./donor.controller.js";
import { donorProfileSchema } from "./donor.schema.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/authenticate.js";

const router = Router();

// Secure all donor endpoints to authenticated donors only
router.use(authenticate);
router.use(authorize("donor"));

router.route("/profile")
  .get(getMyProfile)
  .post(validate({ body: donorProfileSchema }), updateProfile);

export default router;
export { router as donorRoutes };
