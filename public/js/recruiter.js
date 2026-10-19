// Recruiter Intelligence & Cold Email Outreach Module
window.RecruiterModule = {
  currentIntel: null,

  init() {
    this.bindEvents();
    this.loadTemplates();
  },

  bindEvents() {
    const btnFetch = document.getElementById('btnFetchRecruiterIntel');
    const selectTemplate = document.getElementById('selectEmailTemplate');
    const inputRecruiterName = document.getElementById('inputRecruiterName');
    const btnSendSmtp = document.getElementById('btnSendSmtpEmail');
    const btnCopy = document.getElementById('btnCopyEmailContent');

    if (btnFetch) {
      btnFetch.addEventListener('click', () => this.fetchIntelAndGenerate());
    }

    if (selectTemplate) {
      selectTemplate.addEventListener('change', () => this.generateEmail());
    }

    if (inputRecruiterName) {
      inputRecruiterName.addEventListener('input', () => this.generateEmail());
    }

    if (btnSendSmtp) {
      btnSendSmtp.addEventListener('click', () => this.sendSmtpEmail());
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyEmail());
    }
  },

  async loadTemplates() {
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) return;
      const data = await res.json();
      const select = document.getElementById('selectEmailTemplate');
      if (select && data.templates) {
        select.innerHTML = data.templates.map(t => {
          return `<option value="${t.id}">${t.name} (${t.purpose})</option>`;
        }).join('');
      }
    } catch (err) {
      console.warn('Failed to load email templates:', err);
    }
  },

  async fetchIntelAndGenerate() {
    const company = document.getElementById('recruiterCompanyInput')?.value.trim() || '';
    const jobTitle = document.getElementById('recruiterRoleInput')?.value.trim() || 'Software Engineer';

    if (!company) {
      window.App.showToast('Please specify a company name.', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/recruiter-intel?company=${encodeURIComponent(company)}&jobTitle=${encodeURIComponent(jobTitle)}`);
      if (!res.ok) throw new Error('Could not fetch recruiter intel');
      const data = await res.json();
      this.currentIntel = data.intel;

      this.renderIntel(data.intel);
      await this.generateEmail();
      window.App.showToast(`Uncovered intelligence for ${company}!`, 'success');
    } catch (err) {
      window.App.showToast('Intel error: ' + err.message, 'error');
    }
  },

  renderIntel(intel) {
    if (!intel) return;

    // Search Links
    const linkLinkedin = document.getElementById('linkLinkedinRecruiters');
    const linkDork = document.getElementById('linkGoogleDork');
    const linkCareers = document.getElementById('linkCompanyCareers');

    if (linkLinkedin && intel.searchLinks) linkLinkedin.href = intel.searchLinks.linkedinRecruiterSearch;
    if (linkDork && intel.searchLinks) linkDork.href = intel.searchLinks.googleDorkLinkedin;
    if (linkCareers && intel.searchLinks) linkCareers.href = intel.searchLinks.companyCareersSearch;

    // Email Patterns
    const patternList = document.getElementById('emailPatternList');
    if (patternList && intel.emailPatterns) {
      patternList.innerHTML = intel.emailPatterns.map(p => {
        return `
          <div class="pattern-item" onclick="window.RecruiterModule.selectEmailPattern('${p.email}')" style="cursor: pointer;" title="Click to use this address">
            <span><code>${p.email}</code> (${p.type})</span>
            <span class="confidence-tag">${p.confidence} Match</span>
          </div>
        `;
      }).join('');
    }

    // Default top email
    const recipientInput = document.getElementById('inputRecipientEmail');
    if (recipientInput && intel.emailPatterns && intel.emailPatterns.length > 0) {
      recipientInput.value = intel.emailPatterns[0].email;
    }
  },

  selectEmailPattern(email) {
    const input = document.getElementById('inputRecipientEmail');
    if (input) {
      input.value = email;
      window.App.showToast(`Selected recipient: ${email}`, 'info');
    }
  },

  async generateEmail() {
    const templateId = document.getElementById('selectEmailTemplate')?.value || 'direct_pitch';
    const recruiterName = document.getElementById('inputRecruiterName')?.value.trim() || 'Hiring Team';
    const company = document.getElementById('recruiterCompanyInput')?.value.trim() || 'the team';
    const jobTitle = document.getElementById('recruiterRoleInput')?.value.trim() || 'Software Engineer';

    const selectedJob = window.App.state.selectedJob || {
      company,
      title: jobTitle,
      id: 'N/A'
    };

    try {
      const res = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          job: selectedJob,
          recruiterName
        })
      });

      if (!res.ok) throw new Error('Outreach generation failed');
      const data = await res.json();

      const subjectInput = document.getElementById('inputEmailSubject');
      const bodyInput = document.getElementById('inputEmailBody');
      const mailtoBtn = document.getElementById('btnMailtoLaunch');

      if (subjectInput) subjectInput.value = data.subject;
      if (bodyInput) bodyInput.value = data.body;
      if (mailtoBtn) {
        const toEmail = document.getElementById('inputRecipientEmail')?.value.trim() || '';
        mailtoBtn.href = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
      }
    } catch (err) {
      console.warn('Email gen error:', err);
    }
  },

  async sendSmtpEmail() {
    const toEmail = document.getElementById('inputRecipientEmail')?.value.trim();
    const subject = document.getElementById('inputEmailSubject')?.value.trim();
    const textBody = document.getElementById('inputEmailBody')?.value.trim();

    if (!toEmail || !toEmail.includes('@')) {
      window.App.showToast('Please specify a valid recipient email address.', 'warning');
      return;
    }

    if (!subject || !textBody) {
      window.App.showToast('Please provide an email subject and body.', 'warning');
      return;
    }

    const btn = document.getElementById('btnSendSmtpEmail');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '📤 Sending via Gmail SMTP...';
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, subject, textBody })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'SMTP delivery failed');
      }

      window.App.showToast(`Email dispatched to ${toEmail} via Gmail SMTP!`, 'success');

      // Update application pipeline to 'emailed'
      const company = document.getElementById('recruiterCompanyInput')?.value.trim() || 'Company';
      const jobTitle = document.getElementById('recruiterRoleInput')?.value.trim() || 'Role';

      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          company,
          status: 'applied',
          recruiterEmail: toEmail,
          outreachSentAt: new Date().toISOString()
        })
      });

      window.App.refreshStats();
      if (window.TrackerModule) window.TrackerModule.fetchApplications();
    } catch (err) {
      window.App.showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Send via Free Gmail SMTP';
      }
    }
  },

  copyEmail() {
    const subject = document.getElementById('inputEmailSubject')?.value.trim() || '';
    const body = document.getElementById('inputEmailBody')?.value.trim() || '';
    const fullText = `Subject: ${subject}\n\n${body}`;

    navigator.clipboard.writeText(fullText);
    window.App.showToast('Email subject and body copied to clipboard!', 'success');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.RecruiterModule.init();
});
