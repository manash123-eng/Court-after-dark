// lib/mongodb.js
// Handles high-performance, single reused connection to MongoDB via Mongoose.
// Includes circuit breaker for instant (<1ms) failover to in-memory/mock fallback
// when MongoDB is offline, unconfigured, or sandboxed, eliminating freeze/slow-loading.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/courtsafterdark";

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null, lastFailedAt: 0, warnedOffline: false };
}

// 25 second cooldown before attempting reconnect if MongoDB was unreachable
const CIRCUIT_BREAKER_COOLDOWN_MS = 25000;

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Fast-fail in <0.05ms if database was recently unreachable to eliminate page load lag
  if (Date.now() - cached.lastFailedAt < CIRCUIT_BREAKER_COOLDOWN_MS) {
    const offlineErr = new Error("Database offline (circuit open; using instant mock fallback)");
    offlineErr.name = "DatabaseOfflineError";
    offlineErr.isOffline = true;
    throw offlineErr;
  }

  const isRemote = MONGODB_URI.includes("+srv") || MONGODB_URI.includes("mongodb.net");
  const timeoutMs = isRemote ? 6000 : 1200;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: timeoutMs,
        connectTimeoutMS: timeoutMs,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        cached.lastFailedAt = 0;
        cached.warnedOffline = false;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.lastFailedAt = Date.now();
        cached.promise = null;
        if (!cached.warnedOffline) {
          console.warn("[Database] MongoDB connection issue:", err.message);
          cached.warnedOffline = true;
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.lastFailedAt = Date.now();
    cached.promise = null;
    throw err;
  }
}
