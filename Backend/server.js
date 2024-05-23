const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http'); // Import Node.js HTTP module
const socketIo = require('socket.io'); // Import Socket.IO

// Config for .env
dotenv.config({ path: './config.env' });

// CONNECTING MONGODB
mongoose
  .connect(process.env.DATABASE)
  .then((con) => {
    console.log('DB connection successful!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit with an error code
  });

const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the server
require('./utils/socket')(server);

// Start the server
server.listen(port, () => {
  console.log(`Your server is running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
