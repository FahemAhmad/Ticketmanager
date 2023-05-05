require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const port = process.env.PORT;

//middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"],
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true,
  })
);

//mongo db connection
const connectDB = require("./config/db");
connectDB();

app.get("/", async (req, res) => {
  res.json({
    message: "Api Running",
  });
});

const apiRoutes = require("./routes/apiRoutes");
const User = require("./model/userModel");
app.use("/api", apiRoutes);

//middleware to show error in console
app.use((error, req, res, next) => {
  console.error(error);
  next(error);
});

//middleware to return error in our format
app.use((error, req, res, next) => {
  res.status(500).json({
    message: error.message,
    stack: error.stack,
  });
});

// const adminUser = new User({
//   fullName: "Sorteos MG",
//   phoneNumber: "0000000000",
//   state: "Jalisco",
//   city: "Guadalajara",
//   email: "sorteosmg1@gmail.com",
//   password: bcrypt.hashSync("Sorteos-mg24.", 10),
//   isAdmin: true,
// });

// adminUser
//   .save()
//   .then((savedUser) => {
//     console.log("User saved successfully:", savedUser);
//   })
//   .catch((err) => {
//     console.error("Error saving user:", err);
//   });

app.listen(port, () => {
  console.log("Server is listening on port", port);
});
