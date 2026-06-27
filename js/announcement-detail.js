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

  function sourceOrigin() {
    var match = cleanSourceUrl().match(/^https?:\/\/[^/]+/i);
    return match ? match[0] : "https://www.ragic.com";
  }

  function ragicAccountName() {
    var path = cleanSourceUrl().replace(/^https?:\/\/[^/]+\//i, "");
    return path.split("/")[0] || "";
  }

  function isRagicFileToken(text) {
    return /^[^@\/\\\s]+@[^@\/\\]+\.[A-Za-z0-9]{2,8}$/i.test(String(text || "").trim());
  }

  function filenameFromRagicToken(text) {
    var token = String(text || "").trim();
    if (!isRagicFileToken(token)) return "";
    var filename = token.split("@").slice(1).join("@");
    try { filename = decodeURIComponent(filename); } catch (e) {}
    return filename;
  }

  function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim().replace(/&amp;/g, "&");
    if (isRagicFileToken(url) && ragicAccountName()) {
      return sourceOrigin() + "/sims/file.jsp?a=" + encodeURIComponent(ragicAccountName()) + "&f=" + encodeURIComponent(url);
    }
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "https:" + url;
    if (/^\//.test(url)) return sourceOrigin() + url;
    if (/^mailto:|^tel:/i.test(url)) return url;
    return url;
  }

  function cleanAttachmentName(text) {
    var value = String(text || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
    var decoder = document.createElement("textarea");
    decoder.innerHTML = value;
    return decoder.value.replace(/\s+/g, " ").trim();
  }

  function filenameFromUrl(url, fallback) {
    var clean = String(url || "").split("#")[0].split("?")[0];
    var filename = clean.split("/").pop() || "";
    try { filename = decodeURIComponent(filename); } catch (e) {}
    return filename || fallback || "附件";
  }

  function normalizeAttachments(raw) {
    var files = [];
    var seen = {};
    var urlKeys = ["url", "href", "link", "downloadUrl", "download_url", "file", "path"];
    var nameKeys = ["name", "filename", "fileName", "title", "label"];

    function addFile(url, name) {
      var original = String(url || "").trim();
      var normalized = normalizeUrl(url);
      if (!normalized || seen[normalized]) return;
      var label = cleanAttachmentName(name) || filenameFromRagicToken(original) || filenameFromUrl(normalized, "附件 " + (files.length + 1));
      seen[normalized] = true;
      files.push({ url: normalized, name: label });
    }

    function collect(item, hint) {
      if (item == null) return;

      if (Array.isArray(item)) {
        item.forEach(function (entry) {
          collect(entry, hint);
        });
        return;
      }

      if (typeof item === "object") {
        var name = hint || "";
        nameKeys.forEach(function (key) {
          if (item[key] && !name) name = item[key];
        });
        urlKeys.forEach(function (key) {
          if (item[key]) addFile(item[key], name);
        });
        Object.keys(item).forEach(function (key) {
          if (urlKeys.indexOf(key) === -1 && nameKeys.indexOf(key) === -1) collect(item[key], name);
        });
        return;
      }

      var text = String(item).trim();
      if (!text) return;

      if (/^[\[{]/.test(text)) {
        try {
          collect(JSON.parse(text), hint);
          return;
        } catch (e) {}
      }

      var foundHtmlLink = false;
      text.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, function (_, href, label) {
        foundHtmlLink = true;
        addFile(href, label || hint);
        return "";
      });
      text.replace(/href=["']([^"']+)["']/gi, function (_, href) {
        foundHtmlLink = true;
        addFile(href, hint);
        return "";
      });
      if (foundHtmlLink) return;

      var matched = false;
      text.replace(/(https?:\/\/[^\s"'<>，,]+|\/\/[^\s"'<>，,]+|\/[^\s"'<>，,]+)/gi, function (url) {
        matched = true;
        addFile(url, hint);
        return "";
      });
      if (matched) return;

      if (/\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|zip)(\?.*)?$/i.test(text)) addFile(text, hint);
    }

    collect(raw, "");
    return files;
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replace(/`/g, "&#96;");
  }

  function isSafeHref(url) {
    var href = String(url || "").trim();
    if (!href) return false;
    if (/^\s*javascript:/i.test(href)) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return /^(https?:|mailto:|tel:)/i.test(href);
    return true;
  }

  function renderInlineMarkdown(text) {
    var html = escapeHtml(text);

    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g, function (_, label, href) {
      var normalized = normalizeUrl(href.replace(/&amp;/g, "&"));
      if (!isSafeHref(normalized)) return label;
      var target = /^https?:\/\//i.test(normalized) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + escapeAttr(normalized) + '"' + target + ">" + label + "</a>";
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

    return html;
  }

  function parseTableRow(line) {
    var row = String(line || "").trim();
    if (row.charAt(0) === "|") row = row.slice(1);
    if (row.charAt(row.length - 1) === "|") row = row.slice(0, -1);
    return row.split("|").map(function (cell) { return cell.trim(); });
  }

  function isTableDivider(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(String(line || ""));
  }

  function isMarkdownBlockStart(line, nextLine) {
    var text = String(line || "").trim();
    if (!text) return false;
    return /^```/.test(text) ||
      /^(#{1,4})\s+/.test(text) ||
      /^[-*_]{3,}$/.test(text) ||
      /^>\s?/.test(text) ||
      /^[-*+]\s+/.test(text) ||
      /^\d+\.\s+/.test(text) ||
      (text.indexOf("|") !== -1 && isTableDivider(nextLine));
  }

  function renderMarkdown(text) {
    var lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    var html = [];

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var trimmed = line.trim();
      var match;

      if (!trimmed) continue;

      if (/^```/.test(trimmed)) {
        var codeLines = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i += 1;
        }
        html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        continue;
      }

      match = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        var level = Math.min(match[1].length + 2, 5);
        html.push("<h" + level + ">" + renderInlineMarkdown(match[2]) + "</h" + level + ">");
        continue;
      }

      if (/^[-*_]{3,}$/.test(trimmed)) {
        html.push("<hr>");
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        var quotes = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quotes.push(lines[i].trim().replace(/^>\s?/, ""));
          i += 1;
        }
        i -= 1;
        html.push("<blockquote>" + quotes.map(renderInlineMarkdown).join("<br>") + "</blockquote>");
        continue;
      }

      if (trimmed.indexOf("|") !== -1 && isTableDivider(lines[i + 1])) {
        var headers = parseTableRow(trimmed);
        var rows = [];
        i += 2;
        while (i < lines.length && lines[i].trim() && lines[i].indexOf("|") !== -1) {
          rows.push(parseTableRow(lines[i]));
          i += 1;
        }
        i -= 1;
        html.push(
          '<div class="md-table-wrap"><table><thead><tr>' +
          headers.map(function (cell) { return "<th>" + renderInlineMarkdown(cell) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (rowCells) {
            return "<tr>" + rowCells.map(function (cell, index) {
              var label = headers[index] || "";
              return '<td data-label="' + escapeAttr(label) + '">' + renderInlineMarkdown(cell) + "</td>";
            }).join("") + "</tr>";
          }).join("") +
          "</tbody></table></div>"
        );
        continue;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        var items = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
          i += 1;
        }
        i -= 1;
        html.push("<ul>" + items.map(function (item) { return "<li>" + renderInlineMarkdown(item) + "</li>"; }).join("") + "</ul>");
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        var numberItems = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          numberItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i += 1;
        }
        i -= 1;
        html.push("<ol>" + numberItems.map(function (item) { return "<li>" + renderInlineMarkdown(item) + "</li>"; }).join("") + "</ol>");
        continue;
      }

      var paragraph = [trimmed];
      while (i + 1 < lines.length && lines[i + 1].trim() && !isMarkdownBlockStart(lines[i + 1], lines[i + 2])) {
        i += 1;
        paragraph.push(lines[i].trim());
      }
      html.push("<p>" + renderInlineMarkdown(paragraph.join(" ")) + "</p>");
    }

    return html.join("");
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
    var attachments = normalizeAttachments(row[fieldNames.attachment]);
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
    body.innerHTML = renderMarkdown(content || "本公告尚未填寫詳細內容。");
    container.appendChild(body);

    if (attachments.length) {
      var attachmentBlock = createEl("section", "announcement-attachments");
      attachmentBlock.appendChild(createEl("h3", "", "附件下載"));
      var attachmentList = document.createElement("ul");
      attachments.forEach(function (file, index) {
        var item = document.createElement("li");
        var link = createEl("a", "", file.name || "附件 " + (index + 1));
        link.href = file.url;
        link.target = "_blank";
        link.rel = "noopener";
        item.appendChild(link);
        attachmentList.appendChild(item);
      });
      attachmentBlock.appendChild(attachmentList);
      container.appendChild(attachmentBlock);
    }

    var actions = createEl("div", "announcement-detail-actions");
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
