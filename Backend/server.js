// IMPORTS

const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

//config for .env

dotenv.config({ path: './config.env' });

// CONNECTING MONGODB

mongoose
  .connect(process.env.DATABASE)
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successful!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit with an error code
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Your server is running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
