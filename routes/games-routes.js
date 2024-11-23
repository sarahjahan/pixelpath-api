import express from "express";
import * as gamesController from '../controllers/games-controller.js';

const router = express.Router();
const { API_KEY, CLIENT_ID } = process.env

router.route("/search")
.get(gamesController.APIGames)

router.route("/").get(gamesController.myGames)
.post(gamesController.addGame)
.put(gamesController.editGame)
.delete(gamesController.removeGame)


router.route("/:gameid").get(gamesController.myGames)
.put(gamesController.editGame)

export default router;