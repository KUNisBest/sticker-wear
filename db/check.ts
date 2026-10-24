import { getDb } from "../api/queries/connection";

async function main() {
  const db = getDb();
  const result = await db.execute(`SHOW TABLES`);
  console.log("Tables:", result);
}

main().catch(console.error);
