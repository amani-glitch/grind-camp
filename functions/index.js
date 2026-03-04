const functions = require('@google-cloud/functions-framework');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'grindcamp84@gmail.com').split(',').map(e => e.trim());
const CC_EMAILS = (process.env.CC_EMAILS || 'grindcamp84@gmail.com').split(',').map(e => e.trim()).filter(Boolean);
const FROM_EMAIL = process.env.FROM_EMAIL || 'yacine@bestoftours.co.uk';
const FROM_NAME = process.env.FROM_NAME || 'GrindCamp';

// Support two authentication methods:
// 1. Gmail App Password (simple, no delegation needed)
// 2. Service Account with Domain-wide Delegation (for Google Workspace)
const USE_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ? true : false;
const GMAIL_USER = process.env.GMAIL_USER || FROM_EMAIL;
const DELEGATED_EMAIL = process.env.DELEGATED_EMAIL || FROM_EMAIL;

// Allowed origins for CORS (configure via environment variable)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://grindcamp.fr,https://www.grindcamp.fr,http://localhost:6000').split(',').map(o => o.trim());

// Rate limiting store (in-memory, resets on function cold start)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

// CORS headers - dynamically set based on request origin
function getCorsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600',
  };
}

// Rate limiting check
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Input sanitization - escape HTML to prevent XSS in email templates
function escapeHtml(text) {
  if (!text) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate registration data structure
function validateRegistration(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid data format'] };
  }

  // Parent validation
  if (!data.parent || typeof data.parent !== 'object') {
    errors.push('Missing parent information');
  } else {
    if (!data.parent.firstName || typeof data.parent.firstName !== 'string') {
      errors.push('Invalid parent first name');
    }
    if (!data.parent.lastName || typeof data.parent.lastName !== 'string') {
      errors.push('Invalid parent last name');
    }
    if (!data.parent.email || !isValidEmail(data.parent.email)) {
      errors.push('Invalid parent email');
    }
    if (!data.parent.phone || !isValidPhone(data.parent.phone)) {
      errors.push('Invalid parent phone');
    }
  }

  // Child validation
  if (!data.child || typeof data.child !== 'object') {
    errors.push('Missing child information');
  } else {
    if (!data.child.firstName || typeof data.child.firstName !== 'string') {
      errors.push('Invalid child first name');
    }
    if (!data.child.lastName || typeof data.child.lastName !== 'string') {
      errors.push('Invalid child last name');
    }
    if (!data.child.birthDate) {
      errors.push('Missing child birth date');
    }
  if (!['U11', 'U13', 'U15', 'U18'].includes(data.child.category)) {
      errors.push('Invalid category');
    }
  }

  return { valid: errors.length === 0, errors };
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function isValidPhone(phone) {
  // Accept international phone formats (ITU-T E.164 standard: 8-15 digits)
  const cleaned = String(phone).replace(/[\s.\-()]/g, '');
  const digitsOnly = cleaned.replace(/\+/g, '');
  return /^[\d\s+.\-()]{8,20}$/.test(phone) && digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

// Create Gmail transporter - Supports both App Password and Service Account
async function createTransporter() {
  // Priority 1: Using Gmail App Password (simplest method, no delegation needed)
  if (process.env.GMAIL_APP_PASSWORD) {
    console.log('Using Gmail App Password authentication');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    return { type: 'nodemailer', transporter };
  }

  // Priority 2: Using Service Account with domain-wide delegation
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    console.log('Using Service Account with domain-wide delegation');
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: DELEGATED_EMAIL, // Impersonate this email address
    });

    const gmail = google.gmail({ version: 'v1', auth });
    return { type: 'gmail-api', gmail, auth };
  }

  throw new Error('No email configuration found. Set GMAIL_APP_PASSWORD or GOOGLE_SERVICE_ACCOUNT');
}

