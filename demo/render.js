(function () {
  var page = window.DEMO_PAGE;
  if (!page) return;
  fetch('/demo-data.json?t=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (page === 'dashboard' && d.dashboard) renderDashboard(d.dashboard);
      if (page === 'sales' && d.sales) renderSales(d.sales);
      if (page === 'pdf' && d.pdf) renderPdf(d.pdf);
      if (page === 'form' && d.form) renderForm(d.form);
      if (page === 'doctor' && d.doctor) renderDoctor(d.doctor);
    })
    .catch(function () {});

  function renderDashboard(s) {
    var u = document.querySelector('.topbar-user');
    if (u && s.owner) u.textContent = s.owner;
    document.querySelectorAll('.dash-card .kpi-num').forEach(function (el, i) {
      if (s.kpis && s.kpis[i]) el.textContent = s.kpis[i].v;
    });
    document.querySelectorAll('.dash-card .kpi-label').forEach(function (el, i) {
      if (s.kpis && s.kpis[i]) el.textContent = s.kpis[i].label;
    });
    var steps = document.querySelectorAll('.funnel-step');
    (s.funnel || []).forEach(function (f, i) {
      if (!steps[i]) return;
      var spans = steps[i].querySelectorAll('span');
      if (spans[0]) spans[0].textContent = f.stage;
      if (spans[1]) spans[1].textContent = f.count;
      if (spans[2]) spans[2].textContent = f.prev === '—' ? '—' : 'Önceki: ' + f.prev;
      if (spans[3]) spans[3].textContent = 'Toplam: ' + f.total;
    });
  }

  function renderSales(s) {
    var u = document.querySelector('.topbar-user');
    if (u && s.user) u.textContent = s.user;
    var code = document.querySelector('.form-bar code');
    if (code && s.formUrl) { code.textContent = s.formUrl; code.title = s.formUrl; }
  }

  function renderPdf(s) {
    var clinic = document.getElementById('pdf-clinic');
    if (clinic && s.clinic) clinic.textContent = s.clinic;
    var footer = document.getElementById('pdf-clinic-footer');
    if (footer && s.clinic) footer.textContent = s.clinic;
    var loc = document.getElementById('pdf-location');
    if (loc && s.location) loc.textContent = s.location;
    var patient = document.getElementById('pdf-patient');
    if (patient && s.patient) patient.textContent = s.patient + (s.country ? ' · ' + s.country : '');
    var price = document.getElementById('pdf-price');
    if (price && s.price) price.textContent = s.price;
  }

  function renderForm(s) {
    var h = document.querySelector('.form-header h1');
    if (h && s.clinic) h.textContent = s.clinic;
    var t = document.querySelector('.form-header h2');
    if (t && s.title) t.textContent = s.title;
    var p = document.querySelector('.form-header p');
    if (p && s.subtitle) p.textContent = s.subtitle;
  }

  function renderDoctor(s) {
    var u = document.querySelector('.topbar-user');
    if (u && s.user) u.textContent = s.user;
    var n = document.querySelector('.patient-name');
    if (n && s.patient) n.textContent = s.patient;
    var tr = document.querySelector('.patient-treatment');
    if (tr && s.treatment) tr.textContent = s.treatment + ' · ' + (s.country || '');
    var st = document.querySelector('.status-badge');
    if (st && s.status) st.textContent = s.status;
  }
})();
