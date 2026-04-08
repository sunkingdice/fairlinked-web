(function () {
  'use strict';

  var donateForm = document.getElementById('donate-form');
  if (!donateForm) return;

  var statusEl = document.getElementById('donate-status');
  var stripeBtn = document.getElementById('pay-stripe');
  var customInput = document.getElementById('donate_custom_amount');
  var apiBase = (document.body.getAttribute('data-api-base') || '').trim().replace(/\/$/, '');

  function apiURL(path) {
    return apiBase ? (apiBase + path) : ('/api' + path);
  }

  function eurFmt(cents) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(cents / 100);
  }

  // --- Progress bar ---
  function loadProgress() {
    fetch(apiURL('/donation-progress'))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var raised = d.raised || 0;
        var goal = d.goal || 1;
        var pct = Math.min(100, (raised / goal) * 100);
        var fill = document.getElementById('progress-fill');
        var raisedEl = document.getElementById('progress-raised');
        var goalEl = document.getElementById('progress-goal');
        if (fill) fill.style.width = pct.toFixed(1) + '%';
        if (raisedEl) raisedEl.textContent = eurFmt(raised) + ' raised';
        if (goalEl) goalEl.textContent = 'Goal: ' + eurFmt(goal);
      })
      .catch(function () {});
  }

  // --- Amount / interval ---
  function getAmount() {
    var checked = document.querySelector('input[name="donate_amount"]:checked');
    if (!checked) return 0;
    if (checked.value === 'custom') {
      return parseInt(customInput.value, 10) || 0;
    }
    return parseInt(checked.value, 10);
  }

  function getInterval() {
    var checked = document.querySelector('input[name="donate_interval"]:checked');
    return checked ? checked.value : 'monthly';
  }

  document.querySelectorAll('input[name="donate_amount"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (r.value === 'custom') customInput.focus();
    });
  });

  if (customInput) {
    customInput.addEventListener('input', function () {
      var cr = document.querySelector('input[name="donate_amount"][value="custom"]');
      if (cr) cr.checked = true;
    });
    customInput.addEventListener('focus', function () {
      var cr = document.querySelector('input[name="donate_amount"][value="custom"]');
      if (cr) cr.checked = true;
    });
  }

  // --- Stripe pay ---
  stripeBtn.addEventListener('click', function () {
    var amount = getAmount();
    if (amount < 1) {
      statusEl.textContent = 'Please choose an amount.';
      statusEl.className = 'status-msg err';
      return;
    }
    statusEl.textContent = '';
    statusEl.className = 'status-msg';
    stripeBtn.disabled = true;

    fetch(apiURL('/donations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount, interval: getInterval() })
    })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
        return r.json();
      })
      .then(function (j) {
        if (j.checkout_url) {
          if (j.donation_id) {
            try { localStorage.setItem('fairlinked_donation_id', j.donation_id); } catch (e) {}
          }
          window.location.href = j.checkout_url;
        }
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not start payment: ' + err.message;
        statusEl.className = 'status-msg err';
      })
      .finally(function () {
        stripeBtn.disabled = false;
      });
  });

  // --- Bitcoin ---
  var btcBtn = document.getElementById('pay-btc');
  var btcPanel = document.getElementById('btc-panel');
  var btcAddress = document.getElementById('btc-address');
  var btcCopied = document.getElementById('btc-copied');

  if (btcBtn && btcPanel) {
    btcBtn.addEventListener('click', function () {
      btcPanel.hidden = !btcPanel.hidden;
    });
  }

  if (btcAddress) {
    btcAddress.addEventListener('click', function () {
      var addr = btcAddress.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(addr).then(function () {
          if (btcCopied) btcCopied.textContent = 'Copied to clipboard';
          setTimeout(function () { if (btcCopied) btcCopied.textContent = ''; }, 3000);
        });
      }
    });
  }

  // --- Payment return ---
  var urlParams = new URLSearchParams(window.location.search);
  var paymentResult = urlParams.get('payment');

  if (paymentResult === 'success') {
    var donationId = null;
    try { donationId = localStorage.getItem('fairlinked_donation_id'); } catch (e) {}
    if (donationId) {
      fetch(apiURL('/donations/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation_id: donationId })
      }).catch(function () {});
      try { localStorage.removeItem('fairlinked_donation_id'); } catch (e) {}
    }
    donateForm.style.display = 'none';
    document.getElementById('thank-you').hidden = false;
    if (window.history.replaceState) window.history.replaceState({}, '', window.location.pathname);
  } else if (paymentResult === 'cancelled') {
    statusEl.textContent = 'Payment was cancelled. You can try again anytime.';
    statusEl.className = 'status-msg err';
    if (window.history.replaceState) window.history.replaceState({}, '', window.location.pathname);
  }

  loadProgress();
})();
