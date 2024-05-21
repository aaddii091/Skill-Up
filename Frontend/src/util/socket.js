import io from 'socket.io-client';

// Initialize the socket connection once
const socket = io('http://192.168.29.201:4000'); // Ensure this matches your server URL and port

export default socket;
