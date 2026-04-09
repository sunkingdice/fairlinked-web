(function () {
  'use strict';

  // ~180 countries where LinkedIn operates. Excludes OFAC-sanctioned and LinkedIn-blocked countries.
  // Groups: common (top picks), eu (EU-27), europe (other European), world (rest)
  var COUNTRIES = [
    // Common
    {c:'DE',n:'Germany',g:'common',a:[]},
    {c:'GB',n:'United Kingdom',g:'common',a:['UK','Britain','England','Scotland','Wales']},
    {c:'US',n:'United States',g:'common',a:['USA','America']},
    {c:'NL',n:'Netherlands',g:'common',a:['Holland']},
    {c:'FR',n:'France',g:'common',a:[]},
    {c:'AT',n:'Austria',g:'common',a:[]},
    {c:'CH',n:'Switzerland',g:'common',a:[]},
    // EU-27
    {c:'BE',n:'Belgium',g:'eu',a:[]},
    {c:'BG',n:'Bulgaria',g:'eu',a:[]},
    {c:'HR',n:'Croatia',g:'eu',a:[]},
    {c:'CY',n:'Cyprus',g:'eu',a:[]},
    {c:'CZ',n:'Czechia',g:'eu',a:['Czech Republic','Czech']},
    {c:'DK',n:'Denmark',g:'eu',a:[]},
    {c:'EE',n:'Estonia',g:'eu',a:[]},
    {c:'FI',n:'Finland',g:'eu',a:[]},
    {c:'GR',n:'Greece',g:'eu',a:[]},
    {c:'HU',n:'Hungary',g:'eu',a:[]},
    {c:'IE',n:'Ireland',g:'eu',a:[]},
    {c:'IT',n:'Italy',g:'eu',a:[]},
    {c:'LV',n:'Latvia',g:'eu',a:[]},
    {c:'LT',n:'Lithuania',g:'eu',a:[]},
    {c:'LU',n:'Luxembourg',g:'eu',a:[]},
    {c:'MT',n:'Malta',g:'eu',a:[]},
    {c:'PL',n:'Poland',g:'eu',a:[]},
    {c:'PT',n:'Portugal',g:'eu',a:[]},
    {c:'RO',n:'Romania',g:'eu',a:[]},
    {c:'SK',n:'Slovakia',g:'eu',a:[]},
    {c:'SI',n:'Slovenia',g:'eu',a:[]},
    {c:'ES',n:'Spain',g:'eu',a:[]},
    {c:'SE',n:'Sweden',g:'eu',a:[]},
    // Europe (other)
    {c:'AL',n:'Albania',g:'europe',a:[]},
    {c:'AD',n:'Andorra',g:'europe',a:[]},
    {c:'BA',n:'Bosnia and Herzegovina',g:'europe',a:[]},
    {c:'GE',n:'Georgia',g:'europe',a:[]},
    {c:'IS',n:'Iceland',g:'europe',a:[]},
    {c:'XK',n:'Kosovo',g:'europe',a:[]},
    {c:'LI',n:'Liechtenstein',g:'europe',a:[]},
    {c:'MD',n:'Moldova',g:'europe',a:[]},
    {c:'MC',n:'Monaco',g:'europe',a:[]},
    {c:'ME',n:'Montenegro',g:'europe',a:[]},
    {c:'MK',n:'North Macedonia',g:'europe',a:['Macedonia']},
    {c:'NO',n:'Norway',g:'europe',a:[]},
    {c:'RS',n:'Serbia',g:'europe',a:[]},
    {c:'SM',n:'San Marino',g:'europe',a:[]},
    {c:'TR',n:'Turkey',g:'europe',a:['Türkiye']},
    {c:'UA',n:'Ukraine',g:'europe',a:[]},
    // Rest of world — Americas
    {c:'AR',n:'Argentina',g:'world',a:[]},
    {c:'BS',n:'Bahamas',g:'world',a:[]},
    {c:'BB',n:'Barbados',g:'world',a:[]},
    {c:'BZ',n:'Belize',g:'world',a:[]},
    {c:'BO',n:'Bolivia',g:'world',a:[]},
    {c:'BR',n:'Brazil',g:'world',a:[]},
    {c:'CA',n:'Canada',g:'world',a:[]},
    {c:'CL',n:'Chile',g:'world',a:[]},
    {c:'CO',n:'Colombia',g:'world',a:[]},
    {c:'CR',n:'Costa Rica',g:'world',a:[]},
    {c:'DO',n:'Dominican Republic',g:'world',a:[]},
    {c:'EC',n:'Ecuador',g:'world',a:[]},
    {c:'SV',n:'El Salvador',g:'world',a:[]},
    {c:'GT',n:'Guatemala',g:'world',a:[]},
    {c:'GY',n:'Guyana',g:'world',a:[]},
    {c:'HN',n:'Honduras',g:'world',a:[]},
    {c:'JM',n:'Jamaica',g:'world',a:[]},
    {c:'MX',n:'Mexico',g:'world',a:[]},
    {c:'NI',n:'Nicaragua',g:'world',a:[]},
    {c:'PA',n:'Panama',g:'world',a:[]},
    {c:'PY',n:'Paraguay',g:'world',a:[]},
    {c:'PE',n:'Peru',g:'world',a:[]},
    {c:'SR',n:'Suriname',g:'world',a:[]},
    {c:'TT',n:'Trinidad and Tobago',g:'world',a:[]},
    {c:'UY',n:'Uruguay',g:'world',a:[]},
    // Rest of world — Asia-Pacific
    {c:'AU',n:'Australia',g:'world',a:[]},
    {c:'BD',n:'Bangladesh',g:'world',a:[]},
    {c:'BN',n:'Brunei',g:'world',a:[]},
    {c:'KH',n:'Cambodia',g:'world',a:[]},
    {c:'FJ',n:'Fiji',g:'world',a:[]},
    {c:'HK',n:'Hong Kong',g:'world',a:[]},
    {c:'IN',n:'India',g:'world',a:[]},
    {c:'ID',n:'Indonesia',g:'world',a:[]},
    {c:'JP',n:'Japan',g:'world',a:[]},
    {c:'KZ',n:'Kazakhstan',g:'world',a:[]},
    {c:'KG',n:'Kyrgyzstan',g:'world',a:[]},
    {c:'LA',n:'Laos',g:'world',a:[]},
    {c:'MO',n:'Macao',g:'world',a:['Macau']},
    {c:'MY',n:'Malaysia',g:'world',a:[]},
    {c:'MV',n:'Maldives',g:'world',a:[]},
    {c:'MN',n:'Mongolia',g:'world',a:[]},
    {c:'NP',n:'Nepal',g:'world',a:[]},
    {c:'NZ',n:'New Zealand',g:'world',a:[]},
    {c:'PK',n:'Pakistan',g:'world',a:[]},
    {c:'PG',n:'Papua New Guinea',g:'world',a:[]},
    {c:'PH',n:'Philippines',g:'world',a:[]},
    {c:'KR',n:'South Korea',g:'world',a:['Korea']},
    {c:'SG',n:'Singapore',g:'world',a:[]},
    {c:'LK',n:'Sri Lanka',g:'world',a:[]},
    {c:'TW',n:'Taiwan',g:'world',a:[]},
    {c:'TJ',n:'Tajikistan',g:'world',a:[]},
    {c:'TH',n:'Thailand',g:'world',a:[]},
    {c:'TL',n:'Timor-Leste',g:'world',a:['East Timor']},
    {c:'TM',n:'Turkmenistan',g:'world',a:[]},
    {c:'UZ',n:'Uzbekistan',g:'world',a:[]},
    {c:'VN',n:'Vietnam',g:'world',a:[]},
    // Rest of world — Middle East
    {c:'BH',n:'Bahrain',g:'world',a:[]},
    {c:'IQ',n:'Iraq',g:'world',a:[]},
    {c:'IL',n:'Israel',g:'world',a:[]},
    {c:'JO',n:'Jordan',g:'world',a:[]},
    {c:'KW',n:'Kuwait',g:'world',a:[]},
    {c:'LB',n:'Lebanon',g:'world',a:[]},
    {c:'OM',n:'Oman',g:'world',a:[]},
    {c:'PS',n:'Palestine',g:'world',a:[]},
    {c:'QA',n:'Qatar',g:'world',a:[]},
    {c:'SA',n:'Saudi Arabia',g:'world',a:['KSA']},
    {c:'AE',n:'United Arab Emirates',g:'world',a:['UAE','Emirates','Dubai']},
    {c:'YE',n:'Yemen',g:'world',a:[]},
    // Rest of world — Africa
    {c:'DZ',n:'Algeria',g:'world',a:[]},
    {c:'AO',n:'Angola',g:'world',a:[]},
    {c:'BJ',n:'Benin',g:'world',a:[]},
    {c:'BW',n:'Botswana',g:'world',a:[]},
    {c:'BF',n:'Burkina Faso',g:'world',a:[]},
    {c:'BI',n:'Burundi',g:'world',a:[]},
    {c:'CM',n:'Cameroon',g:'world',a:[]},
    {c:'CV',n:'Cape Verde',g:'world',a:['Cabo Verde']},
    {c:'CF',n:'Central African Republic',g:'world',a:['CAR']},
    {c:'TD',n:'Chad',g:'world',a:[]},
    {c:'KM',n:'Comoros',g:'world',a:[]},
    {c:'CG',n:'Congo',g:'world',a:['Republic of the Congo','Congo-Brazzaville']},
    {c:'CD',n:'DR Congo',g:'world',a:['Democratic Republic of the Congo','Congo-Kinshasa','DRC']},
    {c:'CI',n:'Ivory Coast',g:'world',a:["Cote d'Ivoire",'Côte d\'Ivoire']},
    {c:'DJ',n:'Djibouti',g:'world',a:[]},
    {c:'EG',n:'Egypt',g:'world',a:[]},
    {c:'GQ',n:'Equatorial Guinea',g:'world',a:[]},
    {c:'SZ',n:'Eswatini',g:'world',a:['Swaziland']},
    {c:'ET',n:'Ethiopia',g:'world',a:[]},
    {c:'GA',n:'Gabon',g:'world',a:[]},
    {c:'GM',n:'Gambia',g:'world',a:[]},
    {c:'GH',n:'Ghana',g:'world',a:[]},
    {c:'GN',n:'Guinea',g:'world',a:[]},
    {c:'GW',n:'Guinea-Bissau',g:'world',a:[]},
    {c:'KE',n:'Kenya',g:'world',a:[]},
    {c:'LS',n:'Lesotho',g:'world',a:[]},
    {c:'LR',n:'Liberia',g:'world',a:[]},
    {c:'MG',n:'Madagascar',g:'world',a:[]},
    {c:'MW',n:'Malawi',g:'world',a:[]},
    {c:'ML',n:'Mali',g:'world',a:[]},
    {c:'MR',n:'Mauritania',g:'world',a:[]},
    {c:'MU',n:'Mauritius',g:'world',a:[]},
    {c:'MA',n:'Morocco',g:'world',a:[]},
    {c:'MZ',n:'Mozambique',g:'world',a:[]},
    {c:'NA',n:'Namibia',g:'world',a:[]},
    {c:'NE',n:'Niger',g:'world',a:[]},
    {c:'NG',n:'Nigeria',g:'world',a:[]},
    {c:'RW',n:'Rwanda',g:'world',a:[]},
    {c:'ST',n:'São Tomé and Príncipe',g:'world',a:[]},
    {c:'SN',n:'Senegal',g:'world',a:[]},
    {c:'SC',n:'Seychelles',g:'world',a:[]},
    {c:'SL',n:'Sierra Leone',g:'world',a:[]},
    {c:'ZA',n:'South Africa',g:'world',a:[]},
    {c:'TZ',n:'Tanzania',g:'world',a:[]},
    {c:'TG',n:'Togo',g:'world',a:[]},
    {c:'TN',n:'Tunisia',g:'world',a:[]},
    {c:'UG',n:'Uganda',g:'world',a:[]},
    {c:'ZM',n:'Zambia',g:'world',a:[]},
    {c:'ZW',n:'Zimbabwe',g:'world',a:[]}
  ];

  var GROUP_ORDER = ['common','eu','europe','world'];
  var GROUP_LABELS = {common:'Common',eu:'European Union',europe:'Europe (other)',world:'Rest of world'};

  // Sort within each group alphabetically by name
  COUNTRIES.sort(function(a,b) {
    var gi = GROUP_ORDER.indexOf(a.g) - GROUP_ORDER.indexOf(b.g);
    if (gi !== 0) return gi;
    return a.n.localeCompare(b.n);
  });

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
  var countryHidden = document.getElementById('country');
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

  // ===== Country Combobox =====
  var cbInput = document.getElementById('country-input');
  var cbList = document.getElementById('country-list');
  var cbWrap = document.getElementById('country-cb');
  var activeIdx = -1;
  var visibleOpts = [];

  function matchCountry(entry, q) {
    var low = q.toLowerCase();
    if (entry.n.toLowerCase().indexOf(low) >= 0) return true;
    if (entry.c.toLowerCase() === low) return true;
    for (var i = 0; i < entry.a.length; i++) {
      if (entry.a[i].toLowerCase().indexOf(low) >= 0) return true;
    }
    return false;
  }

  function renderList(query) {
    cbList.innerHTML = '';
    visibleOpts = [];
    activeIdx = -1;
    var q = (query || '').trim();
    var isSearch = q.length > 0;

    if (isSearch) {
      var matches = COUNTRIES.filter(function(e) { return matchCountry(e, q); });
      if (matches.length === 0) {
        cbList.innerHTML = '<div class="cb-empty">No countries found</div>';
        return;
      }
      matches.forEach(function(e) {
        var div = document.createElement('div');
        div.className = 'cb-opt';
        div.setAttribute('role', 'option');
        div.setAttribute('data-code', e.c);
        div.textContent = e.n;
        if (e.c === countryHidden.value) div.classList.add('is-selected');
        cbList.appendChild(div);
        visibleOpts.push(div);
      });
    } else {
      var lastGroup = '';
      COUNTRIES.forEach(function(e) {
        if (e.g !== lastGroup) {
          lastGroup = e.g;
          var hdr = document.createElement('div');
          hdr.className = 'cb-group-hdr';
          hdr.textContent = GROUP_LABELS[e.g] || e.g;
          cbList.appendChild(hdr);
        }
        var div = document.createElement('div');
        div.className = 'cb-opt';
        div.setAttribute('role', 'option');
        div.setAttribute('data-code', e.c);
        div.textContent = e.n;
        if (e.c === countryHidden.value) div.classList.add('is-selected');
        cbList.appendChild(div);
        visibleOpts.push(div);
      });
    }
  }

  function openList() {
    renderList(cbInput.value);
    cbList.classList.add('is-open');
    cbInput.setAttribute('aria-expanded', 'true');
    var sel = cbList.querySelector('.is-selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function closeList() {
    cbList.classList.remove('is-open');
    cbInput.setAttribute('aria-expanded', 'false');
    activeIdx = -1;
    clearActive();
  }

  function clearActive() {
    visibleOpts.forEach(function(o) { o.classList.remove('is-active'); });
  }

  function setActive(idx) {
    clearActive();
    if (idx < 0 || idx >= visibleOpts.length) return;
    activeIdx = idx;
    visibleOpts[idx].classList.add('is-active');
    visibleOpts[idx].scrollIntoView({ block: 'nearest' });
    cbInput.setAttribute('aria-activedescendant', '');
  }

  function selectCountry(code, name) {
    countryHidden.value = code;
    cbInput.value = name;
    closeList();
  }

  cbList.addEventListener('mousedown', function(e) {
    var opt = e.target.closest('.cb-opt');
    if (!opt) return;
    e.preventDefault();
    selectCountry(opt.getAttribute('data-code'), opt.textContent);
  });

  cbInput.addEventListener('focus', function() {
    openList();
  });

  cbInput.addEventListener('input', function() {
    openList();
  });

  cbInput.addEventListener('keydown', function(e) {
    if (!cbList.classList.contains('is-open')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openList();
        return;
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, visibleOpts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < visibleOpts.length) {
        var opt = visibleOpts[activeIdx];
        selectCountry(opt.getAttribute('data-code'), opt.textContent);
      }
    } else if (e.key === 'Escape') {
      closeList();
    }
  });

  cbInput.addEventListener('blur', function() {
    setTimeout(function() {
      if (!cbWrap.contains(document.activeElement)) {
        if (countryHidden.value) {
          var found = COUNTRIES.filter(function(e) { return e.c === countryHidden.value; })[0];
          if (found) cbInput.value = found.n;
        } else {
          cbInput.value = '';
        }
        closeList();
      }
    }, 150);
  });

  // ===== Populate tier dropdown =====
  TIERS.forEach(function (t) {
    var opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label + ' (' + t.desc + ')';
    tierSelect.appendChild(opt);
  });

  // ===== Validation =====
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
    if (!countryHidden.value) {
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

  // ===== Lead capture =====
  var leadCaptured = false;
  function captureLead() {
    if (leadCaptured) return;
    leadCaptured = true;
    var payload = {
      email: document.getElementById('email').value.trim(),
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      business_name: document.getElementById('business_name').value.trim(),
      country: countryHidden.value,
      membership_class: 'full',
      company_website: document.getElementById('company_website').value
    };
    fetch(apiURL('/capture-lead'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  // ===== Step 1: Submit application =====
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
      country: countryHidden.value,
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

  // ===== Step 2: Verify code =====
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
