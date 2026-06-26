/* =========================================================
   Ragic 公開內容串接：最新消息 / 公告 / 法令訊息
   - 不需要 API key，只讀公開表單資料
   - config.content.url 留空時，保留 HTML 內的備用內容
   ========================================================= */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var contentCfg = cfg.content || {};
  var sourceUrl = (contentCfg.url || "").trim();
  if (!sourceUrl) return;

  var fields = contentCfg.fields || {};
  var fieldNames = {
    date: fields.date || "日期",
    section: fields.section || "區塊",
    type: fields.type || "類別",
    title: fields.title || "標題",
    summary: fields.summary || "摘要",
    content: fields.content || "內容",
    url: fields.url || "連結",
    attachment: fields.attachment || "附件",
    pinned: fields.pinned || "置頂",
    visible: fields.visible || "顯示",
    order: fields.order || "排序"
  };

  function value(row, name) {
    return (row && row[name] != null) ? String(row[name]).trim() : "";
  }

  function isYes(text) {
    return /^(是|Y|YES|TRUE|1|置頂)$/i.test(String(text || "").trim());
  }

  function isHidden(text) {
    return /^(否|N|NO|FALSE|0|隱藏)$/i.test(String(text || "").trim());
  }

  function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim().replace(/&amp;/g, "&");
    if (isRagicFileToken(url) && getRagicAccountName()) {
      return getSourceOrigin() + "/sims/file.jsp?a=" + encodeURIComponent(getRagicAccountName()) + "&f=" + encodeURIComponent(url);
    }
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "https:" + url;
    if (/^\//.test(url)) return getSourceOrigin() + url;
    if (/^mailto:|^tel:/i.test(url)) return url;
    return url;
  }

  function getSourceOrigin() {
    var cleanUrl = /^https?:\/\//i.test(sourceUrl) ? sourceUrl : "https://" + sourceUrl;
    var match = cleanUrl.match(/^https?:\/\/[^/]+/i);
    return match ? match[0] : "";
  }

  function getRagicAccountName() {
    var cleanUrl = /^https?:\/\//i.test(sourceUrl) ? sourceUrl : "https://" + sourceUrl;
    var path = cleanUrl.split("?")[0].replace(/^https?:\/\/[^/]+\//i, "");
    return path.split("/")[0] || "";
  }

  function isRagicFileToken(text) {
    return /^[^@\/\\\s]+@[^@\/\\]+\.[A-Za-z0-9]{2,8}$/i.test(String(text || "").trim());
  }

  function buildDetailUrl(row, fallbackId) {
    var id = value(row, "_ragicId") || fallbackId;
    if (!id && id !== 0) return "";
    return "announcement-detail.html?id=" + encodeURIComponent(id);
  }

  function normalizeAttachment(raw) {
    if (raw == null) return "";
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i += 1) {
        var fromArray = normalizeAttachment(raw[i]);
        if (fromArray) return fromArray;
      }
      return "";
    }
    if (typeof raw === "object") {
      var preferred = ["url", "href", "link", "downloadUrl", "download_url", "file", "path"];
      for (var p = 0; p < preferred.length; p += 1) {
        if (raw[preferred[p]]) {
          var fromKey = normalizeAttachment(raw[preferred[p]]);
          if (fromKey) return fromKey;
        }
      }
      var keys = Object.keys(raw);
      for (var k = 0; k < keys.length; k += 1) {
        var fromObject = normalizeAttachment(raw[keys[k]]);
        if (fromObject) return fromObject;
      }
      return "";
    }

    var text = String(raw).trim();
    if (!text) return "";
    try {
      var parsed = JSON.parse(text);
      var fromJson = normalizeAttachment(parsed);
      if (fromJson) return fromJson;
    } catch (e) {
      /* 不是 JSON 時，繼續用文字解析。 */
    }

    var hrefMatch = text.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) return normalizeUrl(hrefMatch[1]);
    var urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) return normalizeUrl(urlMatch[0]);
    var pathMatch = text.match(/\/[^\s"'<>]+/);
    if (pathMatch) return normalizeUrl(pathMatch[0]);
    if (isRagicFileToken(text)) return normalizeUrl(text);
    if (/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|zip)(\?.*)?$/i.test(text)) return normalizeUrl(text);
    return "";
  }

  function normalizeDate(text) {
    if (!text) return "";
    return text.replace(/\//g, "-");
  }

  function dateValue(text) {
    var normalized = normalizeDate(text);
    var time = Date.parse(normalized);
    return isNaN(time) ? 0 : time;
  }

  function getRowList(data) {
    return Object.keys(data || {}).map(function (key) {
      var row = data[key] || {};
      var linkUrl = normalizeUrl(value(row, fieldNames.url));
      var attachmentUrl = normalizeAttachment(row[fieldNames.attachment]);
      var detailUrl = buildDetailUrl(row, key);
      return {
        id: key,
        date: value(row, fieldNames.date),
        section: value(row, fieldNames.section),
        type: value(row, fieldNames.type),
        title: value(row, fieldNames.title) || value(row, "_index_title_"),
        summary: value(row, fieldNames.summary),
        detailUrl: detailUrl,
        url: linkUrl,
        actionUrl: detailUrl || attachmentUrl || linkUrl,
        hasAttachment: !!attachmentUrl,
        pinned: isYes(value(row, fieldNames.pinned)),
        hidden: isHidden(value(row, fieldNames.visible)),
        order: parseInt(value(row, fieldNames.order), 10) || 9999,
        raw: row
      };
    }).filter(function (item) {
      return item.title && !item.hidden;
    }).sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return dateValue(b.date) - dateValue(a.date);
    });
  }

  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var callbackName = "__bsmaRagicContent" + Date.now() + Math.floor(Math.random() * 1000);
      var script = document.createElement("script");
      var timeout = window.setTimeout(function () {
        cleanup();
        reject(new Error("Ragic content request timed out"));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data || {});
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("Ragic content request failed"));
      };
      script.src = buildApiUrl(url, callbackName);
      document.head.appendChild(script);
    });
  }

  function buildApiUrl(url, callbackName) {
    var cleanUrl = /^https?:\/\//i.test(url) ? url : "https://" + url;
    cleanUrl = cleanUrl.split("?")[0];
    return cleanUrl + "?api&callback=" + encodeURIComponent(callbackName);
  }

  function matchesSection(item, sectionList, includePinned) {
    if (includePinned && item.pinned) return true;
    if (!sectionList.length) return true;
    return sectionList.indexOf(item.section) !== -1;
  }

  function getSectionList(el) {
    return (el.getAttribute("data-ragic-section") || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function createText(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text || "";
    return el;
  }

  function createNewsItem(item) {
    var li = document.createElement("li");
    li.appendChild(createText("span", "news-date", normalizeDate(item.date)));
    var link = document.createElement("a");
    link.href = item.detailUrl || item.url || "#";
    if (link.href && link.getAttribute("href") !== "#") {
      link.target = /^https?:\/\//i.test(link.getAttribute("href")) ? "_blank" : "";
      if (link.target) link.rel = "noopener";
    }
    link.textContent = item.title;
    li.appendChild(link);
    li.appendChild(createText("span", "news-type", item.type || item.section));
    return li;
  }

  function renderList(el, rows) {
    var sections = getSectionList(el);
    var includePinned = el.getAttribute("data-ragic-pinned") === "true";
    var limit = parseInt(el.getAttribute("data-ragic-limit"), 10) || 0;
    var selected = rows.filter(function (row) {
      return matchesSection(row, sections, includePinned);
    });
    if (limit > 0) selected = selected.slice(0, limit);
    if (!selected.length) return;
    el.innerHTML = "";
    selected.forEach(function (item) {
      el.appendChild(createNewsItem(item));
    });
  }

  function renderTable(table, rows) {
    var sections = getSectionList(table);
    var limit = parseInt(table.getAttribute("data-ragic-limit"), 10) || 0;
    var selected = rows.filter(function (row) {
      return matchesSection(row, sections, false);
    });
    if (limit > 0) selected = selected.slice(0, limit);
    if (!selected.length) return;

    var tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    selected.forEach(function (item) {
      var tr = document.createElement("tr");
      var date = document.createElement("td");
      date.textContent = normalizeDate(item.date);
      var type = document.createElement("td");
      var badge = createText("span", "status s-pending", item.type || item.section);
      type.appendChild(badge);
      var title = document.createElement("td");
      var titleLink = document.createElement("a");
      titleLink.href = item.detailUrl || item.url || "#";
      titleLink.textContent = item.title;
      if (/^https?:\/\//i.test(titleLink.getAttribute("href"))) {
        titleLink.target = "_blank";
        titleLink.rel = "noopener";
      }
      title.appendChild(titleLink);
      var linkCell = document.createElement("td");
      var link = document.createElement("a");
      link.href = item.actionUrl || "#";
      link.textContent = item.actionUrl ? (item.detailUrl ? "開啟" : (item.hasAttachment ? "下載" : "開啟")) : "待上傳";
      if (/^https?:\/\//i.test(item.actionUrl)) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      linkCell.appendChild(link);
      tr.appendChild(date);
      tr.appendChild(type);
      tr.appendChild(title);
      tr.appendChild(linkCell);
      tbody.appendChild(tr);
    });
  }

  function init(rows) {
    document.querySelectorAll("[data-ragic-list]").forEach(function (el) {
      renderList(el, rows);
    });
    document.querySelectorAll("[data-ragic-table]").forEach(function (el) {
      renderTable(el, rows);
    });
  }

  jsonp(sourceUrl)
    .then(function (data) { init(getRowList(data)); })
    .catch(function () {
      /* 保留 HTML 內的備用內容即可。 */
    });
})();
