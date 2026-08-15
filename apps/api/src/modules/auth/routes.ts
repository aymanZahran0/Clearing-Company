import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import { strictRateLimit } from "../../middleware/rateLimit.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./schema.js";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
} from "./controller.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  strictRateLimit,
  validateRequest({ body: registerSchema }),
  asyncHandler(registerHandler)
);
authRouter.post(
  "/login",
  strictRateLimit,
  validateRequest({ body: loginSchema }),
  asyncHandler(loginHandler)
);
authRouter.post("/refresh", asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.post(
  "/forgot-password",
  strictRateLimit,
  validateRequest({ body: forgotPasswordSchema }),
  asyncHandler(forgotPasswordHandler)
);
authRouter.post(
  "/reset-password",
  strictRateLimit,
  validateRequest({ body: resetPasswordSchema }),
  asyncHandler(resetPasswordHandler)
);
authRouter.post(
  "/change-password",
  authenticate,
  strictRateLimit,
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(changePasswordHandler)
);
authRouter.get("/me", authenticate, asyncHandler(meHandler));
