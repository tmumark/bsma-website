/* =========================================================
   Ragic 公告內容頁
   ========================================================= */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var contentCfg = cfg.content || {};
  var sourceUrl = (contentCfg.url || "").trim();
  var container = document.getElementById("announcementDetail");
  if (!container) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");

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
    visible: fields.visible || "顯示"
  };

  function value(row, name) {
    return (row && row[name] != null) ? String(row[name]).trim() : "";
  }

  function isHidden(text) {
    return /^(否|N|NO|FALSE|0|隱藏)$/i.test(String(text || "").trim());
  }

  function cleanSourceUrl() {
    return (/^https?:\/\//i.test(sourceUrl) ? sourceUrl : "https://" + sourceUrl).split("?")[0].replace(/\/+$/, "");
  }

  function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "https:" + url;
    if (/^\//.test(url)) return cleanSourceUrl().match(/^https?:\/\/[^/]+/i)[0] + url;
    if (/^mailto:|^tel:/i.test(url)) return url;
    return url;
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
      var keys = ["url", "href", "link", "downloadUrl", "download_url", "file", "path"];
      for (var k = 0; k < keys.length; k += 1) {
        if (raw[keys[k]]) {
          var fromKey = normalizeAttachment(raw[keys[k]]);
          if (fromKey) return fromKey;
        }
      }
      return "";
    }
    var text = String(raw).trim();
    if (!text) return "";
    try {
      var parsed = JSON.parse(text);
      var fromJson = normalizeAttachment(parsed);
      if (fromJson) return fromJson;
    } catch (e) {}
    var hrefMatch = text.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) return normalizeUrl(hrefMatch[1]);
    var urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) return normalizeUrl(urlMatch[0]);
    var pathMatch = text.match(/\/[^\s"'<>]+/);
    if (pathMatch) return normalizeUrl(pathMatch[0]);
    return "";
  }

  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var callbackName = "__bsmaAnnouncement" + Date.now() + Math.floor(Math.random() * 1000);
      var script = document.createElement("script");
      var timeout = window.setTimeout(function () {
        cleanup();
        reject(new Error("Ragic request timed out"));
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
        reject(new Error("Ragic request failed"));
      };
      script.src = url + "?api&callback=" + encodeURIComponent(callbackName);
      document.head.appendChild(script);
    });
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function renderError(title, text) {
    container.innerHTML = "";
    var box = createEl("div", "state-box");
    box.appendChild(createEl("h3", "", title));
    box.appendChild(createEl("p", "", text));
    container.appendChild(box);
  }

  function render(row) {
    if (!row || isHidden(value(row, fieldNames.visible))) {
      renderError("找不到公告", "此公告不存在或目前未開放顯示。");
      return;
    }

    var title = value(row, fieldNames.title) || value(row, "_index_title_") || "公告內容";
    var summary = value(row, fieldNames.summary);
    var content = value(row, fieldNames.content);
    var attachmentUrl = normalizeAttachment(row[fieldNames.attachment]);
    var linkUrl = normalizeUrl(value(row, fieldNames.url));

    document.title = title + "｜建築物安全管理協會";
    container.innerHTML = "";

    var head = createEl("header", "announcement-detail-head");
    var meta = createEl("div", "announcement-detail-meta");
    meta.appendChild(createEl("span", "", value(row, fieldNames.date).replace(/\//g, "-")));
    meta.appendChild(createEl("span", "", value(row, fieldNames.section)));
    meta.appendChild(createEl("span", "", value(row, fieldNames.type)));
    head.appendChild(meta);
    head.appendChild(createEl("h2", "", title));
    if (summary) head.appendChild(createEl("p", "", summary));
    container.appendChild(head);

    var body = createEl("div", "announcement-detail-body");
    body.textContent = content || "本公告尚未填寫詳細內容。";
    container.appendChild(body);

    var actions = createEl("div", "announcement-detail-actions");
    if (attachmentUrl) {
      var attachment = createEl("a", "btn btn-primary", "下載附件");
      attachment.href = attachmentUrl;
      attachment.target = "_blank";
      attachment.rel = "noopener";
      actions.appendChild(attachment);
    }
    if (linkUrl && !/^(news|announcements)\.html$/i.test(linkUrl)) {
      var related = createEl("a", "btn btn-outline", "相關連結");
      related.href = linkUrl;
      if (/^https?:\/\//i.test(linkUrl)) {
        related.target = "_blank";
        related.rel = "noopener";
      }
      actions.appendChild(related);
    }
    var back = createEl("a", "btn btn-ghost", "返回公告列表");
    back.href = "announcements.html";
    actions.appendChild(back);
    container.appendChild(actions);
  }

  if (!sourceUrl || !id) {
    renderError("找不到公告", "缺少公告資料來源或公告編號。");
    return;
  }

  jsonp(cleanSourceUrl() + "/" + encodeURIComponent(id))
    .then(function (data) {
      var row = data[id] || data[Object.keys(data)[0]];
      render(row);
    })
    .catch(function () {
      renderError("公告載入失敗", "請稍後再試，或聯絡本會服務人員。");
    });
})();
