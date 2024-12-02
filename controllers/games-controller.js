import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);
import axios from "axios";

const { API_KEY, CLIENT_ID } = process.env;

const getGamesList = async () => {
  try {
    const body = `
            fields name, genres.name, summary, themes.name, cover.url; 
            where aggregated_rating > 80;
            sort aggregated_rating asc;
            limit 200;`;
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
    const limitedResponse = apiResponse.data.map((game) => ({
      ...game,
      genres: game.genres ? game.genres.slice(0, 2) : [],
      themes: game.themes ? game.themes.slice(0, 1) : [], 
    }));
    const mappedResults = limitedResponse.map((apiResult) =>
      mapApiToDbFields(apiResult)
    );
    return mappedResults;
  } catch (err) {
    console.error("Error retrieving games:", err);
  }};

const mapApiToDbFields = (apiResult) => {
  const genres = apiResult.genres && apiResult.genres.length > 0 
    ? apiResult.genres.map((genre) => genre.name).join(", ") 
    : null;

  const themes = apiResult.themes && apiResult.themes.length > 0 
    ? apiResult.themes.map((theme) => theme.name).join(", ") 
    : null;

  const combinedTags = [genres, themes].filter(Boolean).join(", ") || "No tags available";

  return {
    id: apiResult.id, 
    title: apiResult.name, 
    tags: combinedTags, 
    coverArt: apiResult.cover.url || null, 
    summary: apiResult.summary || null,
  };
};


const APIGames = async (req, res) => {
  try {
    const apiGames = await getGamesList();
    const myGames = await knex("games").select("id");
    const dbGameIDs = myGames.map((game) => game.id);
    const gamesWithOwnership = apiGames.map((APIGame) => {
      if (dbGameIDs.includes(APIGame.id)) {
        return { ...APIGame, isOwned: true, status: "Want to Play" };
      }
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
      .groupBy("games.id")
      .select(
        "games.id",
        "games.title",
        "games.user_id",
        "games.coverArt",
        "games.status",
        "games.summary",
        "games.rating",
        "games.notes",
        knex.raw('JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) as tags')
      )
      .orderBy(sortBy, order);
      res.status(200).json(games);
  }catch (err) {
      res.status(500).send(`Error retreiving my games library: ${err.message}`)
      }
  };

const addGame = async (req, res) => {
  const { user_id, game_id, title, status, notes, tags, coverArt } = req.body; 
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

      await knex.raw(rawInsertQuery);

      const tagIds = await knex("tags").whereIn("name", tagNames).pluck("id");
      const gameTagsInserts = tagIds.map((tagId) => ({
        game_id: game_id,
        tag_id: tagId,
      }));
      await knex("game_tags").insert(gameTagsInserts);
    }

    const gameAdded = await knex("games")
      .where("games.id", game_id) 
      .select(
        "games.id",
        "games.title",
        "games.coverArt",
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
    .leftJoin("game_tags", "games.id", "game_tags.game_id") 
    .leftJoin("tags", "game_tags.tag_id", "tags.id") 
    .select(
      "games.id",
      "games.title",
      "games.status",
      "games.rating",
      "games.coverArt",
      "games.notes",
      "games.summary",
      knex.raw(`
        COALESCE(
            JSON_ARRAYAGG(
              CASE
                WHEN tags.id IS NOT NULL THEN JSON_OBJECT("id", tags.id, "name", tags.name)
                ELSE NULL
              END
            ),
            JSON_ARRAY()
          ) as tags
        `)
    )
    .where("games.id", gameid)
    .groupBy("games.id"); 

    if (gameQuery.length === 0) {
      return res
        .status(404)
        .json({ message: `Game with ID ${gameid} not found.` });
    }

    const getGameDetails = gameQuery[0];
    res.status(200).json(getGameDetails);
  } catch (error) {
    res.status(500).json({
      message: `Unable to obtain game with ID ${req.params.gameid}, ${error}`,
    });
  }
};

const editGame = async (req, res) => {
  const { gameid } = req.params;
  const { tags, removedTags, ...gameDetails } = req.body;

  try {
    const rowsUpdated = await knex("games").where({ id: gameid }).update(gameDetails);
    if (rowsUpdated === 0) {
      return res.status(404).json({ message: `Game with ID ${gameid} not found.` });
    }

    if (removedTags && Array.isArray(removedTags)) {
      const removedTagIds = removedTags.map((tag) => tag.id);
      await knex("game_tags")
        .where({ game_id: gameid })
        .whereIn("tag_id", removedTagIds)
        .del();
    }
    if (tags && Array.isArray(tags)) {
      const invalidTags = tags.filter((tag) => !tag.id || !tag.name);
      if (invalidTags.length > 0) {
        return res.status(400).json({
          message: "Invalid tags provided. Each tag must have a valid `id` and `name`.",
        });
      }

      const tagIds = tags.map((tag) => tag.id);
      const existingAssociations = await knex("game_tags")
        .where({ game_id: gameid })
        .pluck("tag_id");

      const newAssociations = tagIds
        .filter((id) => !existingAssociations.includes(id)) 
        .map((tagId) => ({
          game_id: gameid,
          tag_id: tagId,
        }));

      if (newAssociations.length > 0) {
        await knex("game_tags").insert(newAssociations);
      }
    }

    const updatedGame = await knex("games").where({ id: gameid }).first();
    const updatedTags = await knex("tags")
      .join("game_tags", "tags.id", "game_tags.tag_id")
      .where("game_tags.game_id", gameid)
      .select("tags.id", "tags.name"); 

    res.status(200).json({ ...updatedGame, tags: updatedTags });
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({
      message: `Unable to update game with ID ${gameid}: ${error.message}`,
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
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: `Unable to delete game: ${error}`,
    });
  }
};

export { APIGames, myGames, addGame, editGame, removeGame, singleGame };
