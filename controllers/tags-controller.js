import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

const addTags = async (req, res) => {
    const { tagName, gameId } = req.body;

    if (!tagName || !gameId) {
        return res.status(400).json({ message: "Tag name and game ID are required" });
      }

      try {const existingTag = await knex("tags")
        .where({ name: tagName, game_id: gameId })
        .first();
  
      if (existingTag) {
        return res.status(400).json({ message: "Tag already exists for this game" });
      }
      await knex("tags").insert({
        name: tagName,
        game_id: gameId,
        user_id: 1, // Hardcoded user ID as 1
      });
      res.status(201).json({ message: "Tag created successfully" });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({ message: "Failed to create tag" });
  }
};

export { addTags }