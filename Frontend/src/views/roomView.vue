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

// intializing Router
const router = useRouter();

// Reactive state
const store = useStore();
const socket = io('http://192.168.29.201:4000'); // Ensure this matches your server URL and port

socket.on('roomCreated', (code) => {
  console.log(`Room created with code: ${code}`);
});

socket.on('response', (data) => {
  console.log(data);
});

// Join the room on component mount if there's a room code in the store
onMounted(() => {
  const { roomCode } = store;
  if (roomCode) {
    socket.emit('joinRoom', roomCode);

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
