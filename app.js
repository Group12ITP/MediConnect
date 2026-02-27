//iaL2kF1B9uLr2zcu
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); 
const authRoutes = require("./Routes/AuthRoutes");
const profileRoutes = require("./Routes/Profileroutes");
const availabilityRoutes = require("./Routes/Availabilityroutes");
const searchRoutes = require("./Routes/Searchroutes");
const exportRoutes = require("./Routes/ExportRoutes");

const app = express();
const pharmacistRoutes = require("./Routes/Pharmacistroutes");
const patientRoutes = require("./Routes/Patientroutes");
const pharmacyRoutes = require("./Routes/Pharmacyroutes");
const inventoryRoutes = require("./Routes/Inventoryroutes");
const finderRoutes = require("./Routes/Finderroutes");
const brandRoutes = require("./Routes/Brandroutes");

//Middleware
app.use(express.json());

app.use("/api/pharmacy/auth", pharmacistRoutes);
app.use("/api/patients/auth", patientRoutes);
app.use("/api/doctors/auth", authRoutes);
app.use("/api/doctors/profile", profileRoutes);
app.use("/api/doctors/availability", availabilityRoutes);
app.use("/api/doctors/search", searchRoutes);
app.use("/api/doctors/export", exportRoutes);
app.use("/api/pharmacy/profile", pharmacyRoutes);
app.use("/api/pharmacy/inventory", inventoryRoutes);
app.use("/api/prescriptions", finderRoutes);
app.use("/api/medicines", brandRoutes);

//Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/",
  )
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => console.log(err));
