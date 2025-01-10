import initKnex from "knex";
import configuration from "../knexfile.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";



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


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Check if the user exists
    const user = await knex("users").where({ email }).first();
    console.log("User fetched from DB:", user);


    if (!user) {
      return res.status(401).json({ error: "Invalid user credentials." });
    }

    // Compare the password with the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.password); // Ensure correct field name
    console.log("Password from request:", password);
    console.log("Hashed password from DB:", user.password);
    console.log("Password comparison result:", validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid pass credentials." });
    }

    // Generate a JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Send the token back to the client
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }

};


// const authenticateJWT = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//       return res.sendStatus(403);
//   }

//   jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
//       if (err) {
//           return res.sendStatus(403);
//       }
//       req.user = user; // Attach user info to the request object
//       next();
//   });
// };



export { createUser, loginUser };
