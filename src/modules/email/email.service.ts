import nodemailer from 'nodemailer';

const hasEmailConfig = 
  process.env.SMTP_HOST && 
  process.env.SMTP_PORT && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (hasEmailConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // True for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('✉️ Mail Dispatcher initialized successfully');
} else {
  console.log('📬 SMTP configurations unseeded. Falling back to localized console mock logs');
}

export interface BookingReceiptParams {
  name: string;
  email: string;
  carInterest: string;
  dateTime: string | Date;
  notes?: string;
}

export const sendBookingReceipt = async (params: BookingReceiptParams) => {
  const formattedDate = new Date(params.dateTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const luxuryHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>UltraDrive Concierge Confirmation</title>
      <style>
        body {
          background-color: #050505;
          color: #e5e5e7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0b0b0b;
          border: 1px solid #141414;
          border-radius: 12px;
          padding: 3rem 2rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        .header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .brand-logo {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 5px;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }
        .brand-accent {
          color: #ff3e3e;
        }
        .title {
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #a1a1aa;
          margin-top: 0;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #ff3e3e, transparent);
          margin: 2rem 0;
        }
        .lead {
          font-size: 1.15rem;
          color: #ffffff;
          line-height: 1.6;
        }
        .meta-grid {
          background-color: #111111;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #1c1c1c;
        }
        .meta-row:last-child {
          border-bottom: none;
        }
        .meta-label {
          color: #71717a;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta-value {
          color: #ff3e3e;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .meta-value-plain {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .footer {
          text-align: center;
          font-size: 0.75rem;
          color: #52525b;
          letter-spacing: 1px;
          margin-top: 3rem;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand-logo">ULTRA<span class="brand-accent">DRIVE</span></div>
          <div class="title">VIP Concierge Service</div>
        </div>
        
        <p class="lead">Dear <strong>${params.name}</strong>,</p>
        <p>Thank you for expressing interest in the UltraDrive hypercar stable. We are delighted to confirm that your VIP Private Showroom viewing reservation has been received and scheduled successfully.</p>
        
        <div class="meta-grid">
          <div class="meta-row">
            <span class="meta-label">Client Name</span>
            <span class="meta-value-plain">${params.name}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Selected Model</span>
            <span class="meta-value">${params.carInterest}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Scheduled Date</span>
            <span class="meta-value-plain">${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Notes</span>
            <span class="meta-value-plain">${params.notes || 'None'}</span>
          </div>
        </div>
        
        <p>An UltraDrive brand consultant will contact you shortly to review safety protocols, credentials inspection, and track conditions if track testing has been requested.</p>
        
        <div class="divider"></div>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} ULTRA DRIVE. ALL RIGHTS RESERVED.<br>
          CONFIDENTIAL AUTOMOTIVE CONCIERGE OPERATING GLOBALLY.
        </div>
      </div>
    </body>
    </html>
  `;

  if (hasEmailConfig && transporter) {
    try {
      await transporter.sendMail({
        from: `"UltraDrive Concierge" <${process.env.SMTP_USER}>`,
        to: params.email,
        subject: `🔒 VIP Concierge Confirmation: Showroom Appointment for ${params.carInterest}`,
        html: luxuryHtml,
      });
      console.log(`✉️ Successful luxury confirmation email dispatched to client: ${params.email}`);
      return true;
    } catch (err) {
      console.error('SMTP dispatcher failed to deliver email:', (err as Error).message);
      return false;
    }
  } else {
    // Elegant fallback simulation printout
    console.log('\n=============================================================');
    console.log('📢 SIMULATED SMTP DISPATCH: CONCIERGE CONFIRMATION');
    console.log(`To: ${params.email}`);
    console.log(`Subject: 🔒 VIP Concierge Confirmation: ${params.carInterest}`);
    console.log(`Client: ${params.name}`);
    console.log(`Scheduled: ${formattedDate}`);
    console.log('=============================================================\n');
    return true;
  }
};

export interface NewLeadAlertParams {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}

export const sendNewLeadAlert = async (params: NewLeadAlertParams) => {
  const alertHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New CRM Lead Registered</title>
      <style>
        body { background-color: #050505; color: #e5e5e7; font-family: sans-serif; padding: 20px; }
        .card { background-color: #0b0b0b; border: 1px solid #1a1a1a; border-radius: 8px; padding: 2rem; max-width: 600px; margin: 0 auto; }
        .header { border-bottom: 2px solid #ff3e3e; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 1.25rem; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
        .field { margin-bottom: 15px; }
        .label { font-size: 0.75rem; color: #71717a; text-transform: uppercase; font-weight: bold; }
        .value { font-size: 0.95rem; color: #ffffff; margin-top: 4px; }
        .value.message { font-style: italic; color: #d4d4d8; background: #111; padding: 10px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🔥 New Dealership Lead Registered</h1>
        </div>
        <div class="field">
          <div class="label">Client Name</div>
          <div class="value">${params.name}</div>
        </div>
        <div class="field">
          <div class="label">Contact Email</div>
          <div class="value">${params.email}</div>
        </div>
        <div class="field">
          <div class="label">Contact Phone</div>
          <div class="value">${params.phone || 'Not Provided'}</div>
        </div>
        <div class="field">
          <div class="label">Inquiry Source</div>
          <div class="value">${params.source || 'SHOWROOM WALKIN'}</div>
        </div>
        ${params.message ? `
        <div class="field">
          <div class="label">Client Message</div>
          <div class="value message">"${params.message}"</div>
        </div>` : ''}
      </div>
    </body>
    </html>
  `;

  if (hasEmailConfig && transporter) {
    try {
      await transporter.sendMail({
        from: `"UltraDrive CRM" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: `🔥 New UltraDrive Lead: ${params.name}`,
        html: alertHtml,
      });
      return true;
    } catch (err) {
      console.error('SMTP lead alert failed:', (err as Error).message);
      return false;
    }
  } else {
    console.log('\n=============================================================');
    console.log('📢 SIMULATED SMTP DISPATCH: NEW CRM LEAD NOTIFICATION');
    console.log(`To Dealer: [ADMIN-BOX]`);
    console.log(`Subject: 🔥 New Lead: ${params.name}`);
    console.log(`Contact: ${params.email} | ${params.phone || 'N/A'}`);
    console.log(`Source: ${params.source || 'N/A'}`);
    if (params.message) console.log(`Inquiry: "${params.message}"`);
    console.log('=============================================================\n');
    return true;
  }
};

export interface BookingConfirmedParams {
  name: string;
  email: string;
  carInterest: string;
  dateTime: string | Date;
}

export const sendBookingConfirmedAlert = async (params: BookingConfirmedParams) => {
  const formattedDate = new Date(params.dateTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const confirmHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VIP Viewing Confirmed</title>
      <style>
        body { background-color: #050505; color: #e5e5e7; font-family: sans-serif; padding: 20px; }
        .card { background-color: #0b0b0b; border: 1px solid #1a1a1a; border-radius: 8px; padding: 2.5rem; max-width: 600px; margin: 0 auto; text-align: center; }
        .brand { font-size: 1.5rem; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-bottom: 20px; }
        .brand span { color: #ff3e3e; }
        .title { color: #10b981; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin-bottom: 20px; }
        .details { text-align: left; background: #111; padding: 1.5rem; border-radius: 6px; margin: 20px 0; border: 1px solid #1c1c1c; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
        .label { color: #71717a; }
        .val { color: #ffffff; font-weight: bold; }
        .val.accent { color: #ff3e3e; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">ULTRA<span>DRIVE</span></div>
        <div class="title">✓ VIP Private Appointment Confirmed</div>
        <p>Dear ${params.name}, your exclusive showroom invitation is official. A brand representative has finalized your timeslot.</p>
        <div class="details">
          <div class="row"><span class="label">Model:</span><span class="val accent">${params.carInterest}</span></div>
          <div class="row"><span class="label">Date:</span><span class="val">${formattedDate}</span></div>
        </div>
        <p style="font-size: 0.8rem; color: #52525b;">UltraDrive HQ • Luxury Automotive Concierge Services</p>
      </div>
    </body>
    </html>
  `;

  if (hasEmailConfig && transporter) {
    try {
      await transporter.sendMail({
        from: `"UltraDrive Concierge" <${process.env.SMTP_USER}>`,
        to: params.email,
        subject: `🔒 VIP Confirmed: Showroom Track Appointment for ${params.carInterest}`,
        html: confirmHtml,
      });
      return true;
    } catch (err) {
      console.error('SMTP appointment confirmation failed:', (err as Error).message);
      return false;
    }
  } else {
    console.log('\n=============================================================');
    console.log('📢 SIMULATED SMTP DISPATCH: VIP BOOKING CONFIRMED');
    console.log(`To Client: ${params.email}`);
    console.log(`Subject: 🔒 VIP Appointment Confirmed: ${params.carInterest}`);
    console.log(`Client: ${params.name}`);
    console.log(`Time: ${formattedDate}`);
    console.log('=============================================================\n');
    return true;
  }
};

export interface CarSoldAlertParams {
  brand: string;
  name: string;
  price: string;
}

export const sendCarSoldAlert = async (params: CarSoldAlertParams) => {
  const soldHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hypercar Deal Closed</title>
      <style>
        body { background-color: #050505; color: #e5e5e7; font-family: sans-serif; padding: 20px; }
        .card { background-color: #0b0b0b; border: 1px solid #1a1a1a; border-radius: 8px; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 1.25rem; color: #10b981; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
        .accent-text { font-size: 2rem; font-weight: 900; color: #ffffff; margin: 20px 0; }
        .accent-text span { color: #10b981; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🍾 Deal Completed: Vehicle Marked Sold</h1>
        </div>
        <p>Congratulations team! Another hypercar transaction has finalized.</p>
        <div class="accent-text">${params.brand} <span>${params.name}</span></div>
        <div style="font-size: 1.1rem; font-weight: bold; color: #10b981;">Contract Price: ${params.price}</div>
      </div>
    </body>
    </html>
  `;

  if (hasEmailConfig && transporter) {
    try {
      await transporter.sendMail({
        from: `"UltraDrive Sales" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: `🍾 Deal Closed: ${params.brand} ${params.name} Marked Sold!`,
        html: soldHtml,
      });
      return true;
    } catch (err) {
      console.error('SMTP deal closed alert failed:', (err as Error).message);
      return false;
    }
  } else {
    console.log('\n=============================================================');
    console.log('📢 SIMULATED SMTP DISPATCH: VEHICLE SOLD COMPLETED');
    console.log(`To Staff: [ADMIN-BOX]`);
    console.log(`Subject: 🍾 Deal Closed: ${params.brand} ${params.name} Sold!`);
    console.log(`Vehicle: ${params.brand} ${params.name}`);
    console.log(`Price: ${params.price}`);
    console.log('=============================================================\n');
    return true;
  }
};
