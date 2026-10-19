require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

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

    const results = await jobService.searchAllJobs({
      query,
      location,
      remoteOnly: isRemote,
      tag,
      forceRefresh
    });

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
    const result = atsService.calculateAtsScore(resumeText, jobDescription);
    res.json({ success: true, ...result });
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

    const result = await atsService.tailorResumeWithGemini(resumeText, jobDescription, profile, apiKey);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Resume File Upload (PDF or Text)
app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let extractedText = '';
    const mimeType = req.file.mimetype;

    if (mimeType === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else {
      extractedText = req.file.buffer.toString('utf8');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ success: false, error: 'Could not extract text from the file.' });
    }

    // Automatically update the profile resumeText
    const updatedProfile = storeService.updateProfile({ resumeText: extractedText.trim() });

    res.json({
      success: true,
      textLength: extractedText.length,
      extractedText: extractedText.trim(),
      profile: updatedProfile
    });
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
    if (!company) {
      return res.status(400).json({ success: false, error: 'Company parameter is required' });
    }
    const intel = recruiterService.findRecruiterIntel(company, jobTitle);
    res.json({ success: true, intel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/templates', (req, res) => {
  try {
    const templates = recruiterService.getTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/generate-outreach', (req, res) => {
  try {
    const { templateId, job, recruiterName } = req.body;
    const profile = storeService.getProfile();
    const result = recruiterService.generateOutreachEmail({
      templateId,
      job,
      profile,
      recruiterName
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { toEmail, subject, textBody, htmlBody } = req.body;
    const settings = storeService.getSettings();

    if (!settings.gmailUser || !settings.gmailAppPassword) {
      return res.status(400).json({
        success: false,
        error: 'Gmail credentials not configured. Please set your Gmail and free App Password in Settings tab, or use the 1-click "Open in Mail App" / Copy button.'
      });
    }

    const result = await recruiterService.sendViaGmailSmtp({
      gmailUser: settings.gmailUser,
      gmailAppPassword: settings.gmailAppPassword,
      toEmail,
      subject,
      textBody,
      htmlBody
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STORE, PROFILE & SETTINGS API
// ==========================================
app.get('/api/profile', (req, res) => {
  res.json({ success: true, profile: storeService.getProfile() });
});

app.post('/api/profile', (req, res) => {
  try {
    const updated = storeService.updateProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/settings', (req, res) => {
  const settings = storeService.getSettings();
  // Mask password for display
  const safeSettings = {
    ...settings,
    gmailAppPassword: settings.gmailAppPassword ? '••••••••••••••••' : ''
  };
  res.json({ success: true, settings: safeSettings });
});

app.post('/api/settings', (req, res) => {
  try {
    const current = storeService.getSettings();
    const updates = { ...req.body };
    // If password wasn't changed from masked, keep existing
    if (updates.gmailAppPassword === '••••••••••••••••') {
      updates.gmailAppPassword = current.gmailAppPassword;
    }
    const updated = storeService.updateSettings(updates);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SAVED JOBS & PIPELINE TRACKER API
// ==========================================
app.get('/api/saved-jobs', (req, res) => {
  res.json({ success: true, savedJobs: storeService.getSavedJobs() });
});

app.post('/api/saved-jobs', (req, res) => {
  try {
    const saved = storeService.saveJob(req.body);
    res.json({ success: true, savedJobs: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/saved-jobs/:id', (req, res) => {
  try {
    const saved = storeService.removeSavedJob(req.params.id);
    res.json({ success: true, savedJobs: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/applications', (req, res) => {
  res.json({ success: true, applications: storeService.getApplications() });
});

app.post('/api/applications', (req, res) => {
  try {
    const applications = storeService.saveApplication(req.body);
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/applications/:id', (req, res) => {
  try {
    const applications = storeService.deleteApplication(req.params.id);
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/pipeline-stats', (req, res) => {
  res.json({ success: true, stats: storeService.getPipelineStats() });
});

app.get('/api/autofill-bookmarklet', (req, res) => {
  const profile = storeService.getProfile();
  const code = autoApplyService.generateAutofillBookmarklet(profile);
  res.json({ success: true, bookmarkletCode: code });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Antigravity Job Autopilot is live at: http://localhost:${PORT}`);
  console.log(`📡 Free multi-provider job search & ATS optimizer active`);
  console.log(`======================================================\n`);
});
