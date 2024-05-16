const express = require('express');
const userRoutes = require('./routes/userRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const bodyParser = require('body-parser');

const app = express();

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use('/api/v1/users', userRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
