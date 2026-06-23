/* =========================================================
   共用：標頭 / 選單 / 頁尾 注入，行動版選單
   每個頁面只需放 <div id="site-header"></div> 與
   <div id="site-footer"></div>，並在 <body> 加 data-page="xxx"
   ========================================================= */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var page = document.body.getAttribute("data-page") || "";

  /* 共用建築/盾牌 Logo（SVG，免外部圖檔） */
  var LOGO = '<svg class="logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M32 4 6 14v16c0 16 11 27 26 30 15-3 26-14 26-30V14L32 4z" fill="currentColor" opacity=".12"/>' +
    '<path d="M32 4 6 14v16c0 16 11 27 26 30 15-3 26-14 26-30V14L32 4z" stroke="currentColor" stroke-width="2.5" fill="none"/>' +
    '<path d="M20 44V26l12-8 12 8v18" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M26 44V32h12v12M32 18v6M14 44h36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
    '</svg>';

  var NAV = [
    { id: "home",    label: "首頁",       href: "index.html" },
    { id: "about",   label: "關於本會",   href: "about.html" },
    { id: "news",    label: "最新消息",   href: "news.html" },
    { id: "notice",  label: "公告訊息",   href: "announcements.html" },
    { id: "search",  label: "會友查詢", href: "search.html" },
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
          '<a href="search.html">會友及案件查詢</a>' +
          '<a href="contact.html">聯絡我們</a>' +
        '</div>' +
      '</div></div>' +
      '<header class="site-header"><div class="container header-inner">' +
        '<a class="brand" href="index.html">' + LOGO +
          '<span class="brand-text">' +
            '<strong>' + (cfg.orgName || "建築物公共安全協會") + '</strong>' +
            '<small>' + (cfg.orgNameEn || "") + '</small>' +
          '</span>' +
        '</a>' +
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
          '<div class="foot-brand">' + LOGO + '<strong>' + (cfg.orgName || "") + '</strong></div>' +
          '<p>本會為依法設立、非以營利為目的之社會團體，規劃辦理建築物公共安全檢查簽證及申報案件查核、進度查詢、法令諮詢、教育訓練與公益宣導服務。</p>' +
        '</div>' +
        '<div>' +
          '<h4>快速連結</h4>' +
          '<ul>' + navLinks + '</ul>' +
        '</div>' +
        '<div>' +
          '<h4>聯絡資訊</h4>' +
          '<p>會址：' + (c.address || "") + '</p>' +
          '<p>電話：' + (c.phone || "") + '</p>' +
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
