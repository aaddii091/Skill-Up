const socketIo = require('socket.io');

const rooms = {}; // Store room information
const users = {}; // Store user information

// Dummy data
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

function startQuiz(io, roomId) {
  let questionIndex = 0;

  const questionInterval = setInterval(() => {
    if (questionIndex < questions.length) {
      io.to(roomId).emit('newQuestion', questions[questionIndex]);
      questionIndex++;
    } else {
      clearInterval(questionInterval);
      io.to(roomId).emit('quizEnd', { scores: scores[roomId] });
    }
  }, 10000); // Send a new question every 10 seconds
}

module.exports = (server) => {
  const io = socketIo(server);

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
        users[socket.id] = { username, room: code };
        socket.join(code); // Join the room
        const userList = rooms[code].users.map((id) => users[id]?.username);
        socket.emit('roomJoined', { code: code, userList: userList }); // Emit room code to client
        io.to(code).emit('userListUpdated', userList); // Update user list for all clients in the room
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

    socket.on('startQuiz', (code) => {
      // This will run the quiz
      startQuiz(io, code);
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
      io.to(code).emit('updateScores', scores[code]);
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
        const { username, room } = user;
        const roomData = rooms[room];
        if (roomData) {
          roomData.users = roomData.users.filter((id) => id !== socket.id);
          const userList = roomData.users.map((id) => users[id]?.username);
          io.to(room).emit('userListUpdated', userList); // Update user list for all clients in the room
        }
        delete users[socket.id];
        console.log(`User: ${username} (ID: ${socket.id}) disconnected`);
      } else {
        console.log('User disconnected', socket.id);
      }
    });
  });
};