// Send email using Gmail API with domain-wide delegation
async function sendWithGmailAPI(gmail, to, subject, htmlContent, ccList = []) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
  `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${to}`,
  ...(ccList.length ? [`Cc: ${ccList.join(', ')}`] : []),
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me', // 'me' refers to the delegated email (amani.bestoftours.co.uk)
    requestBody: { raw: encodedMessage },
  });
}

// Send email using Nodemailer
async function sendWithNodemailer(transporter, to, subject, htmlContent, ccList = []) {
  await transporter.sendMail({
  from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
  cc: ccList.length ? ccList.join(', ') : undefined,
    subject,
    html: htmlContent,
  });
}

// Generate admin notification email
function generateAdminEmail(registration) {
  const { parent, child, health } = registration;

  // Sanitize all user inputs
  const safeParent = {
    lastName: escapeHtml(parent.lastName),
    firstName: escapeHtml(parent.firstName),
    email: escapeHtml(parent.email),
    phone: escapeHtml(parent.phone),
    address: escapeHtml(parent.address),
    postalCode: escapeHtml(parent.postalCode),
    city: escapeHtml(parent.city)
  };

  const safeChild = {
    lastName: escapeHtml(child.lastName),
    firstName: escapeHtml(child.firstName),
    birthDate: escapeHtml(child.birthDate),
    category: escapeHtml(child.category),
    club: escapeHtml(child.club),
    level: escapeHtml(child.level),
    tshirtSize: escapeHtml(child.tshirtSize)
  };

  const safeHealth = {
    allergies: escapeHtml(health?.allergies),
    treatment: escapeHtml(health?.treatment),
    medicalInfo: escapeHtml(health?.medicalInfo)
  };

  const safeId = escapeHtml(registration.id);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FF6A00; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">NOUVELLE INSCRIPTION</h1>
        <p style="margin: 5px 0 0;">The Grind Camp 2026</p>
      </div>

      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="color: #333; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">Parent</h2>
        <p><strong>Nom:</strong> ${safeParent.lastName} ${safeParent.firstName}</p>
        <p><strong>Email:</strong> ${safeParent.email}</p>
        <p><strong>Telephone:</strong> ${safeParent.phone}</p>
        <p><strong>Adresse:</strong> ${safeParent.address}, ${safeParent.postalCode} ${safeParent.city}</p>

        <h2 style="color: #333; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">Joueur/Joueuse</h2>
        <p><strong>Nom:</strong> ${safeChild.lastName} ${safeChild.firstName}</p>
        <p><strong>Date de naissance:</strong> ${safeChild.birthDate}</p>
        <p><strong>Categorie:</strong> ${safeChild.category}</p>
        <p><strong>Club:</strong> ${safeChild.club || 'Non renseigne'}</p>
        <p><strong>Niveau:</strong> ${safeChild.level}</p>
        <p><strong>Taille maillot:</strong> ${safeChild.tshirtSize}</p>

        <h2 style="color: #333; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">Sante</h2>
        <p><strong>Allergies:</strong> ${safeHealth.allergies || 'Aucune'}</p>
        <p><strong>Traitement:</strong> ${safeHealth.treatment || 'Aucun'}</p>
        <p><strong>Informations medicales:</strong> ${safeHealth.medicalInfo || 'Aucune'}</p>

        <div style="background: #FF6A00; color: white; padding: 15px; text-align: center; margin-top: 20px; border-radius: 5px;">
          <p style="margin: 0; font-size: 18px;"><strong>ID Inscription: ${safeId}</strong></p>
          <p style="margin: 5px 0 0;">Statut: EN ATTENTE DE PAIEMENT</p>
        </div>
      </div>

      <div style="padding: 15px; background: #333; color: #999; text-align: center; font-size: 12px;">
        <p>The Grind Camp - Pernes-les-Fontaines</p>
      </div>
    </div>
  `;
}

// Generate parent confirmation email
function generateParentEmail(registration) {
  const { parent, child } = registration;

  // Sanitize user inputs
  const safeParentFirstName = escapeHtml(parent.firstName);
  const safeChildFirstName = escapeHtml(child.firstName);
  const safeId = escapeHtml(registration.id);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FF6A00; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">THE GRIND CAMP</h1>
        <p style="margin: 5px 0 0;">Confirmation d'inscription</p>
      </div>

      <div style="padding: 20px; background: #f5f5f5;">
        <p>Bonjour ${safeParentFirstName},</p>

        <p>Nous avons bien recu l'inscription de <strong>${safeChildFirstName}</strong> au Grind Camp 2026 !</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #FF6A00; margin: 20px 0;">
          <p style="margin: 0;"><strong>Dates:</strong> Du 3 au 7 aout 2026</p>
          <p style="margin: 10px 0 0;"><strong>Lieu:</strong> Complexe sportif Paul de Vivie, Pernes-les-Fontaines</p>
          <p style="margin: 10px 0 0;"><strong>Tarif:</strong> 240EUR (tout inclus)</p>
          <p style="margin: 10px 0 0;"><strong>N° d'inscription:</strong> ${safeId}</p>
        </div>

        <h3 style="color: #FF6A00;">Prochaines etapes:</h3>
        <ol>
          <li>Vous recevrez un email avec les modalites de paiement</li>
          <li>Une fois le paiement valide, l'inscription sera confirmee</li>
          <li>Vous recevrez le dossier complet quelques semaines avant le camp</li>
        </ol>

        <p>Pour toute question, contactez Pascal Mercier au <strong>07 66 82 23 22</strong> ou par email a <strong>grindcamp84@gmail.com</strong></p>

        <p style="margin-top: 30px;">A tres bientot sur les terrains !</p>
        <p><strong>L'equipe du Grind Camp</strong></p>
      </div>

      <div style="padding: 15px; background: #333; color: #999; text-align: center; font-size: 12px;">
        <p>The Grind Camp - Travail, Rigueur, Respect</p>
        <p>Pernes-les-Fontaines (84)</p>
      </div>
    </div>
  `;
}

