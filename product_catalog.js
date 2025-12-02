/**
 * Fashion BI Product Catalog Visualization
 * API 2.0 Referenceに基づく実装
 * Feature: Star Rating System Added
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    font_color: {
      type: "string",
      label: "Text Color",
      default: "#333333",
      display: "color",
      section: "Style"
    },
    accent_color: {
      type: "string",
      label: "Accent Color (Price)",
      default: "#AA7777", // Rose Quartz
      display: "color",
      section: "Style"
    },
    star_color: {
      type: "string",
      label: "Star Color",
      default: "#FFC107", // Amber
      display: "color",
      section: "Style"
    },
    card_bg_color: {
      type: "string",
      label: "Card Background",
      default: "#FFFFFF",
      display: "color",
      section: "Style"
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 24,
      display: "range",
      min: 0,
      max: 50,
      section: "Style"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        .catalog-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 10px;
          box-sizing: border-box;
        }

        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(170, 119, 119, 0.15);
        }

        .product-card.active {
          border: 2px solid #AA7777;
          background-color: #FAF9F8 !important;
        }

        .product-card.dimmed {
          opacity: 0.4;
        }

        .card-image-wrapper {
          width: 100%;
          height: 200px;
          background-color: #f4f4f4;
          overflow: hidden;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-card:hover .card-image {
          transform: scale(1.05);
        }

        .card-info {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .product-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          line-height: 1.4;
          color: inherit;
        }

        /* レビュー星のスタイル */
        .rating-container {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .stars {
          letter-spacing: 2px;
          margin-right: 6px;
        }
        .rating-value {
          font-size: 11px;
          color: #999;
          font-weight: 400;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
        }

        .stock-badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          background-color: #F5F5F5;
          color: #666;
          font-weight: 600;
        }
      </style>
      <div id="viz-root" class="catalog-container">
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");
    this.clearErrors();

    // データ検証
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "表示するデータがありません。" });
      return;
    }
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Data Error", message: "少なくとも1つのディメンション（商品名）が必要です。" });
       return;
    }

    gridContainer.innerHTML = "";

    // フィールドのマッピング
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;
    // 2つ目のメジャーをRatingとして扱う
    const ratingField = measures.length > 1 ? measures[1].name : null;

    // 星生成ヘルパー関数
    const generateStars = (value, color) => {
      const score = parseFloat(value) || 0;
      const roundedScore = Math.round(score); // 四捨五入
      let starsHtml = '';

      for (let i = 1; i <= 5; i++) {
        if (i <= roundedScore) {
          starsHtml += `<span style="color: ${color};">★</span>`;
        } else {
          starsHtml += `<span style="color: #E0E0E0;">★</span>`;
        }
      }
      return { html: starsHtml, score: score.toFixed(1) };
    };

    data.forEach(row => {
      // 値の取得
      const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
      const imageVal = imageField ? row[imageField].value : "https://dummyimage.com/300x300/eee/aaa&text=No+Image";
      const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

      // レビュー値の取得と星の生成
      const ratingRawVal = ratingField ? row[ratingField].value : 0;
      const ratingData = generateStars(ratingRawVal, config.star_color);

      // カード作成
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.backgroundColor = config.card_bg_color;
      card.style.borderRadius = `${config.border_radius}px`;
      card.style.color = config.font_color;

      // クロスフィルター選択状態
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) card.classList.add("active");
      else if (selectionState === 2) card.classList.add("dimmed");

      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imageVal}" class="card-image" alt="${nameVal}" onerror="this.src='https://dummyimage.com/300x300/eee/aaa&text=Img+Err'">
        </div>
        <div class="card-info">
          <div>
            <div class="product-name">${nameVal}</div>

            <div class="rating-container" ${!ratingField ? 'style="display:none;"' : ''}>
              <span class="stars">${ratingData.html}</span>
              <span class="rating-value">(${ratingData.score})</span>
            </div>
          </div>

          <div class="product-meta">
            <span class="product-price" style="color: ${config.accent_color};">${priceVal}</span>
            <span class="stock-badge">In Stock</span>
          </div>
        </div>
      `;

      card.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
        }
      };

      gridContainer.appendChild(card);
    });

    done();
  }
});
