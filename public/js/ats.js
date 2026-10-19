// ATS Resume Optimizer & Scoring Module
window.AtsModule = {
  currentScoreData: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const btnCalculate = document.getElementById('btnRunAtsScoring');
    const btnAutoTailor = document.getElementById('btnAutoTailorResume');
    const btnUpload = document.getElementById('btnTriggerUpload');
    const fileInput = document.getElementById('fileResumeUpload');
    const btnLoadProfile = document.getElementById('btnLoadProfileResume');
    const btnClearJd = document.getElementById('btnClearJd');
    const btnExport = document.getElementById('btnExportOptimizedResume');

    if (btnCalculate) {
      btnCalculate.addEventListener('click', () => this.calculateScore());
    }

    if (btnAutoTailor) {
      btnAutoTailor.addEventListener('click', () => this.autoTailorResume());
    }

    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    if (btnLoadProfile) {
      btnLoadProfile.addEventListener('click', () => {
        const resumeInput = document.getElementById('resumeTextInput');
        if (resumeInput && window.App.state.profile && window.App.state.profile.resumeText) {
          resumeInput.value = window.App.state.profile.resumeText;
          window.App.showToast('Loaded profile resume!', 'info');
        }
      });
    }

    if (btnClearJd) {
      btnClearJd.addEventListener('click', () => {
        const jd = document.getElementById('jobDescInput');
        if (jd) jd.value = '';
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => this.copyOptimizedResume());
    }
  },

  async calculateScore() {
    const resumeText = document.getElementById('resumeTextInput')?.value.trim() || '';
    const jobDescription = document.getElementById('jobDescInput')?.value.trim() || '';

    if (!resumeText) {
      window.App.showToast('Please enter or upload your resume text first.', 'warning');
      return;
    }

    if (!jobDescription) {
      window.App.showToast('Please paste a target job description or pick a job from Tab 1.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription })
      });

      if (!res.ok) throw new Error('ATS scoring failed');
      const data = await res.json();
      this.currentScoreData = data;

      this.updateScoreUI(data);
      window.App.showToast(`ATS Score calculated: ${data.overallScore}%`, 'success');
    } catch (err) {
      window.App.showToast('Scoring error: ' + err.message, 'error');
    }
  },

  updateScoreUI(data) {
    const score = data.overallScore || 0;
    const b = data.breakdown || {};

    // Circular Chart Animation
    const circle = document.getElementById('scoreCirclePath');
    const textNumber = document.getElementById('scoreNumberText');
    const badge = document.getElementById('scoreStatusBadge');

    if (circle) {
      circle.setAttribute('stroke-dasharray', `${score}, 100`);
      let strokeColor = '#06B6D4'; // Cyan default
      if (score >= 80) strokeColor = '#10B981'; // Emerald
      else if (score < 60) strokeColor = '#F43F5E'; // Rose
      else strokeColor = '#F59E0B'; // Amber
      circle.setAttribute('stroke', strokeColor);
    }

    if (textNumber) textNumber.textContent = `${score}%`;

    if (badge) {
      if (score >= 80) {
        badge.innerHTML = '<span style="color: var(--accent-emerald);">🟢 High ATS Match (Interview Ready)</span>';
      } else if (score >= 60) {
        badge.innerHTML = '<span style="color: var(--accent-amber);">🟡 Moderate Match (Needs Optimization)</span>';
      } else {
        badge.innerHTML = '<span style="color: var(--accent-rose);">🔴 Low Match (Keywords Missing)</span>';
      }
    }

    // Breakdown bars
    this.setBar('breakdownKeywords', 'barKeywords', b.keywordMatch, 45);
    this.setBar('breakdownVerbs', 'barVerbs', b.actionVerbs, 15);
    this.setBar('breakdownMetrics', 'barMetrics', b.metrics, 20);
    this.setBar('breakdownStructure', 'barStructure', b.structure, 10);
    this.setBar('breakdownReadability', 'barReadability', b.readability, 10);

    const overallTxt = document.getElementById('breakdownOverall');
    const overallBar = document.getElementById('barOverall');
    if (overallTxt) overallTxt.textContent = `${score}%`;
    if (overallBar) overallBar.style.width = `${score}%`;

    // Missing keywords
    const missingWrap = document.getElementById('missingKeywordsContainer');
    const missingCount = document.getElementById('missingKeywordsCount');
    if (missingCount) missingCount.textContent = `${data.missingKeywords.length} detected`;

    if (missingWrap) {
      if (data.missingKeywords.length === 0) {
        missingWrap.innerHTML = '<span style="font-size: 0.82rem; color: var(--accent-emerald);">✅ Great work! All core JD skills matched.</span>';
      } else {
        missingWrap.innerHTML = data.missingKeywords.map(kw => {
          return `
            <span class="keyword-pill missing" onclick="window.AtsModule.injectKeyword('${kw}')" title="Click to copy into clipboard">
              + ${kw}
            </span>
          `;
        }).join('');
      }
    }

    // Matched keywords
    const matchedWrap = document.getElementById('matchedKeywordsContainer');
    const matchedCount = document.getElementById('matchedKeywordsCount');
    if (matchedCount) matchedCount.textContent = `${data.matchedKeywords.length} matched`;

    if (matchedWrap) {
      matchedWrap.innerHTML = data.matchedKeywords.map(kw => {
        return `<span class="keyword-pill matched">✓ ${kw}</span>`;
      }).join('');
    }
  },

  setBar(textId, barId, val, max) {
    const textEl = document.getElementById(textId);
    const barEl = document.getElementById(barId);
    if (textEl) textEl.textContent = `${val} / ${max}`;
    if (barEl) {
      const pct = Math.round((val / max) * 100);
      barEl.style.width = `${pct}%`;
    }
  },

  injectKeyword(keyword) {
    navigator.clipboard.writeText(keyword);
    window.App.showToast(`Copied "${keyword}" to clipboard!`, 'info');
  },

  async autoTailorResume() {
    const resumeText = document.getElementById('resumeTextInput')?.value.trim() || '';
    const jobDescription = document.getElementById('jobDescInput')?.value.trim() || '';

    if (!resumeText || !jobDescription) {
      window.App.showToast('Please provide both resume text and job description.', 'warning');
      return;
    }

    const btn = document.getElementById('btnAutoTailorResume');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⚙️ Optimizing with ATS AI...';
    }

    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription })
      });

      if (!res.ok) throw new Error('Tailoring failed');
      const data = await res.json();

      const outputBox = document.getElementById('tailoredOutputBox');
      const bulletsBox = document.getElementById('tailoredBulletsBox');
      const optimizedArea = document.getElementById('optimizedResumeText');
      const engineTag = document.getElementById('tailoringEngineTag');

      if (outputBox) outputBox.style.display = 'block';
      if (engineTag) engineTag.textContent = data.engine || 'ATS Optimizer';

      if (bulletsBox) {
        bulletsBox.innerHTML = `
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">
            Targeted STAR Experience Bullets:
          </h4>
          <ul style="padding-left: 20px; font-size: 0.85rem; color: #E2E8F0; line-height: 1.6;">
            ${(data.recommendedStarBullets || []).map(b => `<li>${b.replace(/^[•\s-]+/, '')}</li>`).join('')}
          </ul>
        `;
      }

      if (optimizedArea) {
        optimizedArea.value = data.optimizedResumeMarkdown || resumeText;
      }

      // Automatically re-run scoring on optimized text to show score jump!
      const reScoreRes = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: data.optimizedResumeMarkdown, jobDescription })
      });

      if (reScoreRes.ok) {
        const reScoreData = await reScoreRes.json();
        this.updateScoreUI(reScoreData);
      }

      window.App.showToast(`Resume tailored! Projected ATS Score: ${data.estimatedNewScore}%`, 'success');
    } catch (err) {
      window.App.showToast('Tailoring error: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✨ Fix & Tailor Resume (Auto-Boost to 90%+)';
      }
    }
  },

  async handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resumeFile', file);

    window.App.showToast(`Uploading and extracting "${file.name}"...`, 'info');

    try {
      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('File upload parsing failed');
      const data = await res.json();

      const resumeInput = document.getElementById('resumeTextInput');
      if (resumeInput) {
        resumeInput.value = data.extractedText;
      }

      window.App.showToast(`Extracted ${data.textLength} characters from resume!`, 'success');
      
      // If Job Description is already entered, trigger scoring automatically
      const jd = document.getElementById('jobDescInput')?.value.trim();
      if (jd) {
        this.calculateScore();
      }
    } catch (err) {
      window.App.showToast('Upload error: ' + err.message, 'error');
    }
  },

  copyOptimizedResume() {
    const optText = document.getElementById('optimizedResumeText')?.value.trim();
    if (!optText) {
      window.App.showToast('No optimized resume generated yet. Click "Fix & Tailor" first.', 'warning');
      return;
    }

    navigator.clipboard.writeText(optText);
    window.App.showToast('ATS-optimized resume copied to clipboard!', 'success');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AtsModule.init();
});
