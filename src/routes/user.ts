import express from "express";
import UserController from "../controllers/user.controller";

const router = express.Router();
const userController = new UserController();

router.post("/signup", userController.createUser);
router.post("/login", userController.login);
router.get("/single/:_id", userController.getUser);
router.get("/verify/:uniqueString", userController.verifyUser);
router.post("/verify", userController.sendVerificationEmail);

export default router;
