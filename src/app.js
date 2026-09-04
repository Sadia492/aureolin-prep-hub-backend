const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const httpStatus = require('http-status').default;
const config = require('./config/config');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// parse cookies
app.use(cookieParser());

// enable cors
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://taskflow-project-harmony.vercel.app'],	
    credentials: true,
  })
);

// root route
app.get('/', (req, res) => {
  res.send('Welcome to TaskFlow');
});

// api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
