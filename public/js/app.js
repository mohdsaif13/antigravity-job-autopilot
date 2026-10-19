// Global State
window.App = {
  state: {
    profile: null,
    settings: null,
    jobs: [],
    savedJobs: [],
    applications: [],
    selectedJob: null,
    currentAtsResult: null
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = '⚡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Tab Switching
  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');

        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const activePane = document.getElementById(targetId);
        if (activePane) {
          activePane.classList.add('active');
        }
      });
    });
  },

  // Switch to specific tab programmatically
  switchTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-target="${tabId}"]`);
    if (btn) btn.click();
  },

  // Load Initial Profile and Settings
  async loadProfileAndSettings() {
    try {
      const [profRes, setRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/settings')
      ]);

      if (profRes.ok) {
        const data = await profRes.json();
        this.state.profile = data.profile;
        this.populateProfileForm(data.profile);
      }

      if (setRes.ok) {
        const data = await setRes.json();
        this.state.settings = data.settings;
        this.populateSettingsForm(data.settings);
      }
    } catch (err) {
      console.warn('Failed to load profile/settings:', err);
    }
  },

  populateProfileForm(p) {
    if (!p) return;
    if (document.getElementById('profName')) document.getElementById('profName').value = p.name || '';
    if (document.getElementById('profEmail')) document.getElementById('profEmail').value = p.email || '';
    if (document.getElementById('profPhone')) document.getElementById('profPhone').value = p.phone || '';
    if (document.getElementById('profLocation')) document.getElementById('profLocation').value = p.location || '';
    if (document.getElementById('profTargetRoles')) document.getElementById('profTargetRoles').value = p.targetRoles || '';
    if (document.getElementById('profSkills')) document.getElementById('profSkills').value = p.skills || '';
    if (document.getElementById('profLinkedin')) document.getElementById('profLinkedin').value = p.linkedin || '';
    if (document.getElementById('profGithub')) document.getElementById('profGithub').value = p.github || '';
    if (document.getElementById('profPortfolio')) document.getElementById('profPortfolio').value = p.portfolio || '';
    if (document.getElementById('profTopAchievement')) document.getElementById('profTopAchievement').value = p.topAchievement || '';
    if (document.getElementById('profSummary')) document.getElementById('profSummary').value = p.summary || '';
    if (document.getElementById('resumeTextInput')) document.getElementById('resumeTextInput').value = p.resumeText || '';
  },

  populateSettingsForm(s) {
    if (!s) return;
    if (document.getElementById('settingsGeminiKey')) document.getElementById('settingsGeminiKey').value = s.geminiApiKey || '';
    if (document.getElementById('settingsGmailUser')) document.getElementById('settingsGmailUser').value = s.gmailUser || '';
    if (document.getElementById('settingsGmailPassword')) document.getElementById('settingsGmailPassword').value = s.gmailAppPassword || '';
  },

  // Save Candidate Profile & Settings
  async saveProfileAndSettings() {
    const profile = {
      name: document.getElementById('profName')?.value.trim() || '',
      email: document.getElementById('profEmail')?.value.trim() || '',
      phone: document.getElementById('profPhone')?.value.trim() || '',
      location: document.getElementById('profLocation')?.value.trim() || '',
      targetRoles: document.getElementById('profTargetRoles')?.value.trim() || '',
      skills: document.getElementById('profSkills')?.value.trim() || '',
      linkedin: document.getElementById('profLinkedin')?.value.trim() || '',
      github: document.getElementById('profGithub')?.value.trim() || '',
      portfolio: document.getElementById('profPortfolio')?.value.trim() || '',
      topAchievement: document.getElementById('profTopAchievement')?.value.trim() || '',
      summary: document.getElementById('profSummary')?.value.trim() || ''
    };

    const settings = {
      geminiApiKey: document.getElementById('settingsGeminiKey')?.value.trim() || '',
      gmailUser: document.getElementById('settingsGmailUser')?.value.trim() || '',
      gmailAppPassword: document.getElementById('settingsGmailPassword')?.value.trim() || ''
    };

    try {
      await Promise.all([
        fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        })
      ]);

      this.state.profile = profile;
      this.state.settings = settings;
      this.showToast('Profile & configuration saved successfully!', 'success');
      this.refreshBookmarklet();
    } catch (err) {
      this.showToast('Error saving: ' + err.message, 'error');
    }
  },

  // Update Global Header Metrics
  async refreshStats() {
    try {
      const res = await fetch('/api/pipeline-stats');
      if (!res.ok) return;
      const { stats } = await res.json();
      
      const badgeAppsCount = document.getElementById('badgeAppsCount');
      if (badgeAppsCount) badgeAppsCount.textContent = stats.totalApplications || 0;

      const statInterviewsCount = document.getElementById('statInterviewsCount');
      if (statInterviewsCount) statInterviewsCount.textContent = `${stats.interviewCount || 0} Interviews`;
    } catch (err) {
      console.warn('Stats fetch error:', err);
    }
  },

  // Autofill Bookmarklet Modal
  async initAutofillModal() {
    const btnOpen = document.getElementById('btnOpenAutofillModal');
    const modal = document.getElementById('modalAutofill');
    const btnClose = document.getElementById('btnCloseAutofillModal');
    const btnCopy = document.getElementById('btnCopyBookmarkletCode');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', async () => {
        modal.classList.add('active');
        await this.refreshBookmarklet();
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const area = document.getElementById('bookmarkletCodeArea');
        if (area) {
          navigator.clipboard.writeText(area.value);
          this.showToast('Autofill script copied to clipboard!', 'success');
        }
      });
    }
  },

  async refreshBookmarklet() {
    try {
      const res = await fetch('/api/autofill-bookmarklet');
      if (!res.ok) return;
      const data = await res.json();
      const code = data.bookmarkletCode;

      const link = document.getElementById('bookmarkletLink');
      const area = document.getElementById('bookmarkletCodeArea');
      if (link) link.href = code;
      if (area) area.value = code;
    } catch (err) {
      console.warn('Bookmarklet gen error:', err);
    }
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.initTabs();
  window.App.loadProfileAndSettings();
  window.App.refreshStats();
  window.App.initAutofillModal();

  const btnSave = document.getElementById('btnSaveProfileSettings');
  if (btnSave) {
    btnSave.addEventListener('click', () => window.App.saveProfileAndSettings());
  }

  const btnSync = document.getElementById('btnQuickSearchSync');
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      window.JobsModule.fetchJobs({ forceRefresh: true });
    });
  }
});
