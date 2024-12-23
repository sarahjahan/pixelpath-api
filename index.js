import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();


const PORT = process.env.PORT || 8080;
const { CORS_ORIGIN } = process.env;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static("public"));

import usersRoutes from "./routes/users-routes.js";
import gamesRoutes from "./routes/games-routes.js";
import tagsRoutes from "./routes/tags-routes.js";

app.use("/auth/", usersRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/tags", tagsRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
