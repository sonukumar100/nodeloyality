import dotenv from 'dotenv';
import connectDb from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

connectDb()
  .then(() => {
    app.listen(8001 || 8001, (req, res) => {
      console.log(`⚙️  Server listening on ${8001}.....`);
    });
  })
  .catch((error) => {
    console.log(`Error listening on ${8001}`, error);
  });