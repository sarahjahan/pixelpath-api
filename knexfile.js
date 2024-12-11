import "dotenv/config";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

export default {
  client: "mysql2",
  connection: process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL, // Production: Use DATABASE_URL
    }
  : {
      // Development: Use individual environment variables
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
};