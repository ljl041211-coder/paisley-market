import mongoose from "mongoose";
import { loadEnv } from "./env.server";

// One shared connection for the whole server. It is kept on globalThis so the
// Vite dev server does not open a new connection every time a file is edited.
declare global {
  // eslint-disable-next-line no-var
  var __dbConnection: Promise<typeof mongoose> | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not set. Copy .env.example to .env and add your MongoDB connection string, or start the site with `npm run dev:local`.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export function connectDb(): Promise<typeof mongoose> {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();

  if (!globalThis.__dbConnection) {
    mongoose.set("strictQuery", true);
    globalThis.__dbConnection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .catch((error) => {
        // Forget the failed attempt so the next request can try again.
        globalThis.__dbConnection = undefined;
        throw error;
      });
  }
  return globalThis.__dbConnection;
}
