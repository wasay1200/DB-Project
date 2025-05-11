const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send reservation confirmation email
const sendReservationConfirmation = async (reservationDetails) => {
    const {
        name,
        email,
        reservation_date,
        time_slot,
        table_id,
        table_capacity,
        reservation_id
    } = reservationDetails;

    // Format the date and time
    const formattedDate = new Date(reservation_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formattedTime = new Date(`2000-01-01T${time_slot}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reservation Confirmation - Ash Roots Cafe',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #b22222; text-align: center;">Reservation Confirmation</h2>
                <p>Dear ${name},</p>
                <p>Thank you for choosing Ash Roots Cafe! Your reservation has been confirmed.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Reservation Details:</h3>
                    <p><strong>Reservation ID:</strong> ${reservation_id}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <p><strong>Table:</strong> ${table_id} (Seats ${table_capacity})</p>
                </div>

                <p>Please arrive 5-10 minutes before your reservation time. If you need to make any changes or cancel your reservation, please contact us at least 24 hours in advance.</p>
                
                <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                    <p>Ash Roots Cafe<br>
                    123 Restaurant Street<br>
                    City, State 12345<br>
                    Phone: (123) 456-7890</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Reservation confirmation email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending reservation confirmation email:', error);
        throw error;
    }
};

module.exports = {
    sendReservationConfirmation
}; 