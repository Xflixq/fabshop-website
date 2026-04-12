import { defineConfig } from "drizzle-kit";
import path from "path";

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;
const port = Number(process.env.MYSQL_PORT ?? "3306");

if (!host || !user || !password || !database) {
  throw new Error("MySQL environment variables are required");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "mysql",
  dbCredentials: { host, port, user, password, database },
});
