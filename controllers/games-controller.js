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
        const sortBy = req.query.sortBy || "title" || "status" || "rating";
        const order = req.query.order || "asc";
        let query = knex("games");
        if (sortBy && sortBy !== "no_sort") {
          query = query.orderBy(sortBy, order);
        }
        const games = await getGamesList().orderBy(sortBy, order);
        res.status(200).json(games.data);
    }catch (err) {
        res.status(500).send(`Error retreiving games list: ${err.message}`)
        }
    };

const myGames = async (req, res) => {
    try {
        const sortBy = req.query.sortBy || "title" || "status" || "rating";
        const order = req.query.order || "asc";
        let query = knex("games");
        if (sortBy && sortBy !== "no_sort") {
          query = query.orderBy(sortBy, order);
        }
        const games = await knex('games').orderBy(sortBy, order);
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

    const singleGame = async (req, res) => {
      const { gameid } = req.params;
      try {
        if (!game) {
          return res.status(404).json({ message: `Game with ID ${id} does not exist` });
        }
          const getGameDetails = await knex("games").where({id: gameid});
          res.status(200).json(getGameDetails);
        } catch (error) {
          res.status(500).json({
            message: `Unable to obtain game with ID ${req.params.gameid}, ${error}`,
          });
        }
      };


const editGame = async (req, res) => {
    const { gameid } = req.params;
    // console.log(req.params.id);
    // console.log(gameid)
    // console.log(req.params)
    try {
        const rowsUpdated = await knex("games")
          .where({id: gameid})
          .update(req.body);
        if (rowsUpdated === 0) {
          return res.status(404).json({
            message: `Game with ID ${req.params.gameid} not found, ${error}`,
          });
        }
        const updatedGame = await knex("games").where({id: gameid});
        res.status(200).json(updatedGame[0]);
      } catch (error) {
        res.status(500).json({
          message: `Unable to update games with ID ${req.params.gameid}: ${error}`,
        });
      }
    };

const removeGame = async (req, res) => {
    const id = req.body;
  try {
    const game = await knex("games").where(id).first();

    if (!game) {
      return res.status(404).json({ message: `Game with ID ${id} not found` });
    }
    await knex("games").where(id).del();
    // No Content response
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: `Unable to delete game: ${error}`
    });
  }
};




  
  export { APIGames, myGames, addGame, editGame, removeGame, singleGame }