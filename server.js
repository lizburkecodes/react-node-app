
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/productModel');
const app = express();

app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/blog', (req, res) => {
  res.send('Hello Blog Route..');
})

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
     console.error(error.message);
    res.status(500).json({message: error.message});
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({message: `cannot find product with ID ${id}`});
    }
    res.status(200).json(product);
  } catch (error) {
     console.error(error.message);
    res.status(500).json({message: error.message});
  }
});

app.post('/product', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(200).json(product);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({message: error.message});
  }
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