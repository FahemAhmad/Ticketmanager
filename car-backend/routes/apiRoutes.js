const express = require("express");
const app = express();

const ticketsRoutes = require("./ticketRoute");
const usersRoutes = require("./userRoute");

app.use("/tickets", ticketsRoutes);
app.use("/users", usersRoutes);

module.exports = app;
