import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

import axios from "axios";
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

const APIGames = async (_req, res) => {
    try {
        const games = await getGamesList(); 
        res.status(200).json(games.data);
    }catch (err) {
        res.status(500).send(`Error retreiving games list: ${err.message}`)
        }
    };

const myGames = async (req, res) => {
    try {
        const games = await knex('games');
        res.status(200).json(games);
    }catch (err) {
        res.status(500).send(`Error retreiving my games library: ${err.message}`)
        }
    };

const addGame = async (req, res) => {
    // let {
    //     user_id,
    //     title,
    //     status,
    //     notes,
    //     tags,
    //     summary,
    //   } = req.body; // <-- for validation , req.body needs db reqd values only 
    try {
        const [newGameID] = await knex('games').insert(req.body);
        const gameAdded = await knex("games").where({ id: newGameID });
        res.status(201).json(gameAdded);
    }catch (err) {
        res.status(500).send(`Unable to add game: ${err.message}`)
        }
    };
  
  export { APIGames, myGames, addGame }