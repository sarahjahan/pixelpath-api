import express from "express";
import * as gamesController from '../controllers/games-controller.js';

const router = express.Router();
const { API_KEY, CLIENT_ID } = process.env

router.route("/search")
.get(gamesController.APIGames)

router.route("/").get(gamesController.myGames)
.post(gamesController.addGame)

router.route("/:gameid").get(gamesController.singleGame)
.put(gamesController.editGame)
.delete(gamesController.removeGame)


export default router;