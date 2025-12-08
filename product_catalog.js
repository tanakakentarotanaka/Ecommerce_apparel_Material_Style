/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * API Version: 2.0
 * Features: Sorting, Cross-filtering, Action Menu on Status Badge
 */

looker.plugins.visualizations.add({
  // --- 1. 設定オプション (Configuration UI) ---
  options: {
    // デザイン設定
    tile_bg_color: {
      type: "string",
      label: "Tile Background",
      default: "#FAF9F8", // Rose Quartz Theme Background
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
      label: "Accent Color",
      default: "#AA7777", // Rose Quartz Accent
      display: "color",
      section: "Style",
      order: 4
    },
    // レイアウト設定
    min_card_width: {
      type: "number",
      label: "Min Card Width (px)",
      default: 200,
      display: "range",
      min: 140,
      max: 400,
      step: 10,
      section: "Layout"
    },
    cover_image: {
      type: "boolean",
      label: "Cover Image Fit",
      default: true,
      section: "Layout"
    }
  },

  // --- 2. 初期化 (Create Function) ---
  create: function(element, config) {
    // CSSの注入
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* コンテナ設定 */
        .catalog-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* ツールバー */
        .catalog-toolbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }
        .sort-select {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #ddd;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          background-color: #fff;
          cursor: pointer;
          outline: none;
        }

        /* グリッドレイアウト */
        .catalog-grid {
          display: grid;
          gap: 16px;
          padding-bottom: 20px;
          /* 列幅はJSで制御 */
        }

        /* カードデザイン */
        .product-card {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid transparent;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(170, 119, 119, 0.1);
        }

        /* クロスフィルタリングの状態スタイル */
        .product-card.active {
          border: 2px solid #AA7777;
        }
        .product-card.dimmed {
          opacity: 0.3;
        }

        /* 画像エリア */
        .card-image-wrapper {
          width: 100%;
          padding-top: 100%; /* 正方形 */
          position: relative;
          background-color: #f9f9f9;
        }
        .card-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }

        /* 画像上のアクションボタン (予備用) */
        .action-btn {
          position: absolute;
          top: 8px; right: 8px;
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          color: #333;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        .product-card:hover .action-btn {
          opacity: 1;
        }
        .action-btn:hover {
          background: #AA7777;
          color: white;
        }

        /* 情報エリア */
        .card-info {
          padding: 12px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .product-name {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .price-tag {
          font-size: 15px;
          font-weight: 700;
          margin-top: auto;
        }

        /* ステータスバッジ (アクション対応) */
        .status-badge {
           font-size: 10px;
           display: inline-block;
           padding: 3px 8px;
           border-radius: 12px;
           margin-top: 4px;
           width: fit-content;
           font-weight: 600;
           transition: background-color 0.2s;
        }
        /* アクション可能なバッジのホバー効果 */
        .status-badge-action:hover {
           opacity: 0.8;
           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      </style>
      <div class="catalog-container">
        <div class="catalog-toolbar">
           <select id="sort-select" class="sort-select">
             <option value="default">Sort: Recommended</option>
             <option value="price_desc">Price: High to Low</option>
             <option value="price_asc">Price: Low to High</option>
           </select>
        </div>
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // --- 3. 描画 (Update Function) ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // エラークリア

    // データ検証
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "表示するデータがありません。" });
      return;
    }
    // 最低限必要なディメンション数チェック
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Configuration Error", message: "少なくとも1つのディメンション（商品名）が必要です。" });
       return;
    }

    // DOM要素の取得
    const container = element.querySelector(".catalog-container");
    const grid = element.querySelector("#grid-container");
    const sortSelect = element.querySelector("#sort-select");

    // コンフィグの適用
    container.style.backgroundColor = config.tile_bg_color;
    grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${config.min_card_width}px, 1fr))`;

    // フィールドのマッピング (順序: 1.名前, 2.画像, 3.ステータス)
    const dims = queryResponse.fields.dimensions;
    const meas = queryResponse.fields.measures;

    const fieldMap = {
      name: dims[0].name,
      image: dims.length > 1 ? dims[1].name : null,
      status: dims.length > 2 ? dims[2].name : null, // ここにアクション付きディメンションが入る想定
      price: meas.length > 0 ? meas[0].name : null
    };

    // データのソート処理
    let renderData = [...data];
    const sortVal = sortSelect.value;

    if (fieldMap.price && sortVal !== 'default') {
       renderData.sort((a, b) => {
         const valA = a[fieldMap.price].value || 0;
         const valB = b[fieldMap.price].value || 0;
         return sortVal === 'price_desc' ? valB - valA : valA - valB;
       });
    }

    // グリッドのクリア
    grid.innerHTML = "";

    // カードの生成ループ
    renderData.forEach(row => {
      // 値の安全な取得
      const nameText = LookerCharts.Utils.textForCell(row[fieldMap.name]);
      const imageUrl = fieldMap.image && row[fieldMap.image].value ? row[fieldMap.image].value : 'https://placehold.co/300x300?text=No+Image';
      const priceText = fieldMap.price ? LookerCharts.Utils.textForCell(row[fieldMap.price]) : '';
      const statusText = fieldMap.status ? LookerCharts.Utils.textForCell(row[fieldMap.status]) : '';

      // カード要素作成
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.backgroundColor = config.card_bg_color;
      card.style.color = config.font_color;

      [cite_start]// クロスフィルタリング選択状態の判定 [cite: 275]
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) card.classList.add("active");
      if (selectionState === 2) card.classList.add("dimmed");

      // --- ステータスバッジのHTML生成 (修正ポイント) ---
      let statusHtml = '';
      if (statusText) {
        // 在庫状況に応じた簡易色分け
        const isStock = statusText.toLowerCase().includes('stock') && !statusText.toLowerCase().includes('out');
        const bg = isStock ? '#E2F5EA' : '#FFEBEE'; // Green tint vs Red tint
        const col = isStock ? '#2E7D32' : '#C62828';

        // 【重要】status-badge-action クラスを付与し、クリック可能であることを視覚的に示す
        statusHtml = `<span class="status-badge status-badge-action" style="background:${bg}; color:${col}; cursor:pointer;" title="Click to Request Restock">${statusText}</span>`;
      }

      // カード内部のHTML構造
      card.innerHTML = `
        <div class="card-image-wrapper">
           <img src="${imageUrl}" class="card-image" style="object-fit: ${config.cover_image ? 'cover' : 'contain'}">
           <div class="action-btn" title="Actions">⋮</div>
        </div>
        <div class="card-info">
           <h3 class="product-name">${nameText}</h3>
           ${statusHtml}
           <div class="price-tag" style="color: ${config.accent_color}">${priceText}</div>
        </div>
      `;

      // --- イベントハンドラの実装 ---

      // 1. ステータスバッジクリック (再入荷アクション用 - 修正ポイント)
      const statusBadge = card.querySelector(".status-badge-action");
      if (statusBadge) {
        statusBadge.addEventListener("click", (e) => {
          // カード全体のクリック（クロスフィルタ）への伝播を止める
          e.stopPropagation();

          [cite_start]// ステータスフィールドに定義されたアクションリンクを取得 [cite: 294]
          const statusLinks = fieldMap.status ? row[fieldMap.status].links : [];

          if (statusLinks && statusLinks.length > 0) {
            [cite_start]// ドリルメニューを開く [cite: 289]
            LookerCharts.Utils.openDrillMenu({
              links: statusLinks,
              event: e
            });
          } else {
             console.warn("No actions found for this status.");
          }
        });
      }

      // 2. 画像上の予備アクションボタン (念のため残す)
      const actionBtn = card.querySelector(".action-btn");
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        LookerCharts.Utils.openDrillMenu({
          links: row[fieldMap.name].links, // 商品名のアクション（詳細など）
          event: e
        });
      });

      // 3. カード全体クリック (クロスフィルタリング)
      card.addEventListener("click", (e) => {
        if (details.crossfilterEnabled) {
          [cite_start]// クロスフィルタのトグル [cite: 261]
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: e
          });
        }
      });

      grid.appendChild(card);
    });

    // ソートUIのイベント再登録
    const newSortSelect = sortSelect.cloneNode(true);
    sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
    newSortSelect.addEventListener("change", () => {
       // 再描画をトリガー
       this.updateAsync(data, element, config, queryResponse, details, done);
    });
    newSortSelect.value = sortVal;

    [cite_start]// 描画完了通知 [cite: 200]
    done();
  }
});
