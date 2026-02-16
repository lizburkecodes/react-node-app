require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const productRoute = require('./routes/productRoute');
const errorMiddleware = require('./middleware/errorMiddleware');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const FRONTEND = process.env.FRONTEND;

const corsOption = {
    origin: FRONTEND,
    optionsSuccessStatus: 200
}

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use('/api/products', productRoute);

app.get('/', (req, res) => {
  // throw new Error('This is a test error');
  res.send('Hello!');
});

app.get('/blog', (req, res) => {
  res.send('Hello Blog Route..');
})

app.use(errorMiddleware);

mongoose.connect(MONGO_URL)
.then(() => {
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`node_api is running on port ${PORT}`);
});
}).catch((err) => {
  console.log('error connecting to MongoDB', err);
});