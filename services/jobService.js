const fs = require('fs');
const path = require('path');

// Memory cache for scraped jobs with 15-minute TTL
let jobCache = {
  timestamp: 0,
  jobs: []
};

const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Normalizes job data from various free APIs into a uniform schema
 */
function normalizeJob(rawJob, source) {
  let id = '';
  let title = '';
  let company = '';
  let location = 'Remote';
  let remote = true;
  let salary = 'Competitive';
  let tags = [];
  let description = '';
  let url = '';
  let postedAt = new Date().toISOString();

  if (source === 'arbeitnow') {
    id = `an_${rawJob.slug || Math.random().toString(36).substring(7)}`;
    title = rawJob.title || 'Software Role';
    company = rawJob.company_name || 'Tech Company';
    location = rawJob.location || 'Remote / Global';
    remote = rawJob.remote === true || String(rawJob.location).toLowerCase().includes('remote');
    tags = Array.isArray(rawJob.tags) ? rawJob.tags : [];
    description = rawJob.description || '';
    url = rawJob.url || '';
    postedAt = rawJob.created_at ? new Date(rawJob.created_at * 1000).toISOString() : new Date().toISOString();
  } else if (source === 'remoteok') {
    id = `ro_${rawJob.id || Math.random().toString(36).substring(7)}`;
    title = rawJob.position || rawJob.title || 'Software Engineer';
    company = rawJob.company || 'Tech Company';
    location = rawJob.location || 'Remote';
    remote = true;
    if (rawJob.salary_min && rawJob.salary_max) {
      salary = `$${rawJob.salary_min.toLocaleString()} - $${rawJob.salary_max.toLocaleString()}`;
    } else if (rawJob.salary) {
      salary = rawJob.salary;
    }
    tags = Array.isArray(rawJob.tags) ? rawJob.tags : [];
    description = rawJob.description || '';
    url = rawJob.url ? (rawJob.url.startsWith('http') ? rawJob.url : `https://remoteok.com${rawJob.url}`) : 'https://remoteok.com';
    postedAt = rawJob.date ? new Date(rawJob.date).toISOString() : new Date().toISOString();
  } else if (source === 'jobicy') {
    id = `ji_${rawJob.id || Math.random().toString(36).substring(7)}`;
    title = rawJob.jobTitle || 'Tech Role';
    company = rawJob.companyName || 'Tech Company';
    location = rawJob.jobGeo || 'Remote';
    remote = true;
    salary = (rawJob.annualSalaryMin && rawJob.annualSalaryMax) 
      ? `$${rawJob.annualSalaryMin} - $${rawJob.annualSalaryMax}` 
      : (rawJob.salary || 'Competitive');
    tags = Array.isArray(rawJob.jobIndustry) ? rawJob.jobIndustry : [rawJob.jobIndustry || 'Technology'];
    description = rawJob.jobDescription || '';
    url = rawJob.url || '';
    postedAt = rawJob.pubDate ? new Date(rawJob.pubDate).toISOString() : new Date().toISOString();
  }

  // Clean company name and guess clean domain
  const cleanCompany = company.replace(/[^\w\s.-]/g, '').trim();
  const guessDomain = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

  return {
    id,
    title: title.trim(),
    company: cleanCompany,
    companyDomain: guessDomain,
    location: location.trim(),
    remote,
    salary,
    tags: tags.map(t => String(t).trim()).filter(Boolean),
    description,
    url,
    applyUrl: url,
    source,
    postedAt
  };
}

/**
 * Fetch from Arbeitnow Free Public API
 */
async function fetchArbeitnow() {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'JobAutopilotBot/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data.map(job => normalizeJob(job, 'arbeitnow'));
  } catch (err) {
    console.warn('Arbeitnow fetch error:', err.message);
    return [];
  }
}

/**
 * Fetch from RemoteOK Free Public API
 */
async function fetchRemoteOK() {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobAutopilotBot/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    // First item is often legal disclaimer
    const items = data.filter(item => item && item.id && item.position);
    return items.map(job => normalizeJob(job, 'remoteok'));
  } catch (err) {
    console.warn('RemoteOK fetch error:', err.message);
    return [];
  }
}

/**
 * Fetch from Jobicy Free Public API
 */
async function fetchJobicy() {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
      headers: { 'User-Agent': 'JobAutopilotBot/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];
    return data.jobs.map(job => normalizeJob(job, 'jobicy'));
  } catch (err) {
    console.warn('Jobicy fetch error:', err.message);
    return [];
  }
}

/**
 * Primary aggregator: searches across all free providers with query, remote, tags, and location filtering
 */
async function searchAllJobs({ query = '', location = '', remoteOnly = false, tag = '', forceRefresh = false } = {}) {
  const now = Date.now();
  let allJobs = [];

  if (!forceRefresh && jobCache.jobs.length > 0 && (now - jobCache.timestamp) < CACHE_TTL_MS) {
    allJobs = jobCache.jobs;
  } else {
    console.log('Fetching live jobs from free providers...');
    const [anJobs, roJobs, jiJobs] = await Promise.allSettled([
      fetchArbeitnow(),
      fetchRemoteOK(),
      fetchJobicy()
    ]);

    const combined = [
      ...(anJobs.status === 'fulfilled' ? anJobs.value : []),
      ...(roJobs.status === 'fulfilled' ? roJobs.value : []),
      ...(jiJobs.status === 'fulfilled' ? jiJobs.value : [])
    ];

    // Deduplicate by normalized title + company
    const seen = new Set();
    allJobs = combined.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    jobCache = {
      timestamp: now,
      jobs: allJobs
    };
  }

  // Filter jobs based on user criteria
  let filtered = allJobs;

  if (query && query.trim()) {
    const queryTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    filtered = filtered.filter(job => {
      const targetStr = `${job.title} ${job.company} ${job.tags.join(' ')} ${job.location}`.toLowerCase();
      // Match if all or most tokens match
      return queryTokens.every(token => targetStr.includes(token)) ||
             queryTokens.some(token => job.title.toLowerCase().includes(token));
    });
  }

  if (remoteOnly) {
    filtered = filtered.filter(job => job.remote === true || job.location.toLowerCase().includes('remote'));
  }

  if (location && location.trim() && !location.toLowerCase().includes('remote')) {
    const locLower = location.toLowerCase().trim();
    filtered = filtered.filter(job => job.location.toLowerCase().includes(locLower));
  }

  if (tag && tag.trim()) {
    const tagLower = tag.toLowerCase().trim();
    filtered = filtered.filter(job => job.tags.some(t => t.toLowerCase().includes(tagLower)));
  }

  return {
    totalFound: filtered.length,
    totalAvailable: allJobs.length,
    cachedAt: new Date(jobCache.timestamp).toISOString(),
    jobs: filtered.slice(0, 100) // Top 100 results for fast UI rendering
  };
}

module.exports = {
  searchAllJobs
};
