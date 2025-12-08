/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * API Version: 2.0
 */

looker.plugins.visualizations.add({
  // --- 設定オプション (Configuration UI) ---
  // API Reference: Presenting Configuration UI [cite: 220]
  options: {
    // デザイン設定
    tile_bg_color: {
      type: "string",
      label: "Tile Background",
      default: "#FAF9F8", // テーマ背景色 [cite: 483]
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
      default: "#333333", // テーマテキスト色 [cite: 480]
      display: "color",
      section: "Style",
      order: 3
    },
    accent_color: {
      type: "string",
      label: "Accent Color",
      default: "#AA7777", // テーマメインカラー [cite: 477]
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

  // --- 初期化 (Create Function) ---
  // API Reference: The create function [cite: 84]
  create: function(element, config) {
    // スタイルの注入
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* コンテナ設定 */
        .catalog-container {
          font-family: 'Inter', sans-serif; /* テーマフォント [cite: 485] */
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

        /* クロスフィルタリングの状態スタイル [cite: 180] */
        .product-card.active {
          border: 2px solid #AA7777; /* テーマカラー */
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

        /* アクションボタン (3点リーダー) */
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
        .stock-status {
           font-size: 10px;
           display: inline-block;
           padding: 2px 6px;
           border-radius: 4px;
           margin-top: 4px;
           width: fit-content;
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

  // --- 描画 (Update Function) ---
  // API Reference: The updateAsync function [cite: 98]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // エラークリア [cite: 71]

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

    // フィールドのマッピング (順序依存: 1.名前, 2.画像, 3.ステータス)
    const dims = queryResponse.fields.dimensions;
    const meas = queryResponse.fields.measures;

    const fieldMap = {
      name: dims[0].name,
      image: dims.length > 1 ? dims[1].name : null,
      status: dims.length > 2 ? dims[2].name : null,
      price: meas.length > 0 ? meas[0].name : null
    };

    // データのソート処理
    // 注: Lookerから返されるdataはオブジェクトの配列 [cite: 120]
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
      // LookerCharts.Utilsを使って安全に値を取得 [cite: 154]
      const nameText = LookerCharts.Utils.textForCell(row[fieldMap.name]);
      const imageUrl = fieldMap.image && row[fieldMap.image].value ? row[fieldMap.image].value : 'https://placehold.co/300x300?text=No+Image';
      const priceText = fieldMap.price ? LookerCharts.Utils.textForCell(row[fieldMap.price]) : '';
      const statusText = fieldMap.status ? LookerCharts.Utils.textForCell(row[fieldMap.status]) : '';

      // カード要素作成
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.backgroundColor = config.card_bg_color;
      card.style.color = config.font_color;

      // クロスフィルタリング選択状態の判定 [cite: 178]
      // 0:NONE, 1:SELECTED, 2:UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) card.classList.add("active");
      if (selectionState === 2) card.classList.add("dimmed");

      // HTMLの組み立て
      let statusHtml = '';
      if (statusText) {
        // ステータスに応じた簡易色分け
        const isStock = statusText.toLowerCase().includes('stock');
        const bg = isStock ? '#E2F5EA' : '#FFEBEE';
        const col = isStock ? '#2E7D32' : '#C62828';
        statusHtml = `<span class="stock-status" style="background:${bg}; color:${col}">${statusText}</span>`;
      }

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



      // 1. アクションボタン (ドリルメニュー)
      const actionBtn = card.querySelector(".action-btn");
      actionBtn.addEventListener("click", (e) => {
        // カード自体のクリックイベントへの伝播を止める
        e.stopPropagation();

        // API Reference: LookerCharts.Utils.openDrillMenu
        LookerCharts.Utils.openDrillMenu({
          links: row[fieldMap.name].links, // Cellオブジェクト内のlinksプロパティを渡す
          event: e // クリック位置決定のためイベントオブジェクトを渡す [cite: 200]
        });
      });

      // 2. カード全体 (クロスフィルタリング)
      card.addEventListener("click", (e) => {
        // API Reference: LookerCharts.Utils.toggleCrossfilter
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: e
          });
        }
      });

      grid.appendChild(card);
    });

    // ソートイベントの再登録 (DOM再生成対策)
    const newSortSelect = sortSelect.cloneNode(true);
    sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
    newSortSelect.addEventListener("change", () => {
       // ソート変更時はupdateを再度呼び出すのではなく、内部的に並び替えて再描画
       this.updateAsync(data, element, config, queryResponse, details, done);
    });
    // 選択状態を復元
    newSortSelect.value = sortVal;

    // レンダリング完了通知 [cite: 111]
    done();
  }
});
