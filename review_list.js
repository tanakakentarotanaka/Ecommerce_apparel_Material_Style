/**
 * Fashion BI Review List Visualization
 * 顧客属性と返品ステータスを強調したレビュー一覧
 * Update: Removed Title field as requested. Background is white.
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 14,
      display: "number",
      section: "Style"
    },
    primary_color: {
      type: "string",
      label: "Primary Color",
      default: "#AA7777",
      display: "color",
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#333333",
      display: "color",
      section: "Style"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .review-container {
          font-family: 'Inter', sans-serif;
          height: 100%;
          overflow-y: auto;
          padding: 10px;
          box-sizing: border-box;
          background-color: #ffffff; /* 背景色：白 */
        }

        .review-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          /* 境界線を少し濃くする */
          border: 1px solid #E0E0E0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s;
        }

        .review-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* ヘッダーエリア（評価・日付・属性タグ） */
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center; /* 中央揃えに調整 */
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
          border-bottom: 1px solid #f9f9f9; /* タイトルがないので軽く区切り線を追加 */
          padding-bottom: 10px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .star-rating {
          color: #FFC107;
          letter-spacing: 2px;
          font-size: 16px;
        }

        .review-date {
          font-size: 12px;
          color: #999;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        /* 属性タグ */
        .attribute-tag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          background-color: #F5F5F5;
          color: #555;
          font-weight: 500;
        }

        /* 返品ステータスタグ */
        .return-tag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
        }

        .return-tag.returned {
          background-color: #FFEBEE;
          color: #C62828;
        }

        .return-tag.kept {
          background-color: #E8F5E9;
          color: #2E7D32;
        }

        /* レビュー本文 */
        .review-body {
          font-size: 14px;
          line-height: 1.6;
          color: #444;
          position: relative;
          margin-top: 8px; /* ヘッダーとの間隔 */
        }

        .highlight {
          font-weight: 700;
          color: #AA7777;
          background-color: rgba(170, 119, 119, 0.1);
          padding: 0 2px;
        }

        .read-more-btn {
          color: #AA7777;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          display: inline-block;
          border: none;
          background: none;
          padding: 0;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      </style>
      <div id="viz-root" class="review-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#viz-root");
    this.clearErrors();

    // データチェック
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="no-data">レビューデータがありません。</div>`;
      done();
      return;
    }

    // フィールドマッピング（順序変更）
    // 1. 本文 (Body)
    // 2. 投稿日 (Date)
    // 3. 属性: 世代 (Generation)
    // 4. 属性: 性別 (Gender)
    // 5. 属性: 返品ステータス (Return Status)
    // Meas 1: 評価スコア (Rating)

    const dims = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dims.length < 2) {
      this.addError({ title: "Data Error", message: "少なくとも本文と日付のディメンションが必要です。" });
      return;
    }

    const bodyField = dims[0].name;
    const dateField = dims[1].name;

    // オプショナル属性
    const genField = dims.length > 2 ? dims[2].name : null;
    const genderField = dims.length > 3 ? dims[3].name : null;
    const returnField = dims.length > 4 ? dims[4].name : null;

    const ratingField = measures.length > 0 ? measures[0].name : null;

    container.innerHTML = "";

    const generateStars = (value) => {
      const score = Math.round(parseFloat(value) || 0);
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        stars += (i <= score) ? "★" : "☆";
      }
      return stars;
    };

    const highlightKeywords = (text) => {
      if (!text) return "";
      const keywords = ["サイズ", "色", "素材", "丈", "フィット", "size", "color", "fit", "material"];
      let highlighted = text;
      keywords.forEach(kw => {
        const regex = new RegExp(`(${kw})`, "gi");
        highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
      });
      return highlighted;
    };

    data.forEach(row => {
      const bodyRaw = LookerCharts.Utils.textForCell(row[bodyField]);
      const date = LookerCharts.Utils.textForCell(row[dateField]);

      const gen = genField ? LookerCharts.Utils.textForCell(row[genField]) : "";
      const gender = genderField ? LookerCharts.Utils.textForCell(row[genderField]) : "";
      const returnStatus = returnField ? LookerCharts.Utils.textForCell(row[returnField]) : "";

      const rating = ratingField ? row[ratingField].value : 0;

      let returnClass = "kept";
      if (returnStatus.toLowerCase().includes("return") || returnStatus.includes("返品")) {
        returnClass = "returned";
      }

      const card = document.createElement("div");
      card.className = "review-card";

      const isLong = bodyRaw.length > 120;
      const shortBody = isLong ? bodyRaw.substring(0, 120) + "..." : bodyRaw;
      const displayBody = highlightKeywords(shortBody);

      // HTML生成（タイトル部分を削除）
      card.innerHTML = `
        <div class="review-header">
          <div class="header-left">
            <div class="star-rating">${generateStars(rating)}</div>
            <div class="review-date">${date}</div>
          </div>
          <div class="header-right">
            ${gen ? `<span class="attribute-tag">${gen}</span>` : ""}
            ${gender ? `<span class="attribute-tag">${gender}</span>` : ""}
            ${returnStatus ? `<span class="return-tag ${returnClass}">${returnStatus}</span>` : ""}
          </div>
        </div>

        <div class="review-body">
          <span class="body-text">${displayBody}</span>
          ${isLong ? `<button class="read-more-btn">Read more</button>` : ""}
        </div>
      `;

      if (isLong) {
        const btn = card.querySelector(".read-more-btn");
        const bodySpan = card.querySelector(".body-text");

        btn.onclick = (e) => {
          e.stopPropagation();
          if (btn.innerText === "Read more") {
            bodySpan.innerHTML = highlightKeywords(bodyRaw);
            btn.innerText = "Show less";
          } else {
            bodySpan.innerHTML = displayBody;
            btn.innerText = "Read more";
          }
        };
      }

      container.appendChild(card);
    });

    done();
  }
});
