<template>
  <div>
    <h1>ROOMS</h1>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '../store/store';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io('http://192.168.29.201:4000'); // Ensure this matches your server URL and port

// Reactive state
const store = useStore();
const { roomCode } = store;

const userResponse = ref('');
const responses = ref([]);

// Handle incoming responses from the server
socket.on('response', (response) => {
  responses.value.push(response);
});

// Function to send a response to the server
const sendResponse = () => {
  socket.emit('response', {
    room: roomCode, // Ensure this matches your room logic
    response: userResponse.value,
  });
  userResponse.value = ''; // Clear the input after sending
};

// Join the room on component mount

onMounted(() => {
  socket.emit('joinRoom', roomCode);
});
</script>

<style>
/* Your component's styles here */
</style>
