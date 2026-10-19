// Kanban Application Pipeline & Interview Tracker
window.TrackerModule = {
  applications: [],

  init() {
    this.bindEvents();
    this.fetchApplications();
  },

  bindEvents() {
    const btnAdd = document.getElementById('btnAddNewAppModal');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.promptNewApplication());
    }
  },

  async fetchApplications() {
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) return;
      const data = await res.json();
      this.applications = data.applications || [];
      this.renderKanban();
      window.App.refreshStats();
    } catch (err) {
      console.warn('Applications fetch error:', err);
    }
  },

  renderKanban() {
    const cols = {
      saved: document.getElementById('cardsSaved'),
      ats_tailored: document.getElementById('cardsTailored'),
      applied: document.getElementById('cardsApplied'),
      interview: document.getElementById('cardsInterview'),
      offer: document.getElementById('cardsOffer')
    };

    const counts = {
      saved: document.getElementById('countSaved'),
      ats_tailored: document.getElementById('countTailored'),
      applied: document.getElementById('countApplied'),
      interview: document.getElementById('countInterview'),
      offer: document.getElementById('countOffer')
    };

    // Reset columns
    for (const key of Object.keys(cols)) {
      if (cols[key]) cols[key].innerHTML = '';
      if (counts[key]) counts[key].textContent = '0';
    }

    const grouped = {
      saved: [],
      ats_tailored: [],
      applied: [],
      interview: [],
      offer: []
    };

    this.applications.forEach(app => {
      const status = app.status || 'saved';
      if (grouped[status]) {
        grouped[status].push(app);
      } else {
        grouped.saved.push(app);
      }
    });

    for (const [status, apps] of Object.entries(grouped)) {
      if (counts[status]) counts[status].textContent = apps.length;

      if (cols[status]) {
        if (apps.length === 0) {
          cols[status].innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 20px 0;">No jobs yet</div>`;
          continue;
        }

        cols[status].innerHTML = apps.map(app => {
          const atsTag = app.atsScore ? `<span class="confidence-tag">${app.atsScore}% ATS</span>` : '';
          const emailTag = app.recruiterEmail ? `<span style="font-size: 0.7rem; color: var(--accent-cyan); display: block; margin-top: 4px;">✉️ ${this.escapeHtml(app.recruiterEmail)}</span>` : '';

          return `
            <div class="kanban-card" id="card_${app.id}">
              <div class="kanban-card-title">${this.escapeHtml(app.jobTitle)}</div>
              <div class="kanban-card-company">${this.escapeHtml(app.company)}</div>
              ${emailTag}

              <div class="kanban-card-meta">
                <span>📍 ${this.escapeHtml(app.location || 'Remote')}</span>
                ${atsTag}
              </div>

              <div style="display: flex; gap: 4px; margin-top: 8px; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 4px;">
                  ${this.renderStageButtons(app)}
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.TrackerModule.deleteApp('${app.id}')" style="padding: 2px 6px; font-size: 0.7rem;" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  renderStageButtons(app) {
    const stages = ['saved', 'ats_tailored', 'applied', 'interview', 'offer'];
    const currentIdx = stages.indexOf(app.status || 'saved');

    let btns = '';
    if (currentIdx > 0) {
      const prevStage = stages[currentIdx - 1];
      btns += `<button class="btn btn-secondary btn-sm" onclick="window.TrackerModule.updateStatus('${app.id}', '${prevStage}')" style="padding: 2px 6px; font-size: 0.7rem;" title="Move back">←</button>`;
    }
    if (currentIdx < stages.length - 1) {
      const nextStage = stages[currentIdx + 1];
      btns += `<button class="btn btn-primary btn-sm" onclick="window.TrackerModule.updateStatus('${app.id}', '${nextStage}')" style="padding: 2px 6px; font-size: 0.7rem;" title="Move to next stage">→</button>`;
    }
    return btns;
  },

  async updateStatus(appId, newStatus) {
    try {
      const app = this.applications.find(a => a.id === appId);
      if (!app) return;

      app.status = newStatus;
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });

      this.renderKanban();
      window.App.refreshStats();
      window.App.showToast(`Updated status to: ${newStatus.replace('_', ' ')}`, 'info');
    } catch (err) {
      window.App.showToast('Update failed: ' + err.message, 'error');
    }
  },

  async deleteApp(appId) {
    if (!confirm('Are you sure you want to remove this application?')) return;
    try {
      await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
      this.applications = this.applications.filter(a => a.id !== appId);
      this.renderKanban();
      window.App.refreshStats();
      window.App.showToast('Application deleted.', 'info');
    } catch (err) {
      window.App.showToast('Delete error: ' + err.message, 'error');
    }
  },

  async promptNewApplication() {
    const jobTitle = prompt('Enter Job Title:', 'Senior Software Engineer');
    if (!jobTitle) return;
    const company = prompt('Enter Company Name:', 'Tech Company');
    if (!company) return;

    try {
      const newApp = {
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        status: 'saved',
        location: 'Remote',
        createdAt: new Date().toISOString()
      };

      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });

      await this.fetchApplications();
      window.App.showToast('Application added to pipeline!', 'success');
    } catch (err) {
      window.App.showToast('Add failed: ' + err.message, 'error');
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
  window.TrackerModule.init();
});
