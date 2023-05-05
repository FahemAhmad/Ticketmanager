const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Ticket = require("../model/ticketModel");
const User = require("../model/userModel.js");

router.get("/latest-lottery", async (req, res) => {
  try {
    const latestTicket = await Ticket.findOne().sort({ lotteryNo: -1 });
    if (!latestTicket) {
      return res.status(404).json({ message: "No tickets found" });
    }
    const bookedTickets = latestTicket.bookedTickets;
    const soldTickets = latestTicket.soldTickets;

    const userIds = [
      ...new Set([
        ...bookedTickets.map((ticket) => ticket.user),
        ...soldTickets.map((ticket) => ticket.user),
      ]),
    ];
    const users = await User.find({ _id: { $in: userIds } });

    const userTickets = users.map((user) => {
      const userBookedTickets = bookedTickets.filter(
        (ticket) => ticket.user.toString() === user._id.toString()
      );
      const userSoldTickets = soldTickets.filter(
        (ticket) => ticket.user.toString() === user._id.toString()
      );
      return {
        user: {
          fullName: user.fullName,
          email: user.email,
        },
        bookedTickets: userBookedTickets,
        soldTickets: userSoldTickets,
      };
    });

    res.status(200).json(userTickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: username });
    // Check if user exists and the password is correct
    if (!user || !bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token expiration time
    });

    // Send the token and user information in the response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
