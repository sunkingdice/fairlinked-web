(function () {
  'use strict';

  var COUNTRIES = [
    { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' }, { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' },
    { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' }, { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
    { code: 'HU', name: 'Hungary' }, { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' },
    { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malta' }, { code: 'NL', name: 'Netherlands' }, { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' }, { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' }, { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' }, { code: 'GB', name: 'United Kingdom' }, { code: 'NO', name: 'Norway' },
    { code: 'IS', name: 'Iceland' }, { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }, { code: 'IN', name: 'India' }, { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' }
  ].sort(function (a, b) { return a.name.localeCompare(b.name); });

  var TIERS = [
    { id: 'individual', label: 'Individual', desc: 'you use LinkedIn professionally on your own behalf, not for a company' },
    { id: 'business', label: 'Business', desc: 'you represent a business that uses and relies on LinkedIn commercially' },
    { id: 'toolmaker', label: 'Toolmaker', desc: 'you build tools or services for people who use LinkedIn' }
  ];

  var form = document.getElementById('membership-form');
  if (!form) return;

  var currentStep = 1;
  var applicationId = null;
  var stepHeading = document.getElementById('step-heading');
  var tierSelect = document.getElementById('membership_tier');
  var statusEl = document.getElementById('form-status');
  var countrySel = document.getElementById('country');
  var privacyCheckbox = document.getElementById('privacy_consent');
  var codeInput = document.getElementById('verify-code');
  var verifyBtn = document.getElementById('btn-verify');

  var STEP_TITLES = ['', 'Step 1 of 2. Your details', 'Step 2 of 2. Verify email'];

  function apiURL(path) {
    var base = (document.body.getAttribute('data-membership-api-base') || '').trim().replace(/\/$/, '');
    return base ? (base + path) : ('/api' + path);
  }

  function updateStepChrome(step) {
    if (stepHeading) stepHeading.textContent = STEP_TITLES[step] || '';
    for (var i = 1; i <= 2; i++) {
      var c = document.getElementById('step-crumb-' + i);
      if (c) c.classList.toggle('is-current', i === step);
    }
  }

  function showStep(step) {
    var steps = document.querySelectorAll('.form-step');
    for (var i = 0; i < steps.length; i++) {
      var el = steps[i];
      var n = parseInt(el.getAttribute('data-step'), 10);
      el.classList.toggle('is-active', n === step);
    }
    currentStep = step;
    updateStepChrome(step);
    statusEl.textContent = '';
    statusEl.className = 'status-msg';
  }

  function showThankYou(refId) {
    form.style.display = 'none';
    statusEl.style.display = 'none';
    if (stepHeading) stepHeading.style.display = 'none';
    var stepsBar = document.querySelector('.steps-bar');
    if (stepsBar) stepsBar.style.display = 'none';
    var refEl = document.getElementById('thank-you-ref');
    if (refEl) refEl.textContent = refId ? 'Reference: ' + refId : '';
    document.getElementById('thank-you').hidden = false;
  }

  function validateStep1() {
    var fn = document.getElementById('first_name').value.trim();
    var ln = document.getElementById('last_name').value.trim();
    var em = document.getElementById('email').value.trim();
    if (!fn || !ln) {
      statusEl.textContent = 'Please enter your first and last name.';
      statusEl.className = 'status-msg err';
      return false;
    }
    if (!em || em.indexOf('@') < 0) {
      statusEl.textContent = 'Please enter a valid email address.';
      statusEl.className = 'status-msg err';
      return false;
    }
    if (!countrySel.value) {
      statusEl.textContent = 'Please select your country.';
      statusEl.className = 'status-msg err';
      return false;
    }
    if (!tierSelect.value) {
      statusEl.textContent = 'Please choose a membership type.';
      statusEl.className = 'status-msg err';
      return false;
    }
    if (!privacyCheckbox || !privacyCheckbox.checked) {
      statusEl.textContent = 'Please confirm you have read the privacy policy.';
      statusEl.className = 'status-msg err';
      return false;
    }
    return true;
  }

  // --- Populate dropdowns ---
  var c0 = document.createElement('option');
  c0.value = '';
  c0.textContent = 'Select\u2026';
  countrySel.appendChild(c0);
  COUNTRIES.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = c.name;
    countrySel.appendChild(opt);
  });

  TIERS.forEach(function (t) {
    var opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label + ' (' + t.desc + ')';
    tierSelect.appendChild(opt);
  });

  // --- Lead capture ---
  var leadCaptured = false;
  function captureLead() {
    if (leadCaptured) return;
    leadCaptured = true;
    var payload = {
      email: document.getElementById('email').value.trim(),
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      business_name: document.getElementById('business_name').value.trim(),
      country: countrySel.value,
      membership_class: 'full',
      company_website: document.getElementById('company_website').value
    };
    fetch(apiURL('/capture-lead'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  // --- Step 1: Submit application ---
  var submitBtn = document.getElementById('btn-step1-next');

  submitBtn.addEventListener('click', function () {
    if (!validateStep1()) return;
    captureLead();
    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'status-msg';

    var payload = {
      membership_class: 'full',
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      business_name: document.getElementById('business_name').value.trim(),
      country: countrySel.value,
      email: document.getElementById('email').value.trim(),
      membership_tier: tierSelect.value,
      marketing_consent: false,
      privacy_consent: true,
      company_website: document.getElementById('company_website').value
    };

    fetch(apiURL('/membership-applications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (r.status === 204) {
          showThankYou('');
          return null;
        }
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
        return r.json();
      })
      .then(function (j) {
        if (!j) return;
        applicationId = j.id;
        var emailDisplay = document.getElementById('verify-email-display');
        if (emailDisplay) emailDisplay.textContent = payload.email;
        showStep(2);
        if (codeInput) codeInput.focus();
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not submit: ' + err.message;
        statusEl.className = 'status-msg err';
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  // --- Step 2: Verify code ---
  verifyBtn.addEventListener('click', function () {
    var code = (codeInput.value || '').trim();
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      statusEl.textContent = 'Please enter the 4-digit code from your email.';
      statusEl.className = 'status-msg err';
      return;
    }
    if (!applicationId) {
      statusEl.textContent = 'Application not found. Please start over.';
      statusEl.className = 'status-msg err';
      return;
    }
    verifyBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'status-msg';

    fetch(apiURL('/membership-applications/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: applicationId, code: code })
    })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
        showThankYou(applicationId);
      })
      .catch(function (err) {
        statusEl.textContent = err.message || 'Verification failed. Please try again.';
        statusEl.className = 'status-msg err';
      })
      .finally(function () {
        verifyBtn.disabled = false;
      });
  });

  codeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyBtn.click();
    }
  });

  showStep(1);
})();
