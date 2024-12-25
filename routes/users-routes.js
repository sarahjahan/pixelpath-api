import express from "express";
import * as usersController from "../controllers/users-controller.js";

const router = express.Router();

router.route("/register").post(usersController.createUser);
router.route("/login").post(usersController.loginUser);


export default router;
