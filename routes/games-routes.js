import express from "express";
import axios from "axios";

const router = express.Router();
const { API_KEY, CLIENT_ID } = process.env


router.route("/")
.get((req, res) => {
    const getGamesList = async (req, res) => {
        try {
            const query = `
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
          console.log("Games retrieved from API")
        //   res.status(200).json(data);

        } catch (err) {
            console.log(err)
            // res.status(400).send(`Error retrieving games: ${err}`);

        }};
    
    getGamesList()
});





    






export default router;
