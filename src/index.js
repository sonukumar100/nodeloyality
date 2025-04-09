import connectDb from './db/index.js';
import { app } from './app.js';
// dotenv.config()
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, '.env') });




connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8001, (req, res) => {
      console.log(`⚙️  Server listening on ${process.env.PORT}.....`);
    });
  })
  .catch((error) => {
    console.log(`Error listening on ${process.env.PORT}`, error);
  });