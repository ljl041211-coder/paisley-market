// Local development with a persistent MongoDB database in .data/mongo.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "./seed";

const dbPath = resolve(".data/mongo");
mkdirSync(dbPath, { recursive: true });

console.log("Starting a local MongoDB (the first run downloads it, which can take a minute)...");
let server: MongoMemoryServer;
try {
  server = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: "wiredTiger", dbName: "marktplatz" },
  });
} catch (error) {
  console.error(
    "\nCould not start the local MongoDB:",
    error instanceof Error ? error.message.split("\n")[0] : error,
    "\nCheck your internet connection and try again. Or use MongoDB Atlas instead:",
    "\ncopy .env.example to .env, set MONGODB_URI, then run `npm run seed` and `npm run dev`.\n",
  );
  process.exit(1);
}
process.env.MONGODB_URI = server.getUri("marktplatz");

const outcome = await seedDatabase({ reset: false });
console.log(
  outcome === "seeded"
    ? "Local database created with demonstration data."
    : "Using the existing local database in .data/mongo.",
);
// The dev server opens its own connection.
await mongoose.disconnect();
globalThis.__dbConnection = undefined;

const dev = spawn("npx", ["react-router", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

let stopping = false;
async function shutDown() {
  if (stopping) return;
  stopping = true;
  dev.kill("SIGTERM");
  await server.stop({ doCleanup: false }); // keep the data files
  process.exit(0);
}
process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
dev.on("exit", shutDown);
