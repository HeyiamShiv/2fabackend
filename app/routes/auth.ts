import { Router } from "express";
import { login, signup, updatePassword , resetPassword, verifyUserEmail, verifyOTP} from "../controllers/Auth"


const router = Router()
router.post('/reset_password', resetPassword)
router.patch('/reset_password', updatePassword)
router.post("/signup",signup);
router.post("/login",login);
router.post("/verify_otp", verifyOTP)
router.get("/verify/:token", verifyUserEmail);

export {router as authRoutes}