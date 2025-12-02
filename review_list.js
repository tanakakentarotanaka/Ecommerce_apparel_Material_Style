/**
 * Fashion BI Review List Visualization
 * 顧客属性と返品ステータスを強調したレビュー一覧
 * Feature: Full Customization (Shadow, Padding, Colors, Radius)
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- テキスト・基本スタイル ---
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
    },
    // --- ボックススタイル (背景・丸み・影) ---
    chart_bg_color: {
      type: "string",
      label: "Background Color",
      default: "#FFFFFF",
      display: "color",
      section: "Box Style"
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 50,
      section: "Box Style"
    },
    shadow_depth: {
      type: "number",
      label: "Shadow Depth (0=Flat)",
      default: 0, // リストはカード自体に枠線があるため、デフォルトはフラットにしておく
      display: "range",
      min: 0,
      max: 5,
      step: 1,
      section: "Box Style"
    },
    // --- 余白の設定 (位置調整) ---
    padding_left: {
      type: "number",
      label: "Padding Left (px)",
      default: 10,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
    },
    padding_right: {
      type: "number",
      label: "Padding Right (px)",
      default: 10,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
    },
    padding_vertical: {
      type: "number",
      label: "Padding Vertical (px)",
      default: 10,
      display: "range",
      min: 0,
      max: 100,
      section: "Position"
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
          box-sizing: border-box;
          /* デフォルトのボーダー（スタイルはupdateAsyncで制御） */
          border: 1px solid #E0E0E0;
          transition: all 0.3s ease;
        }

        .review-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #eee;
          transition: box-shadow 0.2s;
        }

        .review-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* ヘッダーエリア */
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
          border-bottom: 1px solid #f9f9f9;
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

        .attribute-tag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          background-color: #F5F5F5;
          color: #555;
          font-weight: 500;
        }

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

        .review-body {
          font-size: 14px;
          line-height: 1.6;
          color: #444;
          position: relative;
          margin-top: 8px;
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

    // --- 動的スタイル適用 ---

    // 1. 背景色と角丸
    container.style.backgroundColor = config.chart_bg_color;
    container.style.borderRadius = `${config.border_radius}px`;

    // 2. 余白 (Padding)
    container.style.paddingLeft = `${config.padding_left}px`;
    container.style.paddingRight = `${config.padding_right}px`;
    container.style.paddingTop = `${config.padding_vertical}px`;
    container.style.paddingBottom = `${config.padding_vertical}px`;

    // 3. 影 (Shadow)
    const depth = config.shadow_depth || 0;
    if (depth === 0) {
      container.style.boxShadow = "none";
      // 影がない時はボーダーで領域を示す（前のVizと挙動を合わせる）
      container.style.border = "1px solid #E0E0E0";
    } else {
      const y = depth * 2;
      const blur = depth * 6;
      const opacity = 0.03 + (depth * 0.02);
      container.style.boxShadow = `0 ${y}px ${blur}px rgba(0,0,0,${opacity})`;
      // 影がある時はボーダーを薄く/消す
      container.style.border = "1px solid rgba(0,0,0,0.05)";
    }
    // -----------------------

    // データチェック
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="no-data">レビューデータがありません。</div>`;
      done();
      return;
    }

    const dims = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dims.length < 2) {
      this.addError({ title: "Data Error", message: "少なくとも本文と日付のディメンションが必要です。" });
      return;
    }

    const bodyField = dims[0].name;
    const dateField = dims[1].name;

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

      // フォントサイズ設定の反映
      card.style.fontSize = `${config.font_size}px`;
      const titleSize = config.font_size + 1; // タイトルは少し大きく

      const isLong = bodyRaw.length > 120;
      const shortBody = isLong ? bodyRaw.substring(0, 120) + "..." : bodyRaw;
      const displayBody = highlightKeywords(shortBody);

      card.innerHTML = `
        <div class="review-header">
          <div class="header-left">
            <div class="star-rating" style="font-size:${titleSize + 1}px">${generateStars(rating)}</div>
            <div class="review-date">${date}</div>
          </div>
          <div class="header-right">
            ${gen ? `<span class="attribute-tag">${gen}</span>` : ""}
            ${gender ? `<span class="attribute-tag">${gender}</span>` : ""}
            ${returnStatus ? `<span class="return-tag ${returnClass}">${returnStatus}</span>` : ""}
          </div>
        </div>

        <div class="review-body">
          <span class="body-text" style="color:${config.text_color}">${displayBody}</span>
          ${isLong ? `<button class="read-more-btn">Read more</button>` : ""}
        </div>
      `;

      if (isLong) {
        const btn = card.querySelector(".read-more-btn");
        const bodySpan = card.querySelector(".body-text");
        btn.style.color = config.primary_color;

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
