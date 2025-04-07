// const nodemailer = require("nodemailer");
import nodemailer from "nodemailer";
 const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sk.kumar78408@gmail.com",
      pass: "udjddxeajnwiqrcl",
    },
  });
  
  // async..await is not allowed in global scope, must use a wrapper
 export  async function sendEmail(email, otp) {
      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: '"Sonu Kumar 👻" <sk.kumar78408@gmail.com>', // sender address
        to: 'sonu.k@appening.xyz', // send to the dynamic email provided
        subject: 'Welcome to Our Platform!',
        text: `Hello ${otp},
    
    Welcome to our platform! We’re glad to have you here.
    Best Regards,
    Your Company`,
        html: `<p>Hello ${otp},</p>
               <p>Welcome to our platform! We’re glad to have you here.</p>
               <p>Best Regards,</p>
               <p>Your Company</p>`,
      });
    
      console.log("Message sent: %s", info.messageId);
    }