const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const featureRoutes = require('./routes/featureRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/feature', featureRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
