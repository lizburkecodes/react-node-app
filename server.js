
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/blog', (req, res) => {
  res.send('Hello Blog Route..');
})

mongoose.connect('mongodb+srv://admin:aXiLKyZEldlZYnD9@nodeprojectapi.oipumkw.mongodb.net/?appName=NodeProjectAPI')
.then(() => {
    console.log('connected to MongoDB');
    app.listen(3000, () => {
        console.log('node_api is running on port 3000');
});
}).catch((err) => {
  console.log('error connecting to MongoDB', err);
});