//iaL2kF1B9uLr2zcu

const express = require('express');
const mongoose = require('mongoose');

const app = express();

//Middleware
app.use(express.json());




//Connect to MongoDB
mongoose.connect("mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
  app.listen(5000);
})
.catch((err) => console.log(err));