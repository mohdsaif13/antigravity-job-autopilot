const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const TEMPLATES_FILE = path.join(__dirname, '../data/templates.json');

/**
 * Clean company name and derive clean domain
 */
function deriveCompanyDomain(companyName) {
  if (!companyName) return 'company.com';
  let clean = companyName.toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|technologies|gmbh|co|solutions|software|group)\b/gi, '')
    .replace(/[^a-z0-9]/g, '');
  return (clean || 'company') + '.com';
}

/**
 * Generate recruiter intel, target links, and email permutations
 */
function findRecruiterIntel(companyName, jobTitle = 'Software Engineer') {
  const domain = deriveCompanyDomain(companyName);
  const cleanCompany = companyName.replace(/[^\w\s.-]/g, '').trim();

  // High confidence recruiter & hiring manager email patterns
  const emailPatterns = [
    { type: 'Recruiting Team', email: `recruiting@${domain}`, confidence: '92%' },
    { type: 'Talent Acquisition', email: `talent@${domain}`, confidence: '88%' },
    { type: 'Careers Inquiries', email: `careers@${domain}`, confidence: '85%' },
    { type: 'Engineering Hiring', email: `engineering@${domain}`, confidence: '78%' },
    { type: 'Standard Format (first.last)', email: `{firstname}.{lastname}@${domain}`, confidence: '75%' },
    { type: 'Direct Format (first)', email: `{firstname}@${domain}`, confidence: '68%' }
  ];

  // 1-Click Search URLs
  const linkedinRecruiterSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${cleanCompany} ("technical recruiter" OR "talent acquisition" OR "engineering manager")`)}`;
  const googleDorkLinkedin = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in ("technical recruiter" OR "talent acquisition" OR "engineering manager") "${cleanCompany}"`)}`;
  const companyCareersSearch = `https://www.google.com/search?q=${encodeURIComponent(`"${cleanCompany}" careers jobs "${jobTitle}"`)}`;
  const techBlogSearch = `https://www.google.com/search?q=${encodeURIComponent(`"${cleanCompany}" engineering blog github`)}`;

  return {
    company: cleanCompany,
    domain,
    emailPatterns,
    searchLinks: {
      linkedinRecruiterSearch,
      googleDorkLinkedin,
      companyCareersSearch,
      techBlogSearch
    }
  };
}

/**
 * Load available email templates
 */
function getTemplates() {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading templates:', err);
  }
  return [];
}

/**
 * Generate customized cold outreach email
 */
function generateOutreachEmail({ templateId = 'direct_pitch', job = {}, profile = {}, recruiterName = 'Hiring Team' }) {
  const templates = getTemplates();
  const selectedTemplate = templates.find(t => t.id === templateId) || templates[0];

  const company = job.company || 'the team';
  const jobTitle = job.title || 'Open Role';
  const jobId = job.id || 'N/A';

  // Extract candidate's top skills
  const skillsList = profile.skills ? profile.skills.split(',').slice(0, 4).join(', ') : 'modern full-stack web development';
  const topAchievement = profile.topAchievement || 'delivered high-performance production features that improved platform efficiency';

  const replaceMap = {
    '{{recruiter_name}}': recruiterName.trim() || 'Hiring Team',
    '{{company}}': company,
    '{{job_title}}': jobTitle,
    '{{job_id}}': jobId,
    '{{user_name}}': profile.name || 'Candidate',
    '{{user_email}}': profile.email || 'your.email@example.com',
    '{{user_phone}}': profile.phone || '',
    '{{linkedin_url}}': profile.linkedin || '',
    '{{github_url}}': profile.github || '',
    '{{portfolio_url}}': profile.portfolio || profile.github || '',
    '{{key_skills}}': skillsList,
    '{{top_achievement}}': topAchievement
  };

  let subject = selectedTemplate.subject;
  let body = selectedTemplate.body;

  for (const [token, value] of Object.entries(replaceMap)) {
    subject = subject.split(token).join(value);
    body = body.split(token).join(value);
  }

  // Construct mailto link
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    templateId: selectedTemplate.id,
    templateName: selectedTemplate.name,
    subject,
    body,
    mailtoUrl
  };
}

/**
 * Send email using 100% Free Gmail SMTP (via standard Gmail App Password)
 */
async function sendViaGmailSmtp({ gmailUser, gmailAppPassword, toEmail, subject, textBody, htmlBody }) {
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail username and 16-character App Password are required for direct SMTP delivery. See Settings for the free 1-minute setup guide.');
  }

  if (!toEmail || !toEmail.includes('@')) {
    throw new Error('Please enter a valid recipient email address.');
  }

  // Create standard nodemailer transport with Google's SMTP servers
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: gmailUser.trim(),
      pass: gmailAppPassword.replace(/\s+/g, '') // remove spaces from 16-char app password
    }
  });

  const mailOptions = {
    from: `"${gmailUser.split('@')[0]}" <${gmailUser.trim()}>`,
    to: toEmail.trim(),
    subject: subject,
    text: textBody,
    html: htmlBody || textBody.replace(/\n/g, '<br>')
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    accepted: info.accepted,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  findRecruiterIntel,
  getTemplates,
  generateOutreachEmail,
  sendViaGmailSmtp
};
