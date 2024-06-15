<template>
  <div>
    <h1>Question:</h1>
    <!-- Display the question here -->
    <input
      v-model="userResponse"
      type="text"
      placeholder="Enter your response"
    />
    <button @click="sendResponse">Send Response</button>
    <div v-for="(response, index) in responses" :key="index">
      <!-- Display responses from other users -->
      {{ response }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '../store/store';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:4000'); // Ensure this matches your server URL and port

// Reactive state
const store = useStore();
const { name } = store;
console.log(name);
const userResponse = ref('');
const responses = ref([]);

// Handle incoming responses from the server
socket.on('response', (response) => {
  responses.value.push(response);
});

// Function to send a response to the server
const sendResponse = () => {
  socket.emit('response', {
    room: 'roomName', // Ensure this matches your room logic
    response: userResponse.value,
  });
  userResponse.value = ''; // Clear the input after sending
};

// Join the room on component mount
onMounted(() => {
  socket.emit('joinRoom', 'roomName'); // Ensure this matches your room logic
});
</script>

<style>
/* Your component's styles here */
</style>
