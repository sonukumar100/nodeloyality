import { app } from './app.js';
import { createServer } from 'http';  // 👈 Add this
import { Server } from 'socket.io';   // 👈 Add this
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Create HTTP server manually
const httpServer = createServer(app); // 👈 Very important

// Create socket server on top of httpServer
export const io = new Server(httpServer, {
  cors: {
    origin: '*',  // Allow your frontend app
    methods: ['GET', 'POST', 'PUT']
  }
});

// Setup socket.io connection
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Now listen HTTP + Socket
httpServer.listen(process.env.PORT || 3306, () => {
  console.log(`⚙️  Server listening on ${process.env.PORT || 3306} with Socket.IO.....`);
});
