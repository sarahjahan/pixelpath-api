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
      const games = await knex("games")
      .leftJoin("game_tags", "games.id", "game_tags.game_id")
      .leftJoin("tags", "game_tags.tag_id", "tags.id")
      .groupBy("games.id") // Ensure grouping by game ID
      .select(
        "games.id",
        "games.title",
        "games.user_id",
        knex.raw('JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) as tags')
      )
      .orderBy(sortBy, order);
      res.status(200).json(games);
  }catch (err) {
      res.status(500).send(`Error retreiving my games library: ${err.message}`)
      }
  };

const addGame = async (req, res) => {
  const { user_id, game_id, title, status, notes, tags, coverArt, genres } = req.body; // <-- for validation , req.body needs db reqd values only
  if (!game_id || !user_id || !title ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const existingGame = await knex("games").where({ id: game_id }).first();
    if (existingGame) {
      return res
        .status(400)
        .json({ error: "Game already exists in the collection." });
    }
    await knex("games").insert({
      id: game_id,
      user_id,
      title,
      coverArt,
      genres,
      notes: notes || null,
    });
    if (tags) {
      const tagNames = tags.split(",").map((tag) => tag.trim());

      const values = tagNames.map((name) => `('${name}')`).join(", ");
      const rawInsertQuery = `
        INSERT INTO tags (name)
        VALUES ${values}
        ON DUPLICATE KEY UPDATE name = name;
      `;

      // Execute the raw query for inserting tags
      await knex.raw(rawInsertQuery);

      // Fetch the tag IDs for the given tag names
      const tagIds = await knex("tags").whereIn("name", tagNames).pluck("id");

      // Insert entries into the `game_tags` junction table
      const gameTagsInserts = tagIds.map((tagId) => ({
        game_id: game_id,
        tag_id: tagId,
      }));
      await knex("game_tags").insert(gameTagsInserts);
    }

    const gameAdded = await knex("games")
      .where("games.id", game_id) // Explicitly specify `games.id`
      .select(
        "games.id",
        "games.title",
        "games.coverArt",
        "games.genres",
        "games.notes",
        knex.raw(`
          COALESCE(
            JSON_ARRAYAGG(
              JSON_OBJECT("id", tags.id, "name", tags.name)
            ), JSON_ARRAY()
          ) as tags
        `)
      )
      .leftJoin("game_tags", "games.id", "game_tags.game_id")
      .leftJoin("tags", "game_tags.tag_id", "tags.id")
      .groupBy("games.id");
    res.status(201).json(gameAdded[0]);
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
