const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');


// Corrected relative paths
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRoutes = require('./routes/friendRoutes');

// Correctly load the .env file from the parent 'server' directory
dotenv.config({ path: '../.env' });
connectDB();

const app = express();
const server = http.createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: [CLIENT_ORIGIN],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

// Simple health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// A Map to store online users: [userId, socketId]
let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user logs in, they should emit this event
  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    // Send the list of online user IDs to all clients
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });

  // A user joins a personal room for receiving private messages
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  // Handle sending a message
  socket.on('sendMessage', (message) => {
    if (message.receiver && message.receiver._id) {
      // Send the message only to the receiver's room
      io.to(message.receiver._id.toString()).emit('newMessage', message);
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ to }) => {
    let from;
    for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
            from = userId;
            break;
        }
    }
    if (from) {
        io.to(to).emit('userTyping', { from });
    }
  });

  socket.on('stopTyping', ({ to }) => {
    let from;
    for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
            from = userId;
            break;
        }
    }
    if (from) {
        io.to(to).emit('userStoppedTyping', { from });
    }
  });

  // Handle disconnection (Combined handler)
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find which user disconnected and remove them from the online list
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    // Broadcast the updated list of online users to all clients
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });
});

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const PORT = DEFAULT_PORT;
server.listen(PORT).on('listening', () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = PORT + 1;
    console.warn(`Port ${PORT} in use, retrying on ${fallbackPort}...`);
    server.listen(fallbackPort);
  } else {
    throw err;
  }
});
