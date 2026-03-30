import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;
const MONGODB_URI_STANDARD = process.env.MONGODB_URI_STANDARD as string | undefined;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// @ts-expect-error -- global mongoose cache is used to avoid multiple connections in dev
let cached: MongooseCache = global.mongoose;

if (!cached) {
  // @ts-expect-error -- global mongoose cache is used to avoid multiple connections in dev
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const connect = (uri: string) =>
      mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 }).then((m) => m);

    const isSrvLookupError = (err: unknown) => {
      const e = err as { code?: string; syscall?: string; message?: string };
      return e?.code === "ECONNREFUSED" && e?.syscall === "querySrv";
    };

    cached.promise = connect(MONGODB_URI!).catch(async (err) => {
      if (
        MONGODB_URI_STANDARD &&
        MONGODB_URI!.startsWith("mongodb+srv://") &&
        isSrvLookupError(err)
      ) {
        console.warn("MongoDB SRV lookup failed. Falling back to standard URI.");
        return connect(MONGODB_URI_STANDARD);
      }
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}
