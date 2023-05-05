const mongoose = require("mongoose");

const bookedTicketSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ticketNumbers: [String],
  lotteryNo: {
    type: Number,
    required: true,
  },
});

const lotterySchema = mongoose.Schema({
  lotteryNo: {
    type: Number,
    required: true,
    unique: true,
  },
  availableTickets: [
    {
      type: String,
      required: true,
    },
  ],
  soldTickets: [bookedTicketSchema],
  bookedTickets: [bookedTicketSchema],
});

const Lottery = mongoose.model("Lottery", lotterySchema);

module.exports = Lottery;
