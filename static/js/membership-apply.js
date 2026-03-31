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

  var STEP_TITLES = [
    '',
    'Step 1 of 3. Choose membership',
    'Step 2 of 3. Your details',
    'Step 3 of 3. Review and send'
  ];

  var form = document.getElementById('membership-form');
  if (!form) return;

  var currentStep = 1;
  var stepHeading = document.getElementById('step-heading');
  var tierSelect = document.getElementById('membership_tier');
  var tierBlock = document.getElementById('tier-fieldset-step2');
  var contributionFull = document.getElementById('contribution-full-block');
  var contributionSponsorship = document.getElementById('contribution-sponsorship-block');
  var basisSlider = document.getElementById('basis_slider');
  var basisAmountHidden = document.getElementById('basis_amount');
  var basisDisplay = document.getElementById('basis_display');
  var volHidden = document.getElementById('voluntary_monthly_eur');
  var volDisplay = document.getElementById('voluntary_display');
  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');
  var countrySel = document.getElementById('country');
  var privacyCheckbox = document.getElementById('privacy_consent');

  var feesData = null;
  var currentTier = null;

  function isFull() {
    var mc = form.querySelector('input[name="membership_class"]:checked');
    return mc && mc.value === 'full';
  }

  function eurInt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '…';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function snapToStep(n, min, step) {
    if (step <= 0) return n;
    var k = Math.round((n - min) / step);
    return min + k * step;
  }

  function recommendedMonthly(tier, basis) {
    var annual = basis * tier.percentage;
    var monthlyFromBasis = annual / 12;
    return Math.max(tier.minMonthly, monthlyFromBasis);
  }

  function getBasisSlider(tier) {
    var b = tier.basisSlider;
    if (!b || typeof b.min !== 'number' || typeof b.max !== 'number') {
      return { min: 1000, max: 1000000, step: 1000 };
    }
    var step = typeof b.step === 'number' && b.step > 0 ? b.step : 1000;
    return { min: b.min, max: Math.max(b.min, b.max), step: step };
  }

  function syncMembershipClassFields() {
    if (!tierSelect || !tierBlock) return;
    if (isFull()) {
      tierBlock.hidden = false;
      tierSelect.disabled = false;
      tierSelect.setAttribute('required', 'required');
    } else {
      tierBlock.hidden = true;
      tierSelect.disabled = true;
      tierSelect.removeAttribute('required');
      tierSelect.value = '';
      currentTier = null;
    }
  }

  function applyTierToBasisSlider() {
    if (!currentTier || !basisSlider) return;
    var cfg = getBasisSlider(currentTier);
    basisSlider.min = String(cfg.min);
    basisSlider.max = String(cfg.max);
    basisSlider.step = String(cfg.step);
    var guess = currentTier.example && currentTier.example.amount
      ? currentTier.example.amount
      : (cfg.min + cfg.max) / 2;
    guess = snapToStep(clamp(guess, cfg.min, cfg.max), cfg.min, cfg.step);
    basisSlider.value = String(guess);
    var bl = document.getElementById('basis-label');
    if (bl) bl.textContent = currentTier.basisLabel;
    updateFromBasisSlider();
  }

  function updateFromBasisSlider() {
    if (!currentTier || !basisSlider) return;
    var v = parseFloat(basisSlider.value, 10);
    if (isNaN(v)) return;
    if (basisAmountHidden) basisAmountHidden.value = String(v);
    if (basisDisplay) basisDisplay.textContent = eurInt(v);
    var guideline = recommendedMonthly(currentTier, v);
    var monthlyWhole = Math.round(guideline);
    if (volHidden) volHidden.value = String(monthlyWhole);
    if (volDisplay) volDisplay.textContent = eurInt(monthlyWhole);
  }

  function onTierChange() {
    if (!feesData || !tierSelect) return;
    var id = tierSelect.value;
    currentTier = feesData.tiers.find(function (t) { return t.id === id; });
    if (!currentTier) {
      currentTier = null;
    }
  }

  function fillTiers() {
    var keep = tierSelect.value;
    tierSelect.innerHTML = '<option value="">Select…</option>';
    feesData.tiers.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.selectLabel || t.label;
      tierSelect.appendChild(opt);
    });
    if (keep && feesData.tiers.some(function (t) { return t.id === keep; })) {
      tierSelect.value = keep;
    }
    onTierChange();
  }

  function updateStepChrome(step) {
    if (stepHeading) stepHeading.textContent = STEP_TITLES[step] || '';
    for (var i = 1; i <= 3; i++) {
      var c = document.getElementById('step-crumb-' + i);
      if (c) c.classList.toggle('is-current', i === step);
    }
  }

  function updateContributionContext() {
    var titleEl = document.getElementById('contribution-context-title');
    var detailEl = document.getElementById('contribution-context-detail');
    if (!titleEl || !detailEl) return;
    if (isFull()) {
      onTierChange();
      titleEl.textContent = 'Full membership';
      if (currentTier && currentTier.label) {
        detailEl.innerHTML = 'Your membership type: <strong>' + currentTier.label + '</strong><br>Each application is reviewed by the board. We’ll follow up by email.';
      } else {
        detailEl.textContent = 'Each application is reviewed by the board. We’ll follow up by email.';
      }
    } else {
      titleEl.textContent = 'Sponsorship';
      detailEl.textContent = 'You’re applying as a sponsor. That means support for Fairlinked without full membership or voting rights.';
    }
  }

  function showStep(step) {
    var steps = document.querySelectorAll('.form-step');
    for (var i = 0; i < steps.length; i++) {
      var el = steps[i];
      var n = parseInt(el.getAttribute('data-step'), 10);
      var active = n === step;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
    currentStep = step;
    updateStepChrome(step);
    if (step === 3 && isFull()) {
      onTierChange();
      if (currentTier) applyTierToBasisSlider();
      contributionFull.hidden = false;
      contributionSponsorship.hidden = true;
      updateContributionContext();
      submitBtn.textContent = 'Send application';
    } else if (step === 3) {
      contributionFull.hidden = true;
      contributionSponsorship.hidden = false;
      updateContributionContext();
      submitBtn.textContent = 'Continue to payment';
    }
    statusEl.textContent = '';
    statusEl.className = 'status-msg';
  }

  function validateStep2() {
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
    if (!privacyCheckbox || !privacyCheckbox.checked) {
      statusEl.textContent = 'Please confirm you have read the privacy policy and agree to processing of your data.';
      statusEl.className = 'status-msg err';
      return false;
    }
    if (isFull() && !tierSelect.value) {
      statusEl.textContent = 'Please choose a membership type.';
      statusEl.className = 'status-msg err';
      return false;
    }
    return true;
  }

  if (basisSlider) {
    basisSlider.addEventListener('input', updateFromBasisSlider);
    basisSlider.addEventListener('change', updateFromBasisSlider);
  }

  tierSelect.addEventListener('change', onTierChange);

  var sponsorAmountFinal = document.getElementById('sponsor_amount_final');
  var sponsorIntervalFinal = document.getElementById('sponsor_interval_final');
  var sponsorCustomInput = document.getElementById('sponsor_custom_amount');

  function syncSponsorAmount() {
    var checked = form.querySelector('input[name="sponsor_amount"]:checked');
    if (!checked) return;
    if (checked.value === 'custom') {
      var v = parseInt(sponsorCustomInput.value, 10);
      sponsorAmountFinal.value = (!isNaN(v) && v >= 1) ? String(v) : '';
    } else {
      sponsorAmountFinal.value = checked.value;
    }
  }

  function syncSponsorInterval() {
    var checked = form.querySelector('input[name="sponsor_interval"]:checked');
    if (checked) sponsorIntervalFinal.value = checked.value;
  }

  form.querySelectorAll('input[name="sponsor_amount"]').forEach(function (r) {
    r.addEventListener('change', function () {
      syncSponsorAmount();
      if (r.value === 'custom') sponsorCustomInput.focus();
    });
  });

  if (sponsorCustomInput) {
    sponsorCustomInput.addEventListener('input', function () {
      var customRadio = form.querySelector('input[name="sponsor_amount"][value="custom"]');
      if (customRadio) customRadio.checked = true;
      syncSponsorAmount();
    });
    sponsorCustomInput.addEventListener('focus', function () {
      var customRadio = form.querySelector('input[name="sponsor_amount"][value="custom"]');
      if (customRadio) customRadio.checked = true;
    });
  }

  form.querySelectorAll('input[name="sponsor_interval"]').forEach(function (r) {
    r.addEventListener('change', syncSponsorInterval);
  });

  form.querySelectorAll('input[name="membership_class"]').forEach(function (r) {
    r.addEventListener('change', syncMembershipClassFields);
  });

  document.getElementById('btn-step1-next').addEventListener('click', function () {
    syncMembershipClassFields();
    showStep(2);
  });

  document.getElementById('btn-step2-back').addEventListener('click', function () {
    showStep(1);
  });

  var leadCaptured = false;
  function captureLead() {
    if (leadCaptured) return;
    leadCaptured = true;
    var mc = form.querySelector('input[name="membership_class"]:checked');
    var payload = {
      email: document.getElementById('email').value.trim(),
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      business_name: document.getElementById('business_name').value.trim(),
      country: countrySel.value,
      membership_class: mc ? mc.value : '',
      company_website: document.getElementById('company_website').value
    };
    var apiBase = (document.body.getAttribute('data-membership-api-base') || '').trim().replace(/\/$/, '');
    var captureURL = apiBase ? (apiBase + '/capture-lead') : '/api/capture-lead';
    fetch(captureURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  document.getElementById('btn-step2-next').addEventListener('click', function () {
    if (!validateStep2()) return;
    captureLead();
    onTierChange();
    showStep(3);
  });

  document.getElementById('btn-step3-back').addEventListener('click', function () {
    showStep(2);
  });

  var c0 = document.createElement('option');
  c0.value = '';
  c0.textContent = 'Select…';
  countrySel.appendChild(c0);
  COUNTRIES.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = c.name;
    countrySel.appendChild(opt);
  });

  fetch('/fees.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      feesData = data;
      fillTiers();
      syncMembershipClassFields();
    })
    .catch(function () {
      statusEl.textContent = 'Could not load fee information. Refresh and try again.';
      statusEl.className = 'status-msg err';
    });

  function showThankYou(title, body, refId) {
    form.style.display = 'none';
    statusEl.style.display = 'none';
    var stepHeading = document.getElementById('step-heading');
    var stepsBar = document.querySelector('.steps-bar');
    if (stepHeading) stepHeading.style.display = 'none';
    if (stepsBar) stepsBar.style.display = 'none';
    var ty = document.getElementById('thank-you');
    document.getElementById('thank-you-title').textContent = title;
    document.getElementById('thank-you-body').textContent = body;
    var refEl = document.getElementById('thank-you-ref');
    refEl.textContent = refId ? 'Reference: ' + refId : '';
    ty.hidden = false;
  }

  syncMembershipClassFields();

  var urlParams = new URLSearchParams(window.location.search);
  var paymentResult = urlParams.get('payment');
  if (paymentResult === 'success') {
    showThankYou(
      'Thank you for your support',
      'Your sponsorship makes a real difference. We\u2019ll be in touch by email with next steps.',
      ''
    );
    if (window.history.replaceState) window.history.replaceState({}, '', window.location.pathname);
  } else if (paymentResult === 'cancelled') {
    statusEl.textContent = 'Payment was cancelled. Your application has been saved \u2014 you can try again anytime.';
    statusEl.className = 'status-msg err';
    showStep(1);
    if (window.history.replaceState) window.history.replaceState({}, '', window.location.pathname);
  } else {
    showStep(1);
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (currentStep !== 3) {
      statusEl.textContent = 'Please complete all steps before submitting.';
      statusEl.className = 'status-msg err';
      return;
    }
    statusEl.textContent = '';
    statusEl.className = 'status-msg';
    var mc = form.querySelector('input[name="membership_class"]:checked');
    if (!mc) {
      statusEl.textContent = 'Please choose full or sponsorship membership.';
      statusEl.className = 'status-msg err';
      return;
    }
    var cls = mc.value;
    if (!privacyCheckbox || !privacyCheckbox.checked) {
      statusEl.textContent = 'Privacy consent is required.';
      statusEl.className = 'status-msg err';
      return;
    }
    if (cls === 'full' && !tierSelect.value) {
      statusEl.textContent = 'Please choose a membership type.';
      statusEl.className = 'status-msg err';
      return;
    }
    submitBtn.disabled = true;
    var payload = {
      membership_class: cls,
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      business_name: document.getElementById('business_name').value.trim(),
      country: countrySel.value,
      email: document.getElementById('email').value.trim(),
      marketing_consent: false,
      privacy_consent: true,
      company_website: document.getElementById('company_website').value
    };
    if (cls === 'full') {
      payload.membership_tier = tierSelect.value;
      var basis = basisSlider ? parseFloat(basisSlider.value, 10) : NaN;
      if (!isNaN(basis) && basis > 0) payload.basis_amount = basis;
      var vm = parseFloat(volHidden.value, 10);
      if (!isNaN(vm)) payload.voluntary_monthly_eur = vm;
    } else {
      payload.membership_tier = '';
      syncSponsorAmount();
      syncSponsorInterval();
      var amt = parseInt(sponsorAmountFinal.value, 10);
      if (isNaN(amt) || amt < 1) {
        statusEl.textContent = 'Please choose a contribution amount.';
        statusEl.className = 'status-msg err';
        submitBtn.disabled = false;
        return;
      }
      payload.sponsor_amount = amt;
      payload.sponsor_interval = sponsorIntervalFinal.value || 'monthly';
    }

    var apiBase = (document.body.getAttribute('data-membership-api-base') || '').trim().replace(/\/$/, '');
    var submitURL = apiBase ? (apiBase + '/membership-applications') : '/api/membership-applications';
    fetch(submitURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (r.status === 204) {
          showThankYou('Application received', 'We\u2019ll follow up by email.', '');
          return null;
        }
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
        return r.json();
      })
      .then(function (j) {
        if (!j) return;
        if (j.checkout_url) {
          window.location.href = j.checkout_url;
        } else if (j.id) {
          showThankYou(
            'Application received',
            'Each application is reviewed by the board. We\u2019ll follow up by email.',
            j.id
          );
        }
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not submit: ' + err.message;
        statusEl.className = 'status-msg err';
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();
