/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * Feature: Status Badge + Star Ratings + Responsive Control + Tile Background Color + Sorting
 */

looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
    // 1. Tile Background
    tile_bg_color: {
      type: "string",
      label: "Tile Background",
      default: "#FAF9F8", // Rose Quartz Theme Background
      display: "color",
      section: "Style",
      order: 1
    },
    // 2. Card Styles
    card_bg_color: {
      type: "string",
      label: "Card Background",
      default: "#FFFFFF",
      display: "color",
      section: "Style",
      order: 2
    },
    font_color: {
      type: "string",
      label: "Text Color",
      default: "#333333",
      display: "color",
      section: "Style",
      order: 3
    },
    accent_color: {
      type: "string",
      label: "Accent Color",
      default: "#AA7777", // Rose Quartz
      display: "color",
      section: "Style",
      order: 4
    },
    star_color: {
      type: "string",
      label: "Star Color",
      default: "#FFC107", // Amber
      display: "color",
      section: "Style",
      order: 5
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 30,
      section: "Style",
      order: 6
    },
    // 3. Layout Settings
    min_card_width: {
      type: "number",
      label: "Min Card Width (px)",
      default: 160,
      display: "range",
      min: 100,
      max: 400,
      step: 10,
      section: "Layout"
    }
  },

  // --- 初期化 ---
  create: function(element, config) {
    // コンテナ自体のスタイルリセット
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.overflow = "hidden";
    element.style.padding = "0";

    // CSS定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .catalog-container {
          font-family: 'Inter', sans-serif;
          flex: 1;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          box-sizing: border-box;
          /* 背景色はJSで動的に適用 */
          transition: background-color 0.3s ease;
        }

        /* --- Sorting Toolbar --- */
        .catalog-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .sort-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-right: 8px;
        }

        .sort-select {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #ddd;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          background-color: #fff;
          color: #333;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .sort-select:hover {
          border-color: #AA7777;
        }

        /* --- Grid & Cards --- */
        .catalog-grid {
          display: grid;
          /* カラム幅はJSで動的に適用 */
          gap: 16px;
          padding-bottom: 20px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          /* 背景色はJSで適用 */
          border: 1px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(170, 119, 119, 0.15);
          border-color: rgba(170, 119, 119, 0.3);
        }

        .product-card.active {
          border: 2px solid #AA7777;
          background-color: #FFFDFD !important;
        }

        .product-card.dimmed {
          opacity: 0.4;
          filter: grayscale(80%);
        }

        .card-image-wrapper {
          width: 100%;
          padding-top: 100%; /* 1:1 Aspect Ratio */
          position: relative;
          background-color: #f4f4f4;
          overflow: hidden;
        }

        .card-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .product-card:hover .card-image {
          transform: scale(1.08);
        }

        .card-info {
          padding: 12px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .product-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rating-container {
          display: flex;
          align-items: center;
          font-size: 12px;
          margin-bottom: 2px;
        }
        .stars {
          letter-spacing: 0px;
          margin-right: 4px;
          line-height: 1;
        }
        .rating-value {
          font-size: 10px;
          color: #999;
        }

        .product-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 8px;
            border-top: 1px solid rgba(0,0,0,0.05);
            flex-wrap: wrap;
            gap: 4px;
        }

        .product-price {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .stock-badge {
          font-size: 9px;
          padding: 3px 6px;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
          text-transform: uppercase;
        }

        .more-options {
            opacity: 0;
            position: absolute;
            top: 6px;
            right: 6px;
            background: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: opacity 0.2s;
            font-size: 14px;
            color: #333;
        }
        .product-card:hover .more-options {
            opacity: 1;
        }
      </style>
      <div id="viz-root" class="catalog-container">
        <div class="catalog-toolbar">
          <span class="sort-label">Sort by:</span>
          <select id="sort-select" class="sort-select">
            <option value="default">Recommended</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="rating_desc">Rating: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // --- 描画 ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");
    const container = element.querySelector(".catalog-container");
    const sortSelect = element.querySelector("#sort-select");

    this.clearErrors();

    // データのバリデーション
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "表示するデータがありません。" });
      return;
    }
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Data Error", message: "少なくとも1つのディメンション（商品名）が必要です。" });
       return;
    }

    // --- 設定の適用 ---
    // 1. タイル全体の背景色
    container.style.backgroundColor = config.tile_bg_color || "#FAF9F8";

    // 2. グリッドレイアウト
    const minWidth = config.min_card_width || 160;
    gridContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}px, 1fr))`;

    // --- フィールドのマッピング ---
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const statusField = dimensions.length > 2 ? dimensions[2].name : null;

    const priceField = measures.length > 0 ? measures[0].name : null;
    const ratingField = measures.length > 1 ? measures[1].name : null;

    // --- ソート機能の実装 ---

    // 現在のデータセットを保持（デフォルト順）
    let currentData = [...data];

    // ソートハンドラ関数
    const handleSort = (sortType) => {
      let sortedData = [...currentData];

      switch(sortType) {
        case "price_desc":
          if (priceField) {
            sortedData.sort((a, b) => (b[priceField].value || 0) - (a[priceField].value || 0));
          }
          break;
        case "price_asc":
          if (priceField) {
            sortedData.sort((a, b) => (a[priceField].value || 0) - (b[priceField].value || 0));
          }
          break;
        case "rating_desc":
          if (ratingField) {
            sortedData.sort((a, b) => (b[ratingField].value || 0) - (a[ratingField].value || 0));
          }
          break;
        case "name_asc":
          sortedData.sort((a, b) => {
             const nameA = a[nameField].value ? a[nameField].value.toString().toLowerCase() : "";
             const nameB = b[nameField].value ? b[nameField].value.toString().toLowerCase() : "";
             return nameA.localeCompare(nameB);
          });
          break;
        default: // "default"
          // Lookerから返却された元の順序 (data) を使用
          sortedData = [...data];
          break;
      }
      // 再描画
      renderGrid(sortedData);
    };

    // イベントリスナーの登録（重複防止のため一度削除してから登録）
    const newSortSelect = sortSelect.cloneNode(true);
    sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);

    newSortSelect.addEventListener("change", (e) => {
      handleSort(e.target.value);
    });

    // --- ヘルパー関数 ---
    const generateStars = (value, color) => {
      const score = parseFloat(value) || 0;
      const roundedScore = Math.round(score);
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += (i <= roundedScore)
          ? `<span style="color: ${color};">★</span>`
          : `<span style="color: #E0E0E0;">★</span>`;
      }
      return { html: starsHtml, score: score.toFixed(1) };
    };

    const getStatusStyle = (statusText) => {
      const text = statusText ? statusText.toLowerCase() : "";
      if (text.includes("stock") || text.includes("available")) {
        return { bg: "#E2F5EA", color: "#2E7D32" };
      } else if (text.includes("out") || text.includes("sold")) {
        return { bg: "#FFEBEE", color: "#C62828" };
      } else {
        return { bg: "#FFF3E0", color: "#EF6C00" };
      }
    };

    // --- グリッド描画関数 ---
    const renderGrid = (dataset) => {
      gridContainer.innerHTML = ""; // クリア

      dataset.forEach(row => {
        const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
        const imageVal = imageField ? row[imageField].value : "";
        const statusVal = statusField ? LookerCharts.Utils.textForCell(row[statusField]) : "In Stock";
        const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

        const ratingRawVal = ratingField ? row[ratingField].value : 0;
        const ratingData = generateStars(ratingRawVal, config.star_color);

        const statusStyle = getStatusStyle(statusVal);

        const card = document.createElement("div");
        card.className = "product-card";

        // カードスタイルの適用
        card.style.backgroundColor = config.card_bg_color;
        card.style.borderRadius = `${config.border_radius}px`;
        card.style.color = config.font_color;

        // クロスフィルタリング選択状態
        const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
        if (selectionState === 1) card.classList.add("active");
        else if (selectionState === 2) card.classList.add("dimmed");

        card.innerHTML = `
          <div class="card-image-wrapper">
            <img src="${imageVal}" class="card-image" alt="${nameVal}" onerror="this.src='https://dummyimage.com/300x300/eee/aaa&text=No+Img'">
            <div class="more-options">⋮</div>
          </div>
          <div class="card-info">
            <div class="product-name" title="${nameVal}" style="color: ${config.font_color}">${nameVal}</div>

            <div class="rating-container" ${!ratingField ? 'style="display:none;"' : ''}>
               <span class="stars">${ratingData.html}</span>
               <span class="rating-value">(${ratingData.score})</span>
            </div>

            <div class="product-meta-row">
               <div class="product-price" style="color: ${config.accent_color};">
                 ${priceVal}
               </div>
               <span class="stock-badge" style="background-color: ${statusStyle.bg}; color: ${statusStyle.color};">
                 ${statusVal}
               </span>
            </div>
          </div>
        `;

        // クリックイベント
        card.onclick = (event) => {
          if (event.target.classList.contains('more-options')) {
              LookerCharts.Utils.openDrillMenu({
                  links: row[nameField].links,
                  event: event
              });
              event.stopPropagation();
          } else {
              if (details.crossfilterEnabled) {
                  LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
              }
          }
        };

        gridContainer.appendChild(card);
      });
    };

    // 初回描画（デフォルト順）
    renderGrid(data);

    // ドロップダウンの初期値をリセット（データ更新時）
    newSortSelect.value = "default";

    done();
  }
});
