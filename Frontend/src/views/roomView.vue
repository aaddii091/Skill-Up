<template>
  <div>
    <div v-if="isLoading" class="loader"></div>
    <div v-if="isUsers" class="outer-container">
      <navbar />
      <h1>ROOMS</h1>
      <div class="user-container">
        <h3>
          Code - {{ roomCode }}
          <i @click="copyCode" class="bx bx-copy copy"></i>
        </h3>
        <div class="user-inner">
          <h1 class="user-connected">USERS CONNECTED</h1>
          <h2 class="text-center" v-for="user in connectedUsers" :key="user">
            {{ user }}
          </h2>
        </div>
        <div v-if="currentQuestion">
          <h2>{{ currentQuestion.text }}</h2>
        </div>
        <button class="button my-6" @click="startQuiz">Start</button>
      </div>
    </div>
    <div></div>
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
const roomCode = store.roomCode;
const isHost = ref(false);
isHost.value = store.isHost;

//loading state
const isUsers = ref(true);
const isLoading = ref(false);
const isQuestions = ref(false);

//Page functions
const copyCode = () => {
  navigator.clipboard.writeText(roomCode);
};

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
      // console.log(data);
      console.log(`Joined room with code: ${data.code} ${data.userList} `);
      // for (let x = 0; x < data.userList.user.length; x++) {
      //   connectedUsers.value.push(data.userList.user[x]);
      // }
      // Optionally, update UI or state to reflect that the user has joined the room
    });

    socket.on('userListUpdated', (data) => {
      console.log(data);
      connectedUsers.value = data;
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

const url = 'http://192.168.29.201:4000/api/v1/feature/createQuiz'; // Ensure the URL is correct
const bodyData = {
  topic: 'HTML',
};

const startQuiz = () => {
  isLoading.value = true;
  const response = axios.post('');
  socket.emit('startQuiz', { roomCode: store.roomCode });
};
</script>

<style scoped lang="scss">
.outer-container {
  height: 100vh;
  background-color: rgb(0, 6, 32);
}
* {
  color: white;
}
.user-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  h3 {
    font-size: 1.25rem;
  }
}
.user-inner {
  border: 1px solid rgb(255, 255, 255);
  border-radius: 10px;
  padding: 5px 20px;
  font-size: 2rem;
  h2 {
    font-size: 1.5rem;
  }
}
.button {
  padding: 7px 20px;
  background: rgb(168 208 220);
  border: 0px solid;
  color: black;
  border-radius: 10px;
  transition: all 0.25s;
}
.button:hover {
  transition: all 0.25s;
  background: rgb(61, 128, 153);
  color: rgb(255, 255, 255);
}
.user-connected {
  border-bottom: 1px solid white;
}
.copy {
  cursor: pointer;
  transition: all 0.25s;
}
.copy:active {
  transition: all 0.25s;
  filter: invert(100%);
}
</style>
