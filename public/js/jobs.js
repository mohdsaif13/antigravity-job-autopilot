// Job Radar & Aggregator Module
window.JobsModule = {
  currentJobs: [],
  activeTag: '',

  init() {
    this.bindEvents();
    this.fetchJobs();
  },

  bindEvents() {
    const btnSearch = document.getElementById('btnExecuteJobSearch');
    const inputSearch = document.getElementById('jobSearchInput');
    const inputLocation = document.getElementById('jobLocationInput');
    const chkRemote = document.getElementById('jobRemoteOnlyCheckbox');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => this.fetchJobs());
    }

    if (inputSearch) {
      inputSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.fetchJobs();
      });
    }

    if (inputLocation) {
      inputLocation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.fetchJobs();
      });
    }

    if (chkRemote) {
      chkRemote.addEventListener('change', () => this.fetchJobs());
    }

    // Quick tag pills
    const quickTags = document.querySelectorAll('.quick-tag');
    quickTags.forEach(tagBtn => {
      tagBtn.addEventListener('click', () => {
        const tag = tagBtn.getAttribute('data-tag');
        if (this.activeTag === tag) {
          this.activeTag = '';
          tagBtn.classList.remove('active');
        } else {
          quickTags.forEach(t => t.classList.remove('active'));
          tagBtn.classList.add('active');
          this.activeTag = tag;
        }
        this.fetchJobs();
      });
    });

    // Google / LinkedIn Search Dorks
    const btnDorks = document.getElementById('btnDorkGoogleJobs');
    if (btnDorks) {
      btnDorks.addEventListener('click', () => {
        const query = document.getElementById('jobSearchInput')?.value.trim() || 'Software Engineer';
        const dorkUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:boards.greenhouse.io OR site:jobs.lever.co OR site:workday.com ("${query}") "apply"`)}`;
        window.open(dorkUrl, '_blank');
      });
    }

    // Modal close events
    const modal = document.getElementById('modalJobDetails');
    const btnClose = document.getElementById('btnCloseJobModal');
    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  },

  async fetchJobs({ forceRefresh = false } = {}) {
    const query = document.getElementById('jobSearchInput')?.value.trim() || '';
    const location = document.getElementById('jobLocationInput')?.value.trim() || '';
    const remoteOnly = document.getElementById('jobRemoteOnlyCheckbox')?.checked ?? true;
    const tag = this.activeTag;

    const container = document.getElementById('jobsGridContainer');
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 2.2rem; margin-bottom: 12px; animation: pulse 1s infinite alternate;">📡</div>
          <p>Scanning free job feeds (Arbeitnow, RemoteOK, Jobicy)...</p>
        </div>
      `;
    }

    try {
      const params = new URLSearchParams({
        query,
        location,
        remoteOnly: String(remoteOnly),
        tag,
        refresh: String(forceRefresh)
      });

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();

      this.currentJobs = data.jobs || [];
      this.renderJobs(this.currentJobs);

      // Update counters
      const badgeCount = document.getElementById('badgeJobsCount');
      if (badgeCount) badgeCount.textContent = data.totalFound || this.currentJobs.length;

      const statLiveJobs = document.getElementById('statLiveJobsCount');
      if (statLiveJobs) statLiveJobs.textContent = data.totalAvailable || this.currentJobs.length;

      const timeLabel = document.getElementById('cacheTimestampLabel');
      if (timeLabel && data.cachedAt) {
        const timeStr = new Date(data.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeLabel.textContent = `Updated: ${timeStr} (${data.totalFound} found)`;
      }

      window.App.showToast(`Found ${this.currentJobs.length} active jobs!`, 'success');
    } catch (err) {
      console.error('Job fetch error:', err);
      if (container) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--accent-rose);">
            <p>⚠️ Unable to load jobs: ${err.message}</p>
            <button class="btn btn-primary btn-sm" onclick="window.JobsModule.fetchJobs({forceRefresh: true})" style="margin-top: 12px;">Retry</button>
          </div>
        `;
      }
    }
  },

  renderJobs(jobs) {
    const container = document.getElementById('jobsGridContainer');
    if (!container) return;

    if (!jobs || jobs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
          <h3>No jobs found matching your criteria.</h3>
          <p style="margin-top: 8px; font-size: 0.9rem;">Try broadening your keywords or turning off the remote-only filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(job => {
      const sourceBadgeColor = job.source === 'arbeitnow' ? '#06B6D4' : job.source === 'remoteok' ? '#8B5CF6' : '#10B981';
      const tagsHtml = (job.tags || []).slice(0, 5).map(t => `<span class="job-tag">${this.escapeHtml(t)}</span>`).join('');

      return `
        <div class="job-card" data-job-id="${job.id}">
          <div>
            <div class="job-card-header">
              <span class="job-company-badge">${this.escapeHtml(job.company)}</span>
              <span style="font-size: 0.7rem; font-weight: 700; color: ${sourceBadgeColor}; text-transform: uppercase;">
                ${this.escapeHtml(job.source)}
              </span>
            </div>

            <div class="job-title-link" onclick="window.JobsModule.openJobModal('${job.id}')" style="cursor: pointer;">
              ${this.escapeHtml(job.title)}
            </div>

            <div class="job-meta-row">
              <span class="job-meta-item">📍 ${this.escapeHtml(job.location)}</span>
              <span class="job-meta-item">💰 ${this.escapeHtml(job.salary)}</span>
            </div>

            <div class="job-tags-row">
              ${tagsHtml}
            </div>
          </div>

          <div class="job-card-actions">
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.JobsModule.sendToAts('${job.id}')" title="Tailor your resume against this job description">
                🎯 ATS Match
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.JobsModule.sendToOutreach('${job.id}')" title="Find recruiters and generate pitch">
                ✉️ Cold Email
              </button>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.JobsModule.saveJob('${job.id}')" title="Save to pipeline">
                📌
              </button>
              <a href="${job.applyUrl || job.url}" target="_blank" class="btn btn-primary btn-sm">
                Apply ⚡
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openJobModal(jobId) {
    const job = this.currentJobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('modalJobDetails');
    const header = document.getElementById('modalJobHeader');
    const tags = document.getElementById('modalJobTags');
    const actions = document.getElementById('modalJobActions');
    const body = document.getElementById('modalJobBody');

    if (!modal) return;

    header.innerHTML = `
      <span class="job-company-badge">${this.escapeHtml(job.company)}</span>
      <h2 style="font-size: 1.4rem; font-weight: 700; color: #FFFFFF; margin-top: 8px;">${this.escapeHtml(job.title)}</h2>
      <div class="job-meta-row" style="margin-top: 8px;">
        <span>📍 ${this.escapeHtml(job.location)}</span>
        <span>💰 ${this.escapeHtml(job.salary)}</span>
        <span>Source: ${this.escapeHtml(job.source)}</span>
      </div>
    `;

    tags.innerHTML = (job.tags || []).map(t => `<span class="job-tag">${this.escapeHtml(t)}</span>`).join('');

    actions.innerHTML = `
      <button class="btn btn-violet btn-sm" onclick="window.JobsModule.sendToAts('${job.id}'); document.getElementById('modalJobDetails').classList.remove('active');">
        🎯 Optimize Resume for this Job
      </button>
      <button class="btn btn-emerald btn-sm" onclick="window.JobsModule.sendToOutreach('${job.id}'); document.getElementById('modalJobDetails').classList.remove('active');">
        🕵️ Find Recruiters & Pitch
      </button>
      <a href="${job.applyUrl || job.url}" target="_blank" class="btn btn-primary btn-sm">
        🚀 Open Direct Apply Page
      </a>
    `;

    // Strip aggressive markup if needed or render description
    body.innerHTML = job.description || '<p>No extended job description provided. Click Apply to view on company portal.</p>';

    modal.classList.add('active');
  },

  sendToAts(jobId) {
    const job = this.currentJobs.find(j => j.id === jobId);
    if (!job) return;

    window.App.state.selectedJob = job;

    // Populate Job Description in Tab 2
    const jdArea = document.getElementById('jobDescInput');
    if (jdArea) {
      // Clean HTML from description
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = job.description;
      const plainDesc = tempDiv.textContent || tempDiv.innerText || job.description;
      jdArea.value = `${job.title} at ${job.company}\n\n${plainDesc}`;
    }

    // Switch to ATS tab and run scoring
    window.App.switchTab('tabAts');
    window.App.showToast(`Loaded "${job.title}" into ATS Optimizer!`, 'info');
    setTimeout(() => {
      window.AtsModule.calculateScore();
    }, 200);
  },

  sendToOutreach(jobId) {
    const job = this.currentJobs.find(j => j.id === jobId);
    if (!job) return;

    window.App.state.selectedJob = job;

    // Populate Recruiter Tab
    const compInput = document.getElementById('recruiterCompanyInput');
    const roleInput = document.getElementById('recruiterRoleInput');
    if (compInput) compInput.value = job.company;
    if (roleInput) roleInput.value = job.title;

    window.App.switchTab('tabRecruiter');
    window.App.showToast(`Gathering recruiter intelligence for ${job.company}...`, 'info');

    setTimeout(() => {
      window.RecruiterModule.fetchIntelAndGenerate();
    }, 200);
  },

  async saveJob(jobId) {
    const job = this.currentJobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });

      // Also create an entry in the Kanban applications pipeline
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          applyUrl: job.applyUrl || job.url,
          status: 'saved'
        })
      });

      window.App.showToast(`Saved "${job.title}" to your application pipeline!`, 'success');
      window.App.refreshStats();
      if (window.TrackerModule) window.TrackerModule.fetchApplications();
    } catch (err) {
      window.App.showToast('Error saving job: ' + err.message, 'error');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.JobsModule.init();
});
