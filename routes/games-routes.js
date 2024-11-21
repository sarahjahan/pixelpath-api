import express from "express";
import axios from "axios";

const router = express.Router();
const { API_KEY, CLIENT_ID } = process.env

const getGamesList = async () => {
    try {const query = `
            fields name, genres.name, cover.url;
            where aggregated_rating > 95;
            sort aggregated_rating asc;
            limit 20;`;
            const data = await axios.post("https://api.igdb.com/v4/games", query, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': API_KEY
                }
            })
            console.log("Games retrieved from API");
            return data;
    } catch (err) {
        console.error("Error retreiving games:", error)
    }};

router.route("/")
.get(async (req, res) => {
    try {
        const games = await getGamesList(); 
        res.status(200).json(games.data);
    }catch (err) {
        res.status(500).send(`Error retreiving games: ${err.message}`)
    }
});





    






export default router;
