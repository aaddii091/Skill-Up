const axios = require('axios');
const socketIo = require('socket.io');

const rooms = {}; // Store room information
const users = {}; // Store user information
const scores = {}; // Updated to use 'scores' consistently

// Dummy data
let questions = [];
let joinedRoomId = 0;

module.exports = (server) => {
  const io = socketIo(server);

  let questionIndex = 0;
  let questionInterval;
  const maxQuestions = 5; // Maximum number of questions to send

  const sendQuestion = () => {
    if (questionIndex < questions.questions.length) {
      io.to(joinedRoomId).emit('evaluateAnswer');
      currentPostedQuestionIndex = questionIndex;
      io.to(joinedRoomId).emit('newQuestion', {
        question: questions.questions[questionIndex].question,
        options: questions.questions[questionIndex].options,
        index: questionIndex,
      });
      questionIndex++;
    } else {
      io.to(joinedRoomId).emit('evaluateAnswer');
      clearInterval(questionInterval); // Stop sending questions when done
      io.to(joinedRoomId).emit('endQuiz'); // Emit an event to indicate the quiz has ended
    }
  };

  async function startQuiz(roomId) {
    io.to(roomId).emit('startLoading');
    joinedRoomId = roomId;

    const url = 'http://192.168.29.201:4000/api/v1/feature/createQuiz'; // Ensure the URL is correct
    const bodyData = {
      topic: 'HTML',
    };
    console.log('api running');
    const response = await axios.post(url, bodyData);
    questions = JSON.parse(response.data.quiz);
    console.log(questions.questions[0].question);

    // Stop loader
    io.to(roomId).emit('stopLoader');
    questionIndex = 0; // Reset question index
    sendQuestion(); // Send the first question immediately
    questionInterval = setInterval(sendQuestion, 4000); // Send subsequent questions every 4 seconds
  }

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

    socket.on('startQuiz', (data) => {
      // This will run the quiz
      startQuiz(data.roomCode);
    });

    socket.on('sendAnswer', (data) => {
      const { code, userId, answer, questionIndex } = data;
      let score = 0;
      // Validate the answer
      if (questions.questions[questionIndex].answer === answer) {
        if (!scores[code]) {
          scores[code] = {};
        }
        if (!scores[code][userId]) {
          scores[code][userId] = 0;
        }
        scores[code][userId] += 1; // Increment score
        score = scores[code][userId];
      }
      username = users[userId].username;
      // Emit updated scores to all clients in the room
      deliverables = { username: score };
      io.to(code).emit('updateScores', deliverables);
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
