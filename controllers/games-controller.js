import initKnex from "knex";
import configuration from "../knexfile.js";
// import uuid from "uuid-v4";
const knex = initKnex(configuration);

import axios from "axios";
const { API_KEY, CLIENT_ID } = process.env
// const gameID = uuid()


const getGamesList = async () => {
    try {const query = `
            fields name, genres.name, storyline, themes.name, cover.url; 
            where aggregated_rating > 97;
            sort aggregated_rating asc;
            limit 20;`;
            const apiResponse = await axios.post("https://api.igdb.com/v4/games", query, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': API_KEY
                }
            })
            console.log("Games retrieved from API");
            const mappedResults = apiResponse.data.map((apiResult) => mapApiToDbFields(apiResult));
            return mappedResults;
    } catch (err) {
        console.error("Error retreiving games:", err)
    }};
    

    const mapApiToDbFields = (apiResult) => {
      return {
        id: apiResult.id, // Maps 'id' from API to 'gameID' in DB
        title: apiResult.name, // Maps 'name' from API to 'title' in DB
        genres: apiResult.genres[0].name,
        // ? apiResult.genres.join(", ") : null, Convert genres array to a string
        coverArt: apiResult.cover.url || null, // Handles missing cover art
        summary: apiResult.storyline || null, // Optional field
      };
    };


const APIGames = async (req, res) => {
    try {
        const apiGames = await getGamesList();
        const myGames = await knex("games").select("id");
        const dbGameIDs = myGames.map((game) => game.id);
        const gamesWithOwnership = apiGames.map((APIGame) => {
          if (dbGameIDs.includes(APIGame.id)) {
              // Game is in collection, add "isOwned" property as true
              return { ...APIGame, isOwned: true, status: "Want to Play"};
          }
          // Otherwise, just return original game with "isOwned" as false
          return { ...APIGame, isOwned: false, status: "Want to Play" };
      });

        res.status(200).json(gamesWithOwnership);
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
  const { user_id, game_id, title, status, notes, tags, coverArt } = req.body; // <-- for validation , req.body needs db reqd values only 
      if (!game_id || !title ) {
        return res.status(400).json({ error: "Missing required fields" });
      }
    try {
      const existingGame = await knex('games').where({ id: game_id }).first();
        if (existingGame) {
            return res.status(400).json({ error: "Game already exists in the collection." });
        }
        const [newGameID] = await knex('games').insert({
          id: game_id,
          user_id,
          title,
          coverArt,
          tags: tags ? tags.join(", ") : null,
          notes: notes || null, 
        });
        const gameAdded = await knex("games").where({ id: newGameID });
        res.status(201).json(gameAdded);
    }catch (err) {
        res.status(500).send(`Unable to add game: ${err.message}`)
        }
    };

    const singleGame = async (req, res) => {
      const { gameid } = req.params;
      try {
        if (!gameid) {
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
    const { gameid } = req.params;
  try {
    const game = await knex("games").where({id: gameid});

    if (!game) {
      return res.status(404).json({ message: `Game with ID ${{id: gameid}} not found` });
    }
    const removedGame = await knex("games").where({id: gameid}).del();
    // No Content response
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: `Unable to delete game: ${error}`
    });
  }
};




  
  export { APIGames, myGames, addGame, editGame, removeGame, singleGame }