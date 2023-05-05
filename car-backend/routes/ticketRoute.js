const express = require("express");
const router = express.Router();
const { sendEmail } = require("../services/emailService.js");

const Ticket = require("../model/ticketModel");
const User = require("../model/userModel.js");

router.get("/unsold-tickets", async (req, res) => {
  try {
    const latestLottery = await Ticket.findOne({}, { _id: 0 })
      .sort({ lotteryNo: -1 })
      .lean()
      .exec();

    res.status(200).json({
      lotteryNo: latestLottery.lotteryNo,
      availableTickets: latestLottery.availableTickets,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//update the ticket

router.patch("/sell-tickets/:lotteryNo", async (req, res) => {
  const { lotteryNo } = req.params;
  const { ticketNumbers, userInformation } = req.body;

  try {
    let user = await User.findOne({ email: userInformation.email });
    if (!user) {
      // Create a new user if not found
      user = new User(userInformation);
      await user.save();
    } else {
      // Update user information if found
      Object.assign(user, userInformation);
      await user.save();
    }

    const lottery = await Ticket.findOne({ lotteryNo });
    if (!lottery) {
      return res.status(404).json({ message: "Lottery not found" });
    }

    const updatedAvailableTickets = lottery.availableTickets.filter(
      (ticketNumber) => !ticketNumbers.includes(ticketNumber)
    );

    let booked = lottery.bookedTickets.find(
      (booking) =>
        booking.user.toString() === user._id.toString() &&
        booking.lotteryNo == lotteryNo
    );

    if (booked) {
      let tticketNumbers = [...booked.ticketNumbers, ...ticketNumbers];
      const index = lottery.bookedTickets.indexOf(booked);

      await Ticket.updateOne(
        { _id: lottery._id },
        {
          $set: {
            availableTickets: updatedAvailableTickets,
            [`bookedTickets.${index}.ticketNumbers`]: tticketNumbers,
          },
        }
      );
    } else {
      booked = {
        user: user._id,
        ticketNumbers,
        lotteryNo,
      };

      await Ticket.updateOne(
        { _id: lottery._id },
        {
          $set: {
            availableTickets: updatedAvailableTickets,
          },
          $push: {
            bookedTickets: {
              user: user._id,
              ticketNumbers,
              lotteryNo,
            },
          },
        }
      );
    }

    const emailSubject = `Lottery tickets purchase confirmation for ${userInformation.email}`;
    const emailBody = `Dear ${
      userInformation.fullName
    }, \n\nThank you for purchasing the following lottery tickets: ${ticketNumbers.join(
      ", "
    )}.\n\nRegards,\nThe Lottery Team`;

    await sendEmail(userInformation.email, emailSubject, emailBody);

    res.status(200).json({
      message: `Successfully sold tickets for lottery ${lotteryNo}`,
      updatedAvailableTickets,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//create tickets in bulk
router.post("/create-lottery", async (req, res) => {
  const { totalTickets } = req.body;
  const count = parseInt(totalTickets, 10);

  try {
    // Get the latest lottery number
    const latestLottery = await Ticket.findOne({}, { _id: 0, lotteryNo: 1 })
      .sort({ lotteryNo: -1 })
      .lean()
      .exec();
    const lotteryNo = latestLottery ? latestLottery.lotteryNo + 1 : 1;

    // Generate an array of available ticket numbers
    const availableTickets = Array(count)
      .fill()
      .map((_, index) => String(index + 1).padStart(String(count).length, "0"));

    // Create the new lottery object
    const newLottery = new Ticket({
      lotteryNo,
      availableTickets,
      soldTickets: [],
      bookedTickets: [],
    });

    // Save the new lottery object to the database
    await newLottery.save();

    res.status(201).json({
      message: `Successfully created lottery ${lotteryNo}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.findOne({}, { _id: 0 })
      .sort({ lotteryNo: -1 })
      .populate({
        path: "bookedTickets.user",
        model: "User",
        select: "fullName email",
      });

    if (!tickets) {
      return res.status(404).json({ message: "No tickets found" });
    }

    const availableTickets = tickets.availableTickets.map((ticketNumber) => {
      return {
        lotteryNo: tickets.lotteryNo,
        ticketNumber,
        availability: true,
        sold: false,
      };
    });

    const bookedTickets = tickets.bookedTickets.flatMap((booking) => {
      return booking.ticketNumbers.map((ticketNumber) => {
        return {
          lotteryNo: booking.lotteryNo,
          ticketNumber,
          user: booking.user
            ? `${booking.user.fullName} (${booking.user.email})`
            : null,
          availability: false,
          sold: false,
        };
      });
    });
    const soldTickets = tickets.soldTickets.flatMap((sold) => {
      return sold.ticketNumbers.map((ticketNumber) => {
        return {
          lotteryNo: sold.lotteryNo,
          ticketNumber,
          user: sold.user ? `${sold.user.fullName} (${sold.user.email})` : null,
          availability: false,
          sold: true,
        };
      });
    });

    const bookedCount = bookedTickets.length;
    const soldCount = soldTickets.length;

    res.status(200).json({
      tickets: [...bookedTickets, ...availableTickets, ...soldTickets],
      bookedCount,
      soldCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
