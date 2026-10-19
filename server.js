require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const jobService = require('./services/jobService');
const atsService = require('./services/atsService');
const recruiterService = require('./services/recruiterService');
const storeService = require('./services/storeService');
const autoApplyService = require('./services/autoApplyService');

const app = express();
const PORT = process.env.PORT || 3030;

// Multer memory storage for resume uploads
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// JOB SEARCH API
// ==========================================
app.get('/api/jobs', async (req, res) => {
  try {
    const { query = '', location = '', remoteOnly, tag = '', refresh } = req.query;
    const isRemote = remoteOnly === 'true' || remoteOnly === true;
    const forceRefresh = refresh === 'true';
    const results = await jobService.searchAllJobs({ query, location, remoteOnly: isRemote, tag, forceRefresh });
    res.json({ success: true, ...results });
  } catch (err) {
    console.error('Job search API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ATS SCORE & RESUME TAILORING API
// ==========================================
app.post('/api/ats-score', (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    res.json({ success: true, ...atsService.calculateAtsScore(resumeText, jobDescription) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tailor-resume', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const profile = storeService.getProfile();
    const settings = storeService.getSettings();
    const apiKey = settings.geminiApiKey || req.body.apiKey || '';
    res.json({ success: true, ...await atsService.tailorResumeWithGemini(resumeText, jobDescription, profile, apiKey) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    let extractedText = '';
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      // Load PDF parsing only when a PDF is uploaded. Some serverless runtimes lack
      // the DOMMatrix/canvas globals required by pdf-parse v2 at module startup.
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else {
      extractedText = req.file.buffer.toString('utf8');
    }
    if (!extractedText.trim()) return res.status(400).json({ success: false, error: 'Could not extract text from the file.' });
    const updatedProfile = storeService.updateProfile({ resumeText: extractedText.trim() });
    res.json({ success: true, textLength: extractedText.length, extractedText: extractedText.trim(), profile: updatedProfile });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// RECRUITER INTEL & EMAIL OUTREACH API
// ==========================================
app.get('/api/recruiter-intel', (req, res) => {
  try {
    const { company = '', jobTitle = 'Software Engineer' } = req.query;
    if (!company) return res.status(400).json({ success: false, error: 'Company parameter is required' });
    res.json({ success: true, intel: recruiterService.findRecruiterIntel(company, jobTitle) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/templates', (req, res) => {
  try { res.json({ success: true, templates: recruiterService.getTemplates() }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/generate-outreach', (req, res) => {
  try {
    const { templateId, job, recruiterName } = req.body;
    res.json({ success: true, ...recruiterService.generateOutreachEmail({ templateId, job, profile: storeService.getProfile(), recruiterName }) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { toEmail, subject, textBody, htmlBody } = req.body;
    const settings = storeService.getSettings();
    if (!settings.gmailUser || !settings.gmailAppPassword) {
      return res.status(400).json({ success: false, error: 'Gmail credentials not configured. Set them in Settings, or use Open in Mail App.' });
    }
    res.json({ success: true, ...await recruiterService.sendViaGmailSmtp({ gmailUser: settings.gmailUser, gmailAppPassword: settings.gmailAppPassword, toEmail, subject, textBody, htmlBody }) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==========================================
// STORE, PROFILE & SETTINGS API
// ==========================================
app.get('/api/profile', (req, res) => res.json({ success: true, profile: storeService.getProfile() }));
app.post('/api/profile', (req, res) => {
  try { res.json({ success: true, profile: storeService.updateProfile(req.body) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/settings', (req, res) => {
  const settings = storeService.getSettings();
  res.json({ success: true, settings: { ...settings, gmailAppPassword: settings.gmailAppPassword ? '••••••••••••••••' : '' } });
});
app.post('/api/settings', (req, res) => {
  try {
    const current = storeService.getSettings();
    const updates = { ...req.body };
    if (updates.gmailAppPassword === '••••••••••••••••') updates.gmailAppPassword = current.gmailAppPassword;
    res.json({ success: true, settings: storeService.updateSettings(updates) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==========================================
// SAVED JOBS & PIPELINE TRACKER API
// ==========================================
app.get('/api/saved-jobs', (req, res) => res.json({ success: true, savedJobs: storeService.getSavedJobs() }));
app.post('/api/saved-jobs', (req, res) => {
  try { res.json({ success: true, savedJobs: storeService.saveJob(req.body) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.delete('/api/saved-jobs/:id', (req, res) => {
  try { res.json({ success: true, savedJobs: storeService.removeSavedJob(req.params.id) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.get('/api/applications', (req, res) => res.json({ success: true, applications: storeService.getApplications() }));
app.post('/api/applications', (req, res) => {
  try { res.json({ success: true, applications: storeService.saveApplication(req.body) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.delete('/api/applications/:id', (req, res) => {
  try { res.json({ success: true, applications: storeService.deleteApplication(req.params.id) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.get('/api/pipeline-stats', (req, res) => res.json({ success: true, stats: storeService.getPipelineStats() }));
app.get('/api/autofill-bookmarklet', (req, res) => {
  const code = autoApplyService.generateAutofillBookmarklet(storeService.getProfile());
  res.json({ success: true, bookmarkletCode: code });
});

// SPA fallback
app.use((req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// Export the Express app for Vercel serverless and keep local npm start working.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Antigravity Job Autopilot running at http://localhost:${PORT}`));
}
module.exports = app;
