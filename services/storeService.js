const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/store.json');

/**
 * Read the store from JSON file
 */
function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { profile: {}, settings: {}, savedJobs: [], applications: [] };
    }
    const data = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading store:', err);
    return { profile: {}, settings: {}, savedJobs: [], applications: [] };
  }
}

/**
 * Write the store safely to JSON file
 */
function writeStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing store:', err);
    return false;
  }
}

/**
 * Get profile
 */
function getProfile() {
  const store = readStore();
  return store.profile || {};
}

/**
 * Update profile
 */
function updateProfile(newProfile) {
  const store = readStore();
  store.profile = { ...store.profile, ...newProfile };
  writeStore(store);
  return store.profile;
}

/**
 * Get settings
 */
function getSettings() {
  const store = readStore();
  return store.settings || {};
}

/**
 * Update settings
 */
function updateSettings(newSettings) {
  const store = readStore();
  store.settings = { ...store.settings, ...newSettings };
  writeStore(store);
  return store.settings;
}

/**
 * Get saved jobs
 */
function getSavedJobs() {
  const store = readStore();
  return store.savedJobs || [];
}

/**
 * Save a job
 */
function saveJob(job) {
  const store = readStore();
  if (!store.savedJobs) store.savedJobs = [];
  const exists = store.savedJobs.some(j => j.id === job.id);
  if (!exists) {
    store.savedJobs.unshift({
      ...job,
      savedAt: new Date().toISOString()
    });
    writeStore(store);
  }
  return store.savedJobs;
}

/**
 * Remove saved job
 */
function removeSavedJob(jobId) {
  const store = readStore();
  store.savedJobs = (store.savedJobs || []).filter(j => j.id !== jobId);
  writeStore(store);
  return store.savedJobs;
}

/**
 * Get applications pipeline
 */
function getApplications() {
  const store = readStore();
  return store.applications || [];
}

/**
 * Add or update an application
 * Stages: 'saved', 'ats_tailored', 'emailed', 'applied', 'interview', 'offer', 'rejected'
 */
function saveApplication(appData) {
  const store = readStore();
  if (!store.applications) store.applications = [];

  const existingIndex = store.applications.findIndex(a => a.id === appData.id || (a.jobId && a.jobId === appData.jobId));

  if (existingIndex >= 0) {
    store.applications[existingIndex] = {
      ...store.applications[existingIndex],
      ...appData,
      updatedAt: new Date().toISOString()
    };
  } else {
    const newApp = {
      id: appData.id || `app_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      jobId: appData.jobId || `job_${Date.now()}`,
      jobTitle: appData.jobTitle || 'Role',
      company: appData.company || 'Company',
      location: appData.location || 'Remote',
      salary: appData.salary || 'Competitive',
      applyUrl: appData.applyUrl || '',
      status: appData.status || 'saved', // saved, ats_tailored, emailed, applied, interview, offer, rejected
      atsScore: appData.atsScore || null,
      recruiterEmail: appData.recruiterEmail || '',
      outreachSentAt: appData.outreachSentAt || null,
      appliedAt: appData.appliedAt || null,
      interviewDate: appData.interviewDate || null,
      notes: appData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.applications.unshift(newApp);
  }

  writeStore(store);
  return store.applications;
}

/**
 * Delete application
 */
function deleteApplication(id) {
  const store = readStore();
  store.applications = (store.applications || []).filter(a => a.id !== id);
  writeStore(store);
  return store.applications;
}

/**
 * Aggregate pipeline metrics
 */
function getPipelineStats() {
  const store = readStore();
  const apps = store.applications || [];
  const saved = store.savedJobs || [];

  return {
    totalSaved: saved.length,
    totalApplications: apps.length,
    atsTailoredCount: apps.filter(a => a.status === 'ats_tailored' || a.atsScore).length,
    outreachSentCount: apps.filter(a => a.status === 'emailed' || a.outreachSentAt).length,
    appliedCount: apps.filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length,
    interviewCount: apps.filter(a => a.status === 'interview').length,
    offerCount: apps.filter(a => a.status === 'offer').length
  };
}

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getSavedJobs,
  saveJob,
  removeSavedJob,
  getApplications,
  saveApplication,
  deleteApplication,
  getPipelineStats
};
