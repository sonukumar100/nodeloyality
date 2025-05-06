import { app } from './app.js';
import { createServer } from 'http';  // 👈 Add this
import { Server } from 'socket.io';   // 👈 Add this
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { pool } from './db/index.js';
import { getMessagesByRoomId } from './utils/message.js';
import './cron/user-register.js';

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
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type'],
    credentials: true

  }
});
const ADMIN_ID = 1;

function getRoomIdForUser(userId) {
  return `room_user_${userId}_admin`;
}

io.on('connection', (socket) => {
  console.log('Socket connected with ID:', socket.id);
  // socket.onAny((event, ...args) => {
  //   console.log('Server received event:', event, args);
  // });
  socket.on('joinRoom', async ({ userId }) => {
    try {
      const roomId = getRoomIdForUser(userId);
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
  
      // Correct way to await the result
      const messages = await getMessagesByRoomId(roomId);
      // console.log('Previous messages fetched from DB:', messages);
  
      socket.emit('previousMessages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  
  });
  socket.on('sendMessage', async ({ senderId, receiverId, message,sendBy }) => {
    console.log('Received message:', message);
    console.log('Sender ID:', senderId);
    console.log('Receiver ID:', receiverId);

    const roomId = getRoomIdForUser(senderId == ADMIN_ID ? receiverId : senderId);

    const sqlInsert = `
      INSERT INTO messages (room_id, sender_id, receiver_id, message,send_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      await pool.execute(sqlInsert, [roomId, senderId, receiverId, message,sendBy]);

      const msg = {
        room_id:roomId,
        sender_id:senderId,
        receiver_id:receiverId,
        send_by:sendBy,
        message,
        created_at: new Date() // Simulate DB timestamp
      };

      console.log('Message saved to DB:', msg);

      // Emit only the new message to all clients in the room
      io.to(roomId).emit('receiveMessage', msg);
    } catch (err) {
      console.error('DB Error:', err);
    }
  });
  
  

  

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});





// Now listen HTTP + Socket
httpServer.listen(process.env.PORT || 3306, () => {
  console.log(`⚙️  Server listening on ${process.env.PORT || 3306} with Socket.IO.....`);
});
