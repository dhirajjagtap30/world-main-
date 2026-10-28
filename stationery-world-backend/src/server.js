import { app } from "./app.js";
import { PORT } from "./config.js";
import { initDb } from "./db.js";
import { seedIfEmpty } from "./seed.js";

async function main() {
  await initDb();
  await seedIfEmpty(); // no-op once real data exists — safe on every restart
  app.listen(PORT, () => {
    console.log(`Stationery World backend listening on http://localhost:${PORT}`);
    console.log(`Demo logins: RJENT01 / demo123, SUNPHARMA02 / demo123, ADMIN / admin123`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
