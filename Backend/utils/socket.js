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

  const sendQuestion = async () => {
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
      await io.to(joinedRoomId).emit('evaluateAnswer');
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
    questionInterval = setInterval(sendQuestion, 400000); // Send subsequent questions every 4 seconds
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
        rooms[code].users.push(socket.id);
        users[socket.id] = { username, room: code };
        socket.join(code);
        // Set the first user as the host
        if (!rooms[code].host) {
          rooms[code].host = socket.id;
        }
        const userList = rooms[code].users.map((id) => users[id]?.username);
        socket.emit('roomJoined', {
          code: code,
          userList: userList,
          host: rooms[code].host,
          id: socket.id,
        }); // Emit room code to client
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
          scores[code][userId] = {
            username: users[userId].username
              ? users[userId].username
              : 'Not Known',
            score: 0,
          };
        }
        scores[code][userId].score += 1; // Increment score
        score = scores[code][userId];
        console.log(scores[code]);
        console.log(scores[code][userId]);
      }
      // /  let username = users[userId].username;
      // let deliverables = { username: username, score: score };
      // Emit updated scores to all clients in the room
      console.log(scores[code]);
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
