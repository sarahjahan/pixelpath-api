import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);
import axios from "axios";

const { API_KEY, CLIENT_ID } = process.env;

const getGamesList = async () => {
  try {
    const body = `
            fields name, genres.name, storyline, themes.name, cover.url; 
            where aggregated_rating > 80;
            sort aggregated_rating asc;
            limit 50;`;
    const apiResponse = await axios.post(
      "https://api.igdb.com/v4/games",
      body,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: API_KEY,
        },
      }
    );
    console.log("Games retrieved from API");
    const mappedResults = apiResponse.data.map((apiResult) =>
      mapApiToDbFields(apiResult)
    );
    return mappedResults;
  } catch (err) {
    console.error("Error retreiving games:", err);
  }
};

const mapApiToDbFields = (apiResult) => {

  return {
    id: apiResult.id, // Maps 'id' from API to 'gameID' in DB
    title: apiResult.name, // Maps 'name' from API to 'title' in DB
    genres: apiResult.genres.map(genre => genre.name).join(", ") || "No genres available",
    tags: apiResult.themes && apiResult.themes.length > 0 
    ? apiResult.themes.map(theme => theme.name).join(", ") 
    : "No tags available",
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
        return { ...APIGame, isOwned: true, status: "Want to Play" };
      }
      // Otherwise, just return original game with "isOwned" as false
      return { ...APIGame, isOwned: false, status: "Want to Play" };
    });

    res.status(200).json(gamesWithOwnership);
  } catch (err) {
    res.status(500).send(`Error retreiving games list: ${err.message}`);
  }
};

const myGames = async (req, res) => {
  try {
      const sortBy = req.query.sortBy || "title";
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
  const { user_id, game_id, title, status, notes, tags, coverArt, genres } = req.body; // <-- for validation , req.body needs db reqd values only
  if (!game_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const existingGame = await knex("games").where({ id: game_id }).first();
    if (existingGame) {
      return res
        .status(400)
        .json({ error: "Game already exists in the collection." });
    }
    const [newGameID] = await knex("games").insert({
      id: game_id,
      user_id,
      title,
      coverArt,
      tags,
      genres,
      notes: notes || null,
    });
    const gameAdded = await knex("games").where({ id: newGameID });
    res.status(201).json(gameAdded);
  } catch (err) {
    res.status(500).send(`Unable to add game: ${err.message}`);
  }
};

const singleGame = async (req, res) => {
  const { gameid } = req.params;
  try {
    if (!gameid) {
      return res
        .status(404)
        .json({ message: `Game with ID ${id} does not exist` });
    }
    const gameQuery = await knex("games")
      .leftJoin("tags", "games.id", "tags.game_id")
      .select("games.*", "tags.name as tag_name")
      .where("games.id", gameid);

    if (gameQuery.length === 0) {
      return res
        .status(404)
        .json({ message: `Game with ID ${gameid} not found.` });
    }

    const formattedGame = gameQuery.reduce((acc, game) => {
      const { id, title, status, rating, tag_name, coverArt, notes, summary, genres } = game;

      if (!acc[id]) {
        acc[id] = {
          id,
          title,
          status,
          rating,
          tags: [],
          coverArt, 
          notes, 
          summary, 
          genres,
        };
      }

      if (tag_name) {
        acc[id].tags.push(tag_name);
      }

      return acc;
    }, {});

    const getGameDetails = Object.values(formattedGame)[0];
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
      .where({ id: gameid })
      .update(req.body);
    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Game with ID ${req.params.gameid} not found, ${error}`,
      });
    }
    const updatedGame = await knex("games").where({ id: gameid });
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
    const game = await knex("games").where({ id: gameid });

    if (!game) {
      return res
        .status(404)
        .json({ message: `Game with ID ${{ id: gameid }} not found` });
    }
    const removedGame = await knex("games").where({ id: gameid }).del();
    // No Content response
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: `Unable to delete game: ${error}`,
    });
  }
};




export { APIGames, myGames, addGame, editGame, removeGame, singleGame };