// Main Cloud Function
functions.http('sendRegistrationEmail', async (req, res) => {
  const origin = req.headers.origin || '';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  // Check rate limit
  const clientIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Trop de requetes. Veuillez reessayer dans une minute.',
      retryAfter: 60
    });
    return;
  }

  try {
    const registration = req.body;

    // Validate registration data
    const validation = validateRegistration(registration);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Donnees d\'inscription invalides',
        details: validation.errors
      });
      return;
    }

    const emailer = await createTransporter();

    // Send admin notification to all admin emails
    const adminHtml = generateAdminEmail(registration);
    const adminEmailList = ADMIN_EMAILS.join(', ');
    const safeChildName = `${escapeHtml(registration.child.firstName)} ${escapeHtml(registration.child.lastName)}`;

    if (emailer.type === 'gmail-api') {
      await sendWithGmailAPI(emailer.gmail, adminEmailList, `Nouvelle inscription: ${safeChildName}`, adminHtml);
    } else {
      await sendWithNodemailer(emailer.transporter, adminEmailList, `Nouvelle inscription: ${safeChildName}`, adminHtml);
    }

    // Send parent confirmation
    const parentHtml = generateParentEmail(registration);
    const ccList = CC_EMAILS;
    if (emailer.type === 'gmail-api') {
      await sendWithGmailAPI(emailer.gmail, registration.parent.email, 'Confirmation d\'inscription - The Grind Camp 2026', parentHtml, ccList);
    } else {
      await sendWithNodemailer(emailer.transporter, registration.parent.email, 'Confirmation d\'inscription - The Grind Camp 2026', parentHtml, ccList);
    }

    res.status(200).json({
      success: true,
      message: 'Emails envoyes avec succes',
      registrationId: registration.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    // Don't expose internal error details to client
    res.status(500).json({
      error: 'Erreur lors de l\'envoi des emails. Veuillez reessayer.'
    });
  }
});
