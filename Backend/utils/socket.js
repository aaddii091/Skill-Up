const axios = require('axios');
const socketIo = require('socket.io');
const { generateQuiz } = require('./quiz');

const rooms = {}; // Store room information
const users = {}; // Store user information
const scores = {}; // Updated to use 'scores' consistently

// Dummy data
let questions = [];
let joinedRoomId = 0;

// The original implementation is retained below for historical reference only.
// Skill Up uses the room-scoped implementation that follows.
const legacySocket = (server) => {
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

const liveRooms = new Map();
const QUESTION_DURATION_MS = 20000;

const roomUsers = (room) =>
  [...room.users.entries()].map(([id, user]) => ({ id, username: user.username }));

const roomScores = (room) =>
  roomUsers(room).map(({ id, username }) => ({
    username,
    score: room.scores.get(id) || 0,
  }));

module.exports = (server) => {
  const io = socketIo(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || true, methods: ['GET', 'POST'] },
  });

  const publishUsers = (roomCode) => {
    const room = liveRooms.get(roomCode);
    if (room) io.to(roomCode).emit('userListUpdated', roomUsers(room));
  };

  const finishQuiz = (roomCode) => {
    const room = liveRooms.get(roomCode);
    if (!room?.quiz) return;
    clearTimeout(room.quiz.timer);
    room.quiz.finished = true;
    io.to(roomCode).emit('quizEnded', { scores: roomScores(room) });
  };

  const sendQuestion = (roomCode) => {
    const room = liveRooms.get(roomCode);
    if (!room?.quiz || room.quiz.finished) return;
    const question = room.quiz.questions[room.quiz.index];
    if (!question) return finishQuiz(roomCode);

    room.quiz.answers = new Set();
    io.to(roomCode).emit('newQuestion', {
      index: room.quiz.index,
      total: room.quiz.questions.length,
      question: question.question,
      options: question.options,
      duration: QUESTION_DURATION_MS / 1000,
    });
    room.quiz.timer = setTimeout(() => {
      room.quiz.index += 1;
      sendQuestion(roomCode);
    }, QUESTION_DURATION_MS);
  };

  const advanceQuestion = (roomCode) => {
    const room = liveRooms.get(roomCode);
    if (!room?.quiz || room.quiz.finished) return;
    clearTimeout(room.quiz.timer);
    room.quiz.index += 1;
    sendQuestion(roomCode);
  };

  io.on('connection', (socket) => {
    socket.on('createRoom', ({ code, settings }) => {
      if (!code || liveRooms.has(code)) {
        return socket.emit('roomError', 'Unable to create this room. Please try another code.');
      }
      liveRooms.set(code, {
        hostId: socket.id,
        settings: {
          topic: String(settings?.topic || 'General knowledge').trim(),
          questionCount: Number(settings?.questionCount) || 5,
          rounds: Number(settings?.rounds) || 1,
        },
        users: new Map(),
        scores: new Map(),
        quiz: null,
      });
      socket.join(code);
      socket.emit('roomCreated', { code });
    });

    socket.on('joinRoom', ({ code, username }) => {
      const room = liveRooms.get(code);
      if (!room) return socket.emit('roomNotFound');
      room.users.set(socket.id, { username: String(username || 'Guest').trim() || 'Guest' });
      room.scores.set(socket.id, room.scores.get(socket.id) || 0);
      socket.join(code);
      socket.emit('roomJoined', { code, hostId: room.hostId, users: roomUsers(room), settings: room.settings });
      publishUsers(code);
    });

    socket.on('startQuiz', async ({ roomCode }) => {
      const room = liveRooms.get(roomCode);
      if (!room) return socket.emit('roomNotFound');
      if (room.hostId !== socket.id) return socket.emit('roomError', 'Only the host can start the quiz.');
      if (room.quiz && !room.quiz.finished) return socket.emit('roomError', 'This quiz is already in progress.');

      io.to(roomCode).emit('quizLoading');
      const count = Math.min(room.settings.questionCount * room.settings.rounds, 10);
      const quiz = await generateQuiz({ topic: room.settings.topic, count });
      room.scores = new Map(roomUsers(room).map(({ id }) => [id, 0]));
      room.quiz = { questions: quiz.questions, index: 0, answers: new Set(), timer: null, finished: false };
      io.to(roomCode).emit('quizStarted', { total: quiz.questions.length, source: quiz.source });
      sendQuestion(roomCode);
    });

    socket.on('submitAnswer', ({ roomCode, questionIndex, answer }) => {
      const room = liveRooms.get(roomCode);
      const quiz = room?.quiz;
      if (!room || !quiz || quiz.finished || quiz.index !== questionIndex || quiz.answers.has(socket.id)) return;

      quiz.answers.add(socket.id);
      const question = quiz.questions[quiz.index];
      const correct = question.answer === answer;
      if (correct) room.scores.set(socket.id, (room.scores.get(socket.id) || 0) + 1);
      socket.emit('answerResult', { correct, answer: question.answer, explanation: question.explanation });
      io.to(roomCode).emit('updateScores', roomScores(room));
    });

    socket.on('nextQuestion', ({ roomCode }) => {
      if (liveRooms.get(roomCode)?.hostId === socket.id) advanceQuestion(roomCode);
    });

    socket.on('disconnect', () => {
      for (const [code, room] of liveRooms.entries()) {
        if (!room.users.has(socket.id) && room.hostId !== socket.id) continue;
        room.users.delete(socket.id);
        room.scores.delete(socket.id);
        if (room.hostId === socket.id) room.hostId = room.users.keys().next().value || null;
        if (room.users.size === 0) {
          if (room.quiz?.timer) clearTimeout(room.quiz.timer);
          liveRooms.delete(code);
        } else {
          publishUsers(code);
        }
      }
    });
  });
};
