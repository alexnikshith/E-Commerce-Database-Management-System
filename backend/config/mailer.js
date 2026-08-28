const nodemailer = require('nodemailer');
require('dotenv').config();

// Currency Formatter
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Create Transport
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || 'nikshithgurram2006@gmail.com';
  const pass = process.env.SMTP_PASS || 'stfifnxxvapjbmtk';

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass
    }
  });
}

const transporter = createTransporter();

/**
 * Send Automated Order Confirmation Email
 * @param {Object} orderDetails - Order summary object
 */
const sendOrderConfirmationEmail = async (orderDetails) => {
  try {
    const { order_id, customer_name, customer_email, order_date, total_amount, items, payment_method } = orderDetails;

    if (!customer_email) return;

    const itemsRowsHtml = Array.isArray(items) ? items.map(item => `
      <tr>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#0f172a;"><strong>${item.product_name}</strong></td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569; text-align:center;">x${item.quantity}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569; text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:700; color:#0f172a; text-align:right;">${formatCurrency(item.quantity * item.unit_price)}</td>
      </tr>
    `).join('') : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin:0; padding:0; }
          .email-container { max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .email-header { background: linear-gradient(135deg, #f59e0b, #eab308); padding: 32px; text-align: center; color: #ffffff; }
          .email-body { padding: 32px; }
          .order-badge { background: #fef3c7; color: #b45309; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 12px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .email-footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1 style="margin:0; font-size:24px; font-weight:800;">E-Commerce Store</h1>
            <p style="margin:6px 0 0 0; font-size:14px; opacity:0.95;">Order Confirmation #${order_id}</p>
          </div>
          <div class="email-body">
            <span class="order-badge">✓ Order Confirmed</span>
            <h2 style="font-size:18px; font-weight:800; color:#0f172a; margin-top:0;">Hello ${customer_name},</h2>
            <p style="font-size:14px; color:#475569; line-height:1.6;">Thank you for shopping with us! Your purchase order has been successfully processed and confirmed.</p>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin:20px 0;">
              <div style="font-size:12px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Order Summary</div>
              <div style="font-size:14px; font-weight:700; color:#0f172a; margin-top:4px;">Order ID: #${order_id}</div>
              <div style="font-size:13px; color:#475569;">Date: ${new Date(order_date || Date.now()).toLocaleDateString('en-IN')}</div>
              <div style="font-size:13px; color:#475569;">Payment Method: ${payment_method || 'Standard Checkout'}</div>
            </div>

            <h3 style="font-size:14px; font-weight:700; color:#0f172a; text-transform:uppercase; margin-bottom:8px;">Purchased Items</h3>
            <table class="items-table">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; color:#475569;">Item</th>
                  <th style="padding:10px 14px; text-align:center; font-size:11px; text-transform:uppercase; color:#475569;">Qty</th>
                  <th style="padding:10px 14px; text-align:right; font-size:11px; text-transform:uppercase; color:#475569;">Unit Price</th>
                  <th style="padding:10px 14px; text-align:right; font-size:11px; text-transform:uppercase; color:#475569;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <div style="display:flex; justify-content:space-between; align-items:center; background:#fef3c7; border:1px solid rgba(245, 158, 11, 0.4); border-radius:10px; padding:14px 20px; margin-top:20px;">
              <span style="font-weight:700; color:#b45309; font-size:14px;">Total Amount Paid</span>
              <span style="font-size:20px; font-weight:800; color:#b45309;">${formatCurrency(total_amount)}</span>
            </div>
          </div>
          <div class="email-footer">
            <p style="margin:0;">Need help? Track your order at <a href="https://nicks-ecommerce-db-system.vercel.app" style="color:#b45309; font-weight:700;">E-Commerce Store Dashboard</a></p>
            <p style="margin:4px 0 0 0;">© 2026 E-Commerce DBMS System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"E-Commerce Store" <nikshithgurram2006@gmail.com>',
      to: customer_email,
      subject: `Order Confirmation #${order_id} - E-Commerce Store`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`ORDER CONFIRMATION EMAIL SENT FOR ORDER #${order_id} TO ${customer_email}`);
    return info;
  } catch (error) {
    console.warn(`EMAIL SEND WARNING FOR ORDER #${orderDetails?.order_id}:`, error.message);
    return null;
  }
};

module.exports = {
  sendOrderConfirmationEmail
};
