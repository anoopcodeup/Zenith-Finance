import { Router } from "express";
import { loginUser, getMe, logoutUser, refreshToken, registerUser } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.schema";
import { authenticate } from "../middlewares/auth.middleware";
import { publicRateLimit, authRateLimit } from "../middlewares/rateLimit.middleware";


const router = Router();

router.post("/register", publicRateLimit, validate(registerSchema), registerUser);
router.post("/login", publicRateLimit, validate(loginSchema), loginUser);
router.get("/me", authenticate, authRateLimit, getMe);
router.post("/logout", authRateLimit, logoutUser);
router.post("/refresh", authRateLimit, refreshToken);

export default router;
