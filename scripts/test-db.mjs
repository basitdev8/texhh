// Quick connectivity check against MONGODB_URI in .env.local
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("No MONGODB_URI");
  process.exit(1);
}
console.log("Connecting...");
console.time("connect");
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.timeEnd("connect");
  const dbName = mongoose.connection.name;
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log(`OK — db=${dbName}, collections=[${cols.map((c) => c.name).join(", ")}]`);
  await mongoose.disconnect();
  process.exit(0);
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
