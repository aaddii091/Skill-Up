<template>
  <div>
    <div v-if="isLoading" id="cover-spin"></div>
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

          <button class="button my-6" @click="startQuiz" v-if="isHost">
            Start
          </button>
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
                @click="sendAnswer(options)"
              >
                {{ options }}
                <i
                  v-if="selectedAnswer === options"
                  class="bx bx-collapse-horizontal icon"
                ></i>
              </li>
            </ul>
          </div>
          <div v-if="scores">
            <h2>Scores:</h2>
            <ul>
              <li v-for="data in scores" :key="data">
                {{ data.username }}: {{ data.score }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else>Error Starting The Quiz Try Again !</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
const currentQuestionIndex = ref(0);
const currentOptions = ref([]);
const selectedAnswer = ref('');
const scores = ref({});
const connectedUsers = ref([]);
const roomCode = computed(() => {
  return store.roomCode ? store.roomCode : getFromLocalStorage('roomCode');
});
const isHost = ref(false);
// isHost.value = store.isHost;

//loading state
const isUsers = ref(true);
const isLoading = ref(false);
const isQuestions = ref(false);

//Page functions
const copyCode = () => {
  navigator.clipboard.writeText(roomCode);
};

const sendAnswer = (option) => {
  selectedAnswer.value = option;
  // socket.emit('sendAnswer', {
  //   code: roomCode,
  //   userId: socket.id,
  //   answer: option,
  //   questionIndex: currentQuestionIndex.value,
  // });
};

socket.on('evaluateAnswer', () => {
  socket.emit('sendAnswer', {
    code: roomCode,
    userId: socket.id,
    answer: selectedAnswer.value,
    questionIndex: currentQuestionIndex.value,
  });
});

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

// Store data in localStorage
const saveToLocalStorage = (key, value) => {
  localStorage.setItem(key, value);
};

// Retrieve data from localStorage
const getFromLocalStorage = (key) => {
  return localStorage.getItem(key);
};

// Remove data from localStorage
const removeFromLocalStorage = (key) => {
  localStorage.removeItem(key);
};

// Join the room on component mount if there's a room code in the store// localstorage
onMounted(() => {
  let roomCodeLocal = getFromLocalStorage('roomCode');
  let nameLocal = getFromLocalStorage('username');

  const { roomCode, name } = store;
  if (roomCode) {
    socket.emit('joinRoom', {
      code: roomCode,
      username: name,
    });

    socket.on('roomJoined', (data) => {
      console.log(`Joined room with code: ${data.code} ${data.userList}`);
      console.log(data);
      saveToLocalStorage('roomCode', data.code);
      saveToLocalStorage('username', store.name);
      if (data.host === data.id) {
        isHost.value = true;
      }
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
  } else if (roomCodeLocal && nameLocal) {
    socket.emit('joinRoom', {
      code: roomCodeLocal,
      username: nameLocal,
    });

    socket.on('roomJoined', (data) => {
      console.log(`Joined room with code: ${data.code} ${data.userList}`);
      console.log(data);
      if (data.host === data.id) {
        isHost.value = true;
      }
    });

    socket.on('userListUpdated', (data) => {
      console.log(data);
      connectedUsers.value = data;
    });
  } else {
    Swal.fire({
      title: 'Knock Knock?',
      text: 'No one is opening the door',
      icon: 'question',
      preConfirm: () => {
        removeFromLocalStorage('roomCode');
        removeFromLocalStorage('username');
        router.push('/dashboard');
      },
    });
  }

  socket.on('newQuestion', (data) => {
    selectedAnswer.value = '';
    currentQuestion.value = data.question;
    currentOptions.value = data.options;
    currentQuestionIndex.value = data.index;
    console.log(currentOptions.value);
  });

  socket.on('updateScores', (data) => {
    console.log(data);
    scores.value = data;
  });
});

const startQuiz = () => {
  socket.emit('startQuiz', { roomCode: store.roomCode });
};
socket.on('startLoading', () => {
  isLoading.value = true;
});
socket.on('endQuiz', () => {
  alert('Quiz has ended!');
  // Perform any other actions needed after the quiz ends
});

socket.on('stopLoader', () => {
  isUsers.value = false;
  isQuestions.value = true;
  console.log(isQuestions);
  // setTimeout(() => {/
  isLoading.value = false;
  // }, 1000);
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
  border-radius: 10px;
  h2 {
    border: 1px solid white;
    border-radius: 10px 10px 0px 0px;
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
.short
</style>
