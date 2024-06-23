import env from "../util/validateEnv";
import nodemailer from "nodemailer";
import BookingModel from "../models/booking";

const schedule = require('node-schedule');

// SMTP configuration for nodemailer
const config = {
  host: env.SMTP_SERVER_ADDRESS,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_LOGIN,
    pass: env.SMTP_PASSWORD,
  },
};

// Create a nodemailer transporter with the configured SMTP settings
const transporter = nodemailer.createTransport(config);

// Function to send reminder emails to bookings scheduled within 24 hours
async function sendEmails() {
  try {
    console.log('Start to send Email');

    const date = getFormattedDate(); // Get today's date in YYYY-MM-DD format
    console.log('Start to send Email');

    let searchCriteria: any = {};
    searchCriteria.date = date;
    // Find bookings scheduled for today
    const bookings = await BookingModel.find(searchCriteria).exec();

    // Iterate through each booking and send a reminder email
    for (const booking of bookings) {
      const mailOptions = {
        from: env.SMTP_LOGIN,
        to: booking.email,
        subject: 'Upcoming Booking Time', // Email title
        text: 'This is a test email sent using book.',
        html: `
          <h2>Booking Reminder</h2>
          <p>Dear ${booking.firstName} ${booking.lastName},</p>
          <p>This is a friendly reminder that you have a booking scheduled within the next 24 hours. Here are the details of your booking:</p>
          <p><strong>Booking Details:</strong></p>
          <ul>
            <li>Date: ${booking.date}</li>
            <li>Time: ${booking.pickupTime} -- ${booking.dropoffTime}</li>
            <li>Location: ${booking.destination}</li>
          </ul>
          <p>Please ensure that you arrive at least 10 minutes before your scheduled time. If you need to reschedule or cancel your booking, please contact us as soon as possible.</p>
          <p>Thank you for choosing our services.</p>
          <p>Best regards,</p>
          <p>Waka Eastern Bay</p>
        `,
      };

      try {
        const info = await transporter.sendMail(mailOptions); // Send the email
        console.log('Email sent: ' + info.response); // Log the response after sending
      } catch (error) {
        console.error('Error sending email:', error); // Log any errors that occur during email sending
      }
    }

  } catch (err) {
    console.error('Error occurred:', err); // Log any errors that occur during the process
  }
}

// Function to get today's date in YYYY-MM-DD format
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() returns months starting from 0, hence the +1
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Function to schedule sending reminder emails daily at 10:00 AM
function start() {
  // Schedule job to run sendEmails function every day at 10:00 AM
  schedule.scheduleJob('10 0 0 * * *', () => {
    sendEmails();
  });
}

module.exports = { start }; // Export the start function to be used elsewhere
