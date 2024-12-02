import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

const getTags = async (req, res) => {
  try {
    const tags = await knex("tags").select("tags.id", "tags.name");
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).send(`Error retreiving my games library: ${err.message}`);
  }
};

const editTags = async (req, res) => {
  const { tags, gameId } = req.body;

  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ message: "No tags provided" });
  }
  try {
    const existingTags = await knex("tags")
      .where({ game_id: gameId })
      .pluck("name");
    const updatedTags = [...new Set([...existingTags, ...tags])];
    const newTags = updatedTags.filter((tag) => !existingTags.includes(tag));
    await Promise.all(
      newTags.map(async (tagName) => {
        await knex("tags").insert({
          name: tagName,
          game_id: gameId,
        });
      })
    );
    res.status(201).json({ message: "Tags added successfully" });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({ message: "Failed to create tag" });
  }
};

export { editTags, getTags };
