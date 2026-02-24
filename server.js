if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// routes 
const productRoute = require('./routes/productRoute');
const storeRoute = require('./routes/storeRoute');
const searchRoute = require('./routes/searchRoute');
const authRoute = require('./routes/authRoute');

const errorMiddleware = require('./middleware/errorMiddleware');
const { csrfErrorHandler } = require('./middleware/csrfMiddleware');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const FRONTEND = process.env.FRONTEND;

const corsOption = {
    origin: FRONTEND,
    optionsSuccessStatus: 200,
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Parse cookies

// routes
app.use('/api/products', productRoute);
app.use('/api/stores', storeRoute);
app.use('/api/search', searchRoute);
app.use('/api/auth', authRoute);
app.use('/api/images', require('./routes/imageRoute'));

app.get('/', (req, res) => {
  // throw new Error('This is a test error');
  res.send('Hello!');
});

app.get('/blog', (req, res) => {
  res.send('Hello Blog Route..');
})

// CSRF error handler (must be before general error middleware)
app.use(csrfErrorHandler);

app.use(errorMiddleware);

mongoose.connect(MONGO_URL, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
})
.then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`node_api is running on port ${PORT}`);
});
}).catch((err) => {
  console.log('error connecting to MongoDB', err);
});