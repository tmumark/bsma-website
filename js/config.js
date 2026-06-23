/* =========================================================
   全站設定檔  —  你只要改這裡
   ========================================================= */
window.SITE_CONFIG = {

  /* 協會名稱（顯示在標頭、頁尾、標題列） */
  orgName:      "建築物安全管理協會",
  orgNameEn:    "Building Safety Management Association",
  orgShort:     "建安協會",

  /* 聯絡資訊 */
  contact: {
    address: "台北市信義區基隆路二段33號 4F-3",
    phone:   "02-2737-3900",
    fax:     "02-2737-3901",
    email:   "service@example.org.tw",
    hours:   "週一至週五 09:00–18:00（例假日休）"
  },

  /* ---------------------------------------------------------
     案件查詢資料來源（Google Sheet 展示版）
     --------------------------------------------------------
     步驟請見 README.md：
     1. 在 Google Sheet 用 Apps Script 部署「網頁應用程式」
     2. 把部署後的網址貼到下面 apiUrl
     正式頁已改用 Ragic；此設定只給 search-sheet.html 展示版使用。
     若 apiUrl 留空字串 ""，展示版會使用 data/sample-cases.json。
     --------------------------------------------------------- */
  apiUrl: "",

  /* ---------------------------------------------------------
     Ragic 會友及案件查詢嵌入設定（search.html 使用）
     --------------------------------------------------------
     在 Ragic 表單按「工具 → 在你的網站嵌入此表單」，Ragic 會給一段
     嵌入碼，把碼中的 ragic_url / ragic_feature / exactMatch 填到這裡。
     url 留空字串("")會改顯示設定指引。詳見 README-Ragic.md。
     --------------------------------------------------------- */
  ragic: {
    url:           "ap16.ragic.com/PicturesTest2026/-/5",  // 嵌入碼中的 ragic_url
    feature:       "query",   // query = 查詢介面（建議）
    exactMatch:    true,      // 精確比對（保護個資，建議 true）
    showSheetName: true       // 是否顯示表單名稱
  },

  /* 是否啟用驗證碼（建議開啟，防止機器人大量查詢） */
  enableCaptcha: true
};
