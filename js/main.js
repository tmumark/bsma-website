/* =========================================================
   共用：標頭 / 選單 / 頁尾 注入，行動版選單
   每個頁面只需放 <div id="site-header"></div> 與
   <div id="site-footer"></div>，並在 <body> 加 data-page="xxx"
   ========================================================= */
(function () {
  if (/\/index(?:\.html)?$/.test(window.location.pathname)) {
    window.history.replaceState(null, "", window.location.pathname.replace(/\/index(?:\.html)?$/, "/") + window.location.search + window.location.hash);
  }

  var cfg = window.SITE_CONFIG || {};
  var page = document.body.getAttribute("data-page") || "";

  var LOGO = '<img class="logo logo-img" src="assets/logo-bsma.jpg" alt="' + (cfg.orgName || "建築物安全管理協會") + '">';

  var NAV = [
    { id: "home",    label: "首頁",       href: "./" },
    { id: "about",   label: "關於本會",   href: "about.html" },
    { id: "news",    label: "最新消息",   href: "news.html" },
    { id: "notice",  label: "公告訊息",   href: "announcements.html" },
    { id: "search",  label: "案件查詢", href: "search.html" },
    { id: "contact", label: "聯絡我們",   href: "contact.html" }
  ];

  /* ---------- 標頭 ---------- */
  function buildHeader() {
    var navItems = NAV.map(function (n) {
      var active = n.id === page ? ' class="active"' : "";
      return '<li><a href="' + n.href + '"' + active + '>' + n.label + "</a></li>";
    }).join("");

    return '' +
      '<div class="topbar"><div class="container">' +
        '<div class="tb-left">' +
          '<span>電話：' + (cfg.contact ? cfg.contact.phone : "") + '</span>' +
          '<span>信箱：' + (cfg.contact ? cfg.contact.email : "") + '</span>' +
        '</div>' +
        '<div class="tb-right">' +
          '<a href="search.html">案件查詢</a>' +
          '<a href="contact.html">聯絡我們</a>' +
        '</div>' +
      '</div></div>' +
      '<header class="site-header"><div class="container header-inner">' +
        '<a class="brand" href="./">' + LOGO + '</a>' +
        '<button class="nav-toggle" aria-label="選單">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<nav class="main-nav"><ul>' + navItems + '</ul></nav>' +
      '</div></header>';
  }

  /* ---------- 頁尾 ---------- */
  function buildFooter() {
    var c = cfg.contact || {};
    var navLinks = NAV.map(function (n) {
      return '<li><a href="' + n.href + '">' + n.label + "</a></li>";
    }).join("");

    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer-cols">' +
        '<div>' +
          '<div class="foot-brand">' + LOGO + '</div>' +
          '<p>本會為依法設立、非以營利為目的之社會團體，提供建築物公共安全檢查申報、法令資訊、教育訓練、公益宣導與申報服務資訊。</p>' +
        '</div>' +
        '<div>' +
          '<h4>快速連結</h4>' +
          '<ul>' + navLinks + '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>聯絡資訊</h4>' +
          '<p>會址：' + (c.address || "") + '</p>' +
          '<p>電話：' + (c.phone || "") + '</p>' +
          '<p>傳真：' + (c.fax || "") + '</p>' +
          '<p>信箱：' + (c.email || "") + '</p>' +
          '<p>時間：' + (c.hours || "") + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">© ' + getYear() + ' ' + (cfg.orgName || "") +
        ' Building Public Safety Association. 版權所有。</div>' +
    '</div></footer>';
  }

  function getYear() {
    try { return new Date().getFullYear(); } catch (e) { return "2026"; }
  }

  /* ---------- 注入 ---------- */
  var h = document.getElementById("site-header");
  if (h) h.innerHTML = buildHeader();
  var f = document.getElementById("site-footer");
  if (f) f.innerHTML = buildFooter();

  /* 文件標題 */
  if (cfg.orgName && !document.title.indexOf) { /* noop */ }

  /* ---------- 行動版選單開關 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }
})();
