import express from "express";
import * as gamesController from '../controllers/games-controller.js';

const router = express.Router();
const { API_KEY, CLIENT_ID } = process.env

router.route("/")
.get(gamesController.allGames)
.post(gamesController.allGames)

export default router;