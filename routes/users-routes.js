import express from "express";
import * as usersController from "../controllers/users-controller.js";



const router = express.Router();

router.route("/register").post(usersController.createUser);
router.route("/login").post(usersController.loginUser)
router.route("/protected").get(usersController.authenticateJWT);

// app.get("/protected", authenticateJWT, (req, res) => {
//     res.json({ message: "You have access to this protected route!", user: req.user });
// });



export default router;
