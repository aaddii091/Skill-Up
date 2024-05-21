<template>
  <div>
    <h1>ROOMS</h1>
    <div>
      <h1>USERS CONNECTED</h1>
      <h2></h2>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '../store/store';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

// socket
import socket from '../util/socket';

// intializing Router
const router = useRouter();

// Reactive state
const store = useStore();

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
  const { roomCode } = store;
  if (roomCode) {
    socket.emit('joinRoom', {
      code: roomCode,
      username: 'Adityas',
    });

    socket.on('roomJoined', (roomCode) => {
      console.log(`Joined room with code: ${roomCode}`);
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
});
</script>

<style>
/* Your component's styles here */
</style>
