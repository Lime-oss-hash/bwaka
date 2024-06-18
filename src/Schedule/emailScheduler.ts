import env from "../util/validateEnv";
import nodemailer from "nodemailer";
import BookingModel from "../models/booking";

const schedule = require('node-schedule');
const config = {
  host: env.SMTP_SERVER_ADDRESS,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_LOGIN,
    pass: env.SMTP_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

async function sendEmails() {
  try {
    console.log('Start to send Email');

    const date = getFormattedDate();
    console.log('Start to send Email');

    let searchCriteria: any = {};
    searchCriteria.date = date;
    const bookings = await BookingModel.find(searchCriteria).exec();
    for (const booking of bookings) {
      const mailOptions = {
        from: env.SMTP_LOGIN,
        to: booking.email,
        subject: 'Upcoming Booking Time', // 邮件主题
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
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

  } catch (err) {
    console.error('Error occurred:', err);
  }
}


function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() 返回的月份是从 0 开始的，所以需要加 1
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function start() {
  // '10 0 0 * * *'
  schedule.scheduleJob('10 0 0 * * *', () => {
    sendEmails();
  });
}

module.exports = {start};
