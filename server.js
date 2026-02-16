
const express = require('express');
const app = express();

// routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(3000, () => {
  console.log('node api is running on port 3000');
});