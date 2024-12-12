import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();


const PORT = process.env.PORT || 8080;
const { CORS_ORIGIN } = process.env;

const allowedOrigins = [CORS_ORIGIN, 'http://localhost:8080'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json());
app.use(express.static("public"));

// import usersRoutes from "./routes/users-routes.js";
import gamesRoutes from "./routes/games-routes.js";
import tagsRoutes from "./routes/tags-routes.js";

// app.use("/api/users", usersRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/tags", tagsRoutes);

app.get('/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
