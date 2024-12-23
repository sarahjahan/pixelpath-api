import initKnex from "knex";
import configuration from "../knexfile.js";
import bcrypt from "bcrypt"
const knex = initKnex(configuration);

function validateInput(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 6; // Minimum password length is 6
  }

const createUser = async (req, res) => {
  const { email, username, password } = req.body;
  try {
    if (!email || !username|| !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    if (!validateInput(email, password)) {
        return res.status(400).json({ error: "Invalid email or weak password." });
    }
    const existingEmail = await knex("users").where({ email: email }).first();
    if (existingEmail) {
      return res
        .status(409)
        .json({ error: "Email is already registered." });
    }
    const existingUser = await knex("users").where({ username: username }).first();
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Username already exists, please select a different username." });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
   
    const userAdded = await knex("users")
      .insert({
        email,
        username,
        password: hashedPassword,
      });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).send(`Unable to add user: ${err.message}`);
  }
};


export { createUser };
