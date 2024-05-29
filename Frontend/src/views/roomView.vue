<template>
  <div>
    <span v-if="isLoading" class="loader"></span>
    <div class="outer-container">
      <navbar />
      <div v-if="isUsers">
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

          <button class="button my-6" @click="startQuiz">Start</button>
        </div>
      </div>
      <div v-if="isQuestions">
        <div v-if="currentQuestion">
          <div class="options">
            <h2>
              <i class="bx bx-right-arrow-alt icon"></i>{{ currentQuestion }}
            </h2>
            <ul>
              <li
                v-for="options in currentOptions"
                :key="options"
                class="option"
                @click="toggleSelection(options)"
              >
                {{ options }}
                <i
                  v-if="selectedAnswer === options"
                  class="bx bx-collapse-horizontal icon"
                ></i>
              </li>
            </ul>
          </div>
        </div>
        <div v-else>Error Starting The Quiz :sweat_smile: Try Again !</div>
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
const currentOptions = ref([]);
const selectedAnswer = ref('');
const selectedOption = ref('');
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

const toggleSelection = (option) => {
  selectedAnswer.value = selectedAnswer.value === option ? null : option;
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
  socket.on('newQuestion', (data) => {
    currentQuestion.value = data.question;
    currentOptions.value = data.options;
    console.log(currentOptions.value);
  });

  socket.on('updateScores', (updatedScores) => {
    scores.value = updatedScores;
  });

  socket.on('quizEnd', (data) => {
    // Handle end of quiz, display final scores, etc.
  });
});

const url = 'http://192.168.29.201:4000/api/v1/feature/createQuiz'; // Ensure the URL is correct
const bodyData = {
  topic: 'HTML',
};

const startQuiz = () => {
  isLoading.value = true;
  // const response = axios.post('');
  socket.emit('startQuiz', { roomCode: store.roomCode });
};

socket.on('stopLoader', () => {
  isUsers.value = false;
  isQuestions.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
});
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
.options {
  border: 1px solid white;
  h2 {
    border: 1px solid white;
    padding: 10px 0.25rem;
    display: flex;
    align-items: center;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    li {
      padding: 20px 10px;
      margin: 20px 5px;
      width: 45vw;
      border: 1px solid white;
      display: flex;
      justify-content: space-between;
    }
    li:hover {
      background-color: rgb(172, 255, 215);
      color: black;
      cursor: pointer;
      transition: box-shadow 200ms ease, transform 200ms ease;
      transform: translate(2px, -2px);
      box-shadow: -4px 4px 0 rgb(54, 201, 0);
    }
    li:active {
    }
  }
}
.icon {
  margin: 0.1rem 10px;
}
</style>
