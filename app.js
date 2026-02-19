//iaL2kF1B9uLr2zcu
require("dotenv").config(); 
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require("./Routes/AuthRoutes");
const profileRoutes = require("./Routes/Profileroutes");
const app = express();

//Middleware
app.use(express.json());

app.use("/api/doctors/auth", authRoutes);
app.use("/api/doctors/profile", profileRoutes);


//Connect to MongoDB
mongoose.connect("mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
  app.listen(5000);
})
.catch((err) => console.log(err));