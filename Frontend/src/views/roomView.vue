<template>
  <div>
    <div class="outer-container">
      <navbar />
      <h1>ROOMS</h1>
      <div class="user-container">
        <div class="user-inner">
          <h1>USERS CONNECTED</h1>
          <h2 v-for="user in connectedUsers" :key="user">{{ user }}</h2>
          <div v-if="currentQuestion">
            <h2>{{ currentQuestion.text }}</h2>
          </div>
          <button @click="startQuiz">click me</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '../store/store';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import navbar from '../components/navbarView.vue';

// socket
import socket from '../util/socket';

// intializing Router
const router = useRouter();

// Reactive state
const store = useStore();

// intializing variables
const currentQuestion = ref(null);
const selectedAnswer = ref('');
const scores = ref({});
const connectedUsers = ref(['qwerty', 'asdfg', 'assdd']);

socket.on('roomCreated', (code) => {
  console.log(`Room created with code: ${code}`);
});
socket.emit('response', {
  room: store.roomCode,
  response: 'Aditya',
});
socket.on('response', (data) => {
  console.log(data);
});

// Join the room on component mount if there's a room code in the store
onMounted(() => {
  const { roomCode, name } = store;
  if (roomCode) {
    socket.emit('joinRoom', {
      code: roomCode,
      username: name,
    });

    socket.on('roomJoined', (data) => {
      console.log(`Joined room with code: ${data.code} ${data.userList} `);
      connectedUsers.value.push(data.userList);
      // Optionally, update UI or state to reflect that the user has joined the room
    });

    socket.on('roomNotFound', () => {
      console.error('Room not found');
      Swal.fire({
        title: 'Knock Knock?',
        text: 'No one is opening the door',
        icon: 'question',
        preConfirm: () => {
          router.push('/dashboard');
        },
      });
    });
  } else {
    Swal.fire({
      title: 'Knock Knock?',
      text: 'No one is opening the door',
      icon: 'question',
      preConfirm: () => {
        router.push('/dashboard');
      },
    });
  }
  socket.on('newQuestion', (question) => {
    currentQuestion.value = question;
  });

  socket.on('updateScores', (updatedScores) => {
    scores.value = updatedScores;
  });

  socket.on('quizEnd', (data) => {
    // Handle end of quiz, display final scores, etc.
    alert('Quiz ended! Final scores: ' + JSON.stringify(data.scores));
  });
});

const startQuiz = () => {
  socket.emit('startQuiz', store.roomCode);
};
</script>

<style scoped>
.outer-container {
  height: 100vh;
  background-color: rgb(0, 6, 32);
}
* {
  color: white;
}
.user-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
</style>
