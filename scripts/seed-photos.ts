import { config } from "dotenv";
config({ path: ".env.local" });
import { assignYouTubeThumbnails } from "../src/lib/photos";

async function seed() {
  console.log("Assigning YouTube thumbnails as profile photos...");
  const result = await assignYouTubeThumbnails();
  console.log(`Done! Updated ${result.updated} of ${result.total} people`);
}

seed().catch(console.error);
