<template>
  <div>
    <div class="container-outer">
      <div>
        <navbar-view />
      </div>
      <div class="container-inner">
        <div @click="joinRoom" class="room-container">Join Room</div>
        <div @click="hostRoom" class="room-container">Host Room</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import navbarView from '../components/navbarView.vue';
import { useStore } from '../store/store';
import randomCode from '../util/randomCode';
import socket from '../util/socket';

// intializing router
const router = useRouter();

// intializing store
const store = useStore();

// socket

const joinRoom = () => {
  store.isHost = false;

  Swal.fire({
    title: 'Enter Room Code',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'on',
    },
    showCancelButton: true,
    confirmButtonText: 'Join',
    showLoaderOnConfirm: true,
    preConfirm: async (login) => {},
    allowOutsideClick: () => !Swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
      const roomCode = result.value;
      store.updateRoomCode(roomCode);
      console.log(roomCode);
      router.push('/room');
      // Swal.fire({
      //   title: `Room Not Found`,
      //   imageUrl: result.value.avatar_url,
      // });
    }
  });
};

const hostRoom = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Create Room',
    html: `<div style="display:flex; flex-direction: column;">
      <select id="swal-input2" class="input-custom my-1">
        <option value="" disabled selected>No of Questions</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <select id="swal-input3" class="input-custom my-1">
        <option value="" disabled selected>No of Rounds</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
    </div>`,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const noOfQuestions = document.getElementById('swal-input2').value;
      const noOfRounds = document.getElementById('swal-input3').value;

      if (!noOfQuestions || !noOfRounds) {
        Swal.showValidationMessage('Please fill out all fields');
        return false; // Returning false prevents the dialog from closing
      }

      return { noOfQuestions, noOfRounds };
    },
  });

  if (formValues) {
    const { noOfQuestions, noOfRounds } = formValues;
    const generatedCode = await randomCode();
    store.numberOfQuestions(noOfQuestions);
    store.updateRoomCode(generatedCode);
    store.numberOfRounds(noOfRounds);
    socket.emit('createRoom', store.roomCode);
    store.isHost = true;

    router.push('/room');
  }
};
</script>

<style scoped>
.container-outer {
  height: 100vh;
  background-color: rgb(0, 6, 32);
}
.container-inner {
  display: flex;
  flex-wrap: wrap;
  margin: auto;
  justify-content: center;
  align-items: center;
  height: 90%;
}
.room-container {
  color: rgb(0, 0, 0);
  font-size: 20px;
  margin: 20px;
  padding: 50px 75px;
  border: 1px solid black;
  border-radius: 10px;
  background-color: rgb(158, 210, 255);
  cursor: pointer;
  transition: all 0.4s;
}
.room-container:hover {
  transition: all 0.4s;
  transform: scale(1.02);
  box-shadow: rgba(255, 255, 255, 0.25) 0px 13px 27px -5px,
    rgba(255, 255, 255, 0.3) 0px 8px 16px -8px;
}
select {
  padding: 0.5em 3.5em 0.5em 1em;
}
</style>
