# 建築物安全管理協會網站

這是一個容易上線、容易維護的純靜態網站。正式案件管理使用 **RAGIC**，網站只負責呈現協會資訊與嵌入查詢頁，不需要自行架設後台。

## 日常維護只看這幾個檔案

| 要改什麼 | 修改檔案 |
|---|---|
| 協會名稱、電話、信箱、地址、RAGIC 查詢網址 | `js/config.js` |
| 首頁文字與服務重點 | `index.html` |
| 組織架構、查核流程、服務項目 | `about.html` |
| 最新消息、教育訓練、法令更新 | RAGIC「網站公告」表，或備用時改 `news.html` |
| 公告、表單、附件下載連結 | RAGIC「網站公告」表，或備用時改 `announcements.html` |
| 聯絡頁地圖與提示文字 | `contact.html` |

案件資料不用改網站檔案，請直接到 RAGIC 後台新增或更新。最新消息與公告也可以改由 RAGIC 管理，設定方式如下。

## 用 RAGIC 維護最新消息與公告

1. 在 RAGIC 另建一張表，建議命名為「網站公告」。
2. 匯入本資料夾內的 `網站公告_RAGIC匯入範本.csv`，或手動建立下列欄位：

   | 欄位 | 用途 |
   |---|---|
   | 日期 | 顯示在公告列表的日期，例如 `2026/06/23` |
   | 區塊 | 決定顯示位置，可填 `置頂公告`、`最新消息`、`法令訊息`、`公告訊息`、`檔案下載` |
   | 類別 | 顯示在右側的小分類，例如 `網站服務`、`法令說明`、`申報表單` |
   | 標題 | 公告或消息標題 |
   | 摘要 | 備用說明，目前首頁列表不顯示，可保留給未來版面 |
   | 連結 | 可填 `search.html`、`announcements.html` 或外部網址 |
   | 置頂 | 填 `是` 會出現在首頁置頂公告 |
   | 顯示 | 填 `是` 才顯示；填 `否` 會隱藏 |
   | 排序 | 數字越小越前面 |

3. 到 RAGIC 的「在你的網站嵌入此表單」取得 `ragic_url`，或直接複製表單網址中的 `ap16.ragic.com/帳號/-/表單編號`。
4. 打開 `js/config.js`，把網址填到：

   ```js
   content: {
     url: "ap16.ragic.com/你的帳號/-/表單編號",
     ...
   }
   ```

5. 上傳網站後，首頁、最新消息頁、公告頁會自動讀取這張表。若 `url` 留空，網站會使用 HTML 內的備用內容。

## 檔案結構

```
建安協會網站/
├─ index.html              首頁
├─ about.html              關於本會、組織分工、查核流程
├─ news.html               最新消息
├─ announcements.html      公告訊息與附件下載
├─ search.html             會友及案件查詢（RAGIC 正式頁）
├─ search-sheet.html       舊展示版，可保留備用
├─ contact.html            聯絡我們
├─ 網站公告_RAGIC匯入範本.csv  匯入 RAGIC 用的公告欄位範本
├─ assets/                 Logo、組織架構圖、流程圖
├─ css/style.css           全站樣式
├─ js/config.js            主要設定檔
├─ js/main.js              共用標頭與頁尾
├─ js/ragic-content.js     RAGIC 公告與消息串接
├─ README-Ragic.md         RAGIC 設定教學
└─ README.md               本說明
```

## RAGIC 查詢設定

目前 `js/config.js` 已填入：

```js
ragic: {
  url: "ap16.ragic.com/PicturesTest2026/-/5",
  feature: "query",
  exactMatch: true,
  showSheetName: true
}
```

日後如果 RAGIC 表單網址改了，只要把 `url` 換成新嵌入碼裡的 `ragic_url` 即可。完整設定步驟請看 `README-Ragic.md`。

## 更新消息或公告

1. 打開 `news.html` 或 `announcements.html`。
2. 複製一則既有項目。
3. 修改日期、分類、標題與摘要。
4. 如果有 PDF、DOC 或雲端檔案，把 `href="#"` 改成實際連結。

## 上線方式

這是純靜態網站，整個資料夾可直接上傳到：

- 一般虛擬主機或協會既有主機
- GitHub Pages
- Netlify / Vercel
- 任何可放 HTML、CSS、JS 的網站空間

上傳時請整包上傳，尤其不要漏掉 `assets`、`css`、`js` 三個資料夾。

## 上線前確認

- `js/config.js` 的電話、地址、信箱是否正確。
- RAGIC 表單是否允許未登入者使用查詢。
- RAGIC 是否已開啟精確比對，避免民眾列出不該看到的資料。
- 公告頁的「待上傳」連結是否改成正式附件。
- 聯絡頁 Google Maps 地址是否正確。
