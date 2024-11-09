import { Router } from "express";
import { deleteUser, enable2FA, getUserDetails } from "../controllers/User";


const router = Router()
router.get('/', getUserDetails )
router.delete("/:user_id", deleteUser)
router.post("/:user_id/enable_2fa", enable2FA)
// router.get("/verify/:token", verify);

export {router as userRoutes}