import io from 'socket.io-client';

const apiUrl = import.meta.env.VITE_SERVER_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL || new URL(apiUrl).origin;

// Socket.IO connects to the server origin, not the REST API path.
const socket = io(socketUrl);

export default socket;
