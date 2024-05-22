const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http'); // Import Node.js HTTP module
const socketIo = require('socket.io'); // Import Socket.IO

// Config for .env
dotenv.config({ path: './config.env' });

// CONNECTING MONGODB
mongoose
  .connect(process.env.DATABASE)
  .then((con) => {
    console.log('DB connection successful!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit with an error code
  });

const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = socketIo(server);

const rooms = {}; // Store room information
const users = {}; // Store user information

// dummy data
const questions = [
  {
    text: 'Question 1',
    options: ['Option A', 'Option B', 'Option C'],
    correctAnswer: 'Option A',
  },
  {
    text: 'Question 2',
    options: ['Option A', 'Option B', 'Option C'],
    correctAnswer: 'Option B',
  },
  // More questions...
];

const scores = {};

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  socket.on('createRoom', (code) => {
    rooms[code] = { users: [] };
    socket.join(code);
    socket.emit('roomCreated', code);
    console.log('Room is created at', code);
  });

  socket.on('joinRoom', ({ code, username }) => {
    if (rooms[code]) {
      rooms[code].users.push(socket.id); // Add user to room
      users[socket.id] = { username, room: code }; // Store user information
      socket.join(code); // Join the room
      socket.emit('roomJoined', code); // Emit room code to client
      console.log(
        `User: ${username} (ID: ${socket.id}) joined room with code: ${code}`
      );
    } else {
      socket.emit('roomNotFound');
      console.log(
        `User: ${socket.id} tried to join non-existent room with code: ${code}`
      );
    }
  });

  socket.on('sendAnswer', (data) => {
    const { code, userId, answer, questionIndex } = data;

    // Validate the answer
    if (questions[questionIndex].correctAnswer === answer) {
      if (!scores[code]) {
        scores[code] = {};
      }
      if (!scores[code][userId]) {
        scores[code][userId] = 0;
      }
      scores[code][userId] += 1; // Increment score
    }

    // Emit updated scores to all clients in the room
    io.to(roomId).emit('updateScores', scores[roomId]);
  });

  socket.on('response', (data) => {
    const user = users[socket.id];
    if (user && user.room === data.room) {
      io.to(data.room).emit('response', {
        username: user.username,
        response: data.response,
      });
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const room = rooms[user.room];
      if (room) {
        room.users = room.users.filter((id) => id !== socket.id);
      }
      delete users[socket.id];
      console.log(`User: ${user.username} (ID: ${socket.id}) disconnected`);
    } else {
      console.log('User disconnected', socket.id);
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Your server is running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
