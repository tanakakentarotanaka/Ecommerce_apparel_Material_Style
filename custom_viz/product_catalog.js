/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * Fix: Image Collapse Issue + Scrollable Grid
 */

looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
    // --- 1. General Style ---
    tile_bg_color: {
      type: "string",
      label: "Tile Background",
      default: "#FAF9F8",
      display: "color",
      section: "Style",
      order: 1
    },
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
      label: "Accent Color (Price)",
      default: "#AA7777",
      display: "color",
      section: "Style",
      order: 4
    },
    star_color: {
      type: "string",
      label: "Star Color",
      default: "#FFC107",
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

    // --- 2. Layout Settings ---
    items_per_page: {
      type: "number",
      label: "Items Per Page",
      default: 20,
      display: "number",
      section: "Layout",
      order: 1
    },
    min_card_width: {
      type: "number",
      label: "Min Card Width (px)",
      default: 160,
      display: "range",
      min: 100,
      max: 400,
      step: 10,
      section: "Layout",
      order: 2
    },

    // --- 3. Status Rules (条件付き書式) ---
    // Rule 1
    rule_1_value: {
      type: "string",
      label: "Rule 1: Contains Text",
      default: "Stock",
      section: "Status Rules",
      order: 1
    },
    rule_1_bg: {
      type: "string",
      label: "Rule 1: Bg Color",
      default: "#E2F5EA", // Greenish
      display: "color",
      section: "Status Rules",
      order: 2
    },
    rule_1_text: {
      type: "string",
      label: "Rule 1: Text Color",
      default: "#2E7D32",
      display: "color",
      section: "Status Rules",
      order: 3
    },
    // Rule 2
    rule_2_value: {
      type: "string",
      label: "Rule 2: Contains Text",
      default: "Sale",
      section: "Status Rules",
      order: 4
    },
    rule_2_bg: {
      type: "string",
      label: "Rule 2: Bg Color",
      default: "#FFF3E0", // Orangeish
      display: "color",
      section: "Status Rules",
      order: 5
    },
    rule_2_text: {
      type: "string",
      label: "Rule 2: Text Color",
      default: "#EF6C00",
      display: "color",
      section: "Status Rules",
      order: 6
    },
    // Rule 3
    rule_3_value: {
      type: "string",
      label: "Rule 3: Contains Text",
      default: "Sold",
      section: "Status Rules",
      order: 7
    },
    rule_3_bg: {
      type: "string",
      label: "Rule 3: Bg Color",
      default: "#FFEBEE", // Reddish
      display: "color",
      section: "Status Rules",
      order: 8
    },
    rule_3_text: {
      type: "string",
      label: "Rule 3: Text Color",
      default: "#C62828",
      display: "color",
      section: "Status Rules",
      order: 9
    }
  },

  // --- 初期化 ---
  create: function(element, config) {
    // Lookerのコンテナ自体のスタイル設定
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.overflow = "hidden"; // 外側のスクロールを禁止
    element.style.padding = "0";
    element.style.height = "100%";

    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* メインコンテナ */
        .catalog-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px;
          box-sizing: border-box;
          transition: background-color 0.3s ease;
        }

        /* --- Toolbar (固定ヘッダー) --- */
        .catalog-toolbar {
          flex: 0 0 auto; /* 縮小しない */
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          flex-wrap: wrap;
          gap: 10px;
          z-index: 10;
        }

        /* Pagination Styles */
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .page-btn {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          color: #333;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #AA7777;
          color: #AA7777;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: default;
          background: #f9f9f9;
        }
        .page-info {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          min-width: 60px;
          text-align: center;
        }

        .sort-wrapper {
          display: flex;
          align-items: center;
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

        /* --- Grid (スクロール領域) --- */
        .catalog-grid {
          flex: 1;
          overflow-y: auto;
          display: grid;
          gap: 16px;
          padding-bottom: 20px;
          padding-right: 4px;
          grid-auto-rows: max-content; /* 行の高さをコンテンツに合わせる */
        }

        .product-card {
          display: flex;
          flex-direction: column;
          border: 1px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          overflow: hidden;
          cursor: pointer;
          position: relative;
          height: auto; /* 高さを自動に */
          background-color: #fff; /* デフォルト背景 */
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

        /* --- Image Wrapper 修正版 --- */
        .card-image-wrapper {
          width: 100%;
          aspect-ratio: 1 / 1; /* 正方形を強制 (モダンブラウザ用) */
          position: relative;
          background-color: #f4f4f4;
          overflow: hidden;
          flex-shrink: 0;      /* Flexコンテナ内でつぶれるのを防ぐ (重要) */
        }

        /* フォールバック: aspect-ratio非対応環境用 (念のためpaddingも残すがaspect-ratio優先) */
        @supports not (aspect-ratio: 1 / 1) {
          .card-image-wrapper {
            padding-top: 100%;
            height: 0;
          }
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
          <div class="pagination-controls">
            <button id="btn-prev" class="page-btn">Prev</button>
            <span id="page-info" class="page-info"></span>
            <button id="btn-next" class="page-btn">Next</button>
          </div>

          <div class="sort-wrapper">
            <span class="sort-label">Sort by:</span>
            <select id="sort-select" class="sort-select">
              <option value="default">ID Sort</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="rating_desc">Rating: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
        </div>
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // --- 描画 ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");
    const container = element.querySelector(".catalog-container");

    // UI Elements
    const sortSelect = element.querySelector("#sort-select");
    const btnPrev = element.querySelector("#btn-prev");
    const btnNext = element.querySelector("#btn-next");
    const pageInfo = element.querySelector("#page-info");

    this.clearErrors();

    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません。" });
      return;
    }
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Data Error", message: "少なくとも1つのディメンションが必要です。" });
       return;
    }

    // スタイル適用
    container.style.backgroundColor = config.tile_bg_color || "#FAF9F8";
    const minWidth = config.min_card_width || 160;
    gridContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}px, 1fr))`;

    // フィールドマッピング
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const statusField = dimensions.length > 2 ? dimensions[2].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;
    const ratingField = measures.length > 1 ? measures[1].name : null;

    // --- ステート管理 (ページネーション & ソート) ---
    const itemsPerPage = config.items_per_page || 20;
    let currentPage = 1;
    let currentSortedData = [...data];

    // --- ソートロジック ---
    const applySort = (sortType) => {
      switch(sortType) {
        case "price_desc":
          if (priceField) currentSortedData.sort((a, b) => (b[priceField].value || 0) - (a[priceField].value || 0));
          break;
        case "price_asc":
          if (priceField) currentSortedData.sort((a, b) => (a[priceField].value || 0) - (b[priceField].value || 0));
          break;
        case "rating_desc":
          if (ratingField) currentSortedData.sort((a, b) => (b[ratingField].value || 0) - (a[ratingField].value || 0));
          break;
        case "name_asc":
          currentSortedData.sort((a, b) => {
             const nameA = a[nameField].value ? a[nameField].value.toString().toLowerCase() : "";
             const nameB = b[nameField].value ? b[nameField].value.toString().toLowerCase() : "";
             return nameA.localeCompare(nameB);
          });
          break;
        default:
           currentSortedData = [...data];
          break;
      }
      currentPage = 1;
      renderPage();
    };

    // --- ページネーション & 描画ロジック ---
    const renderPage = () => {
      const totalItems = currentSortedData.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      if (currentPage < 1) currentPage = 1;
      if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageData = currentSortedData.slice(startIndex, endIndex);

      renderGrid(pageData);

      pageInfo.textContent = `${currentPage} / ${totalPages || 1}`;
      btnPrev.disabled = currentPage <= 1;
      btnNext.disabled = currentPage >= totalPages;

      gridContainer.scrollTop = 0;
    };

    // --- 条件付き書式ロジック ---
    const getStatusStyle = (statusText) => {
      if (!statusText) return { bg: "#EEE", color: "#999" };
      const text = statusText.toString().toLowerCase();
      if (config.rule_1_value && text.includes(config.rule_1_value.toLowerCase())) return { bg: config.rule_1_bg, color: config.rule_1_text };
      if (config.rule_2_value && text.includes(config.rule_2_value.toLowerCase())) return { bg: config.rule_2_bg, color: config.rule_2_text };
      if (config.rule_3_value && text.includes(config.rule_3_value.toLowerCase())) return { bg: config.rule_3_bg, color: config.rule_3_text };
      return { bg: "#F5F5F5", color: "#757575" };
    };

    const generateStars = (value, color) => {
      const score = parseFloat(value) || 0;
      const roundedScore = Math.round(score);
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += (i <= roundedScore) ? `<span style="color: ${color};">★</span>` : `<span style="color: #E0E0E0;">★</span>`;
      }
      return { html: starsHtml, score: score.toFixed(1) };
    };

    // --- グリッド描画関数 ---
    const renderGrid = (dataset) => {
      gridContainer.innerHTML = "";

      dataset.forEach(row => {
        const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
        const imageVal = imageField ? row[imageField].value : "";
        const statusVal = statusField ? LookerCharts.Utils.textForCell(row[statusField]) : "";
        const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";
        const ratingRawVal = ratingField ? row[ratingField].value : 0;

        const ratingData = generateStars(ratingRawVal, config.star_color);
        const statusStyle = getStatusStyle(statusVal);

        const card = document.createElement("div");
        card.className = "product-card";
        card.style.backgroundColor = config.card_bg_color;
        card.style.borderRadius = `${config.border_radius}px`;
        card.style.color = config.font_color;

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
               <div class="product-price" style="color: ${config.accent_color};">${priceVal}</div>
               <span class="stock-badge" style="display: ${statusVal ? 'inline-block' : 'none'}; background-color: ${statusStyle.bg}; color: ${statusStyle.color};">${statusVal}</span>
            </div>
          </div>
        `;

        card.onclick = (event) => {
          if (event.target.classList.contains('more-options')) {
              LookerCharts.Utils.openDrillMenu({ links: row[nameField].links, event: event });
              event.stopPropagation();
          } else {
              if (details.crossfilterEnabled) {
                  LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
              }
          }
        };
        gridContainer.appendChild(card);
      });

      if(dataset.length === 0) {
          gridContainer.innerHTML = '<div style="padding:20px; color:#999;">No items on this page.</div>';
      }
    };

    // --- イベントリスナーの再設定 ---
    const newSortSelect = sortSelect.cloneNode(true);
    sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
    newSortSelect.addEventListener("change", (e) => applySort(e.target.value));
    newSortSelect.value = "default";

    const newBtnPrev = btnPrev.cloneNode(true);
    btnPrev.parentNode.replaceChild(newBtnPrev, btnPrev);
    newBtnPrev.addEventListener("click", () => {
      currentPage--;
      renderPage();
    });

    const newBtnNext = btnNext.cloneNode(true);
    btnNext.parentNode.replaceChild(newBtnNext, btnNext);
    newBtnNext.addEventListener("click", () => {
      currentPage++;
      renderPage();
    });

    // 初回描画
    applySort("default");

    done();
  }
});
