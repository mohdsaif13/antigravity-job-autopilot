/**
 * Generates an automated application autofill bookmarklet based on user profile
 */
function generateAutofillBookmarklet(profile = {}) {
  const safeProfile = {
    fullName: profile.name || '',
    firstName: (profile.name || '').split(' ')[0] || '',
    lastName: (profile.name || '').split(' ').slice(1).join(' ') || '',
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    linkedin: profile.linkedin || '',
    github: profile.github || '',
    portfolio: profile.portfolio || profile.github || '',
    summary: profile.summary || '',
    topAchievement: profile.topAchievement || ''
  };

  const code = `javascript:(function(){
    const p = ${JSON.stringify(safeProfile)};
    let filled = 0;

    function setVal(selector, val) {
      if (!val) return;
      const el = document.querySelector(selector);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      }
    }

    function matchAndFill(elements) {
      elements.forEach(el => {
        const id = (el.id || '').toLowerCase();
        const name = (el.name || '').toLowerCase();
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (el.placeholder || '').toLowerCase();
        const combo = id + ' ' + name + ' ' + label + ' ' + placeholder;

        if (combo.includes('first') && combo.includes('name')) {
          el.value = p.firstName; filled++;
        } else if (combo.includes('last') && combo.includes('name')) {
          el.value = p.lastName; filled++;
        } else if (combo.includes('name') && !combo.includes('company') && !combo.includes('user')) {
          el.value = p.fullName; filled++;
        } else if (combo.includes('email') || el.type === 'email') {
          el.value = p.email; filled++;
        } else if (combo.includes('phone') || combo.includes('tel') || el.type === 'tel') {
          el.value = p.phone; filled++;
        } else if (combo.includes('linkedin')) {
          el.value = p.linkedin; filled++;
        } else if (combo.includes('github')) {
          el.value = p.github; filled++;
        } else if (combo.includes('portfolio') || combo.includes('website') || combo.includes('urls[portfolio]')) {
          el.value = p.portfolio; filled++;
        } else if (combo.includes('location') || combo.includes('city') || combo.includes('address')) {
          el.value = p.location; filled++;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    matchAndFill(Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"])')));
    matchAndFill(Array.from(document.querySelectorAll('textarea')));

    // Floating Notification Banner
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:16px;right:16px;z-index:999999;background:linear-gradient(135deg,#06B6D4,#3B82F6);color:#fff;padding:14px 20px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;';
    banner.innerHTML = '⚡ Antigravity Job Autopilot: ' + filled + ' fields auto-filled!';
    document.body.appendChild(banner);
    setTimeout(() => { banner.remove(); }, 4000);
  })();`;

  return code.replace(/\n\s+/g, ' ');
}

module.exports = {
  generateAutofillBookmarklet
};
