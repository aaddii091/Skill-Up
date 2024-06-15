import io from 'socket.io-client';

// Initialize the socket connection once
const socket = io(import.meta.env.VITE_SERVER_API_URL); // Ensure this matches your server URL and port

export default socket;
