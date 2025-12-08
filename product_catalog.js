/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * API Reference: Looker Visualization API 2.0
 */

looker.plugins.visualizations.add({
  // -----------------------------------------------------------
  // 1. 設定オプション (ユーザーがGUIで変更できる設定)
  // -----------------------------------------------------------
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
      label: "Accent Color",
      default: "#AA7777", // Rose Quartz
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
    price_color: {
      type: "string",
      label: "Price Color",
      default: "#333333",
      display: "color",
      section: "Style"
    },
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 12,
      display: "range",
      min: 0,
      max: 30,
      section: "Style"
    }
  },

  // -----------------------------------------------------------
  // 2. 初期化 (コンテナ作成とCSS定義)
  // -----------------------------------------------------------
  create: function(element, config) {
    // Lookerのデフォルトコンテナスタイルを上書きしてレスポンシブ動作を修正
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.overflow = "hidden";
    element.style.padding = "0";

    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* 全体のコンテナ */
        .catalog-container {
          font-family: 'Inter', sans-serif;
          flex: 1;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          box-sizing: border-box;
          background-color: #FAF9F8; /* Rose Quartz Theme Background */
        }

        /* グリッドレイアウト (自動リフロー) */
        .catalog-grid {
          display: grid;
          /* 幅に合わせて列数を自動調整 (最小220px) */
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          padding-bottom: 20px;
        }

        /* 商品カードスタイル */
        .product-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(170, 119, 119, 0.15); /* Accent shadow */
          border-color: rgba(170, 119, 119, 0.3);
        }

        /* クロスフィルタリング選択状態 */
        .product-card.active {
          border: 2px solid #AA7777;
          background-color: #FFFDFD !important;
        }

        .product-card.dimmed {
          opacity: 0.4;
          filter: grayscale(80%);
        }

        /* 画像ラッパー (正方形を維持) */
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

        /* ドリルメニュー (3点リーダー) */
        .more-options {
            opacity: 0;
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: opacity 0.2s;
            font-size: 18px;
            line-height: 1;
            color: #333;
            z-index: 2;
        }

        .product-card:hover .more-options {
            opacity: 1;
        }

        .more-options:hover {
            background: #fff;
            color: #AA7777;
        }

        /* テキスト情報エリア */
        .card-info {
          padding: 14px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .product-name {
          font-size: 14px;
          font-weight: 600;
          color: inherit;
          line-height: 1.4;
          margin: 0;
          /* 2行で省略 */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 10px;
        }

        .product-price {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .stock-badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          display: inline-block;
          white-space: nowrap;
        }
      </style>
      <div id="viz-root" class="catalog-container">
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // -----------------------------------------------------------
  // 3. 描画ロジック (データ更新時に呼ばれる)
  // -----------------------------------------------------------
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");
    const container = element.querySelector(".catalog-container");

    // まずエラーをクリア
    this.clearErrors();

    // ---------------------------------------------------------
    // A. ガイド表示 (ディメンション未設定時)
    // ---------------------------------------------------------
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dimensions.length === 0) {
      this.addError({
        title: "✨ カタログを表示する準備",
        message: `
          このVisualizationを正しく表示するには、以下の順序でフィールドを選択してください：

          【ディメンション (Dimensions)】
          1. 商品名 (必須)
          2. 画像URL (推奨)
          3. 在庫ステータス (任意)

          【メジャー (Measures)】
          1. 商品価格 (推奨)
        `
      });
      return;
    }

    // ---------------------------------------------------------
    // B. データ不在チェック
    // ---------------------------------------------------------
    if (!data || data.length === 0) {
      this.addError({
        title: "データが見つかりません",
        message: "現在のフィルタ条件に一致する商品はありせん。"
      });
      return;
    }

    // ---------------------------------------------------------
    // C. 描画処理
    // ---------------------------------------------------------

    // グリッドをクリア
    gridContainer.innerHTML = "";

    // テーマ背景色適用
    container.style.backgroundColor = "#FAF9F8";

    // フィールドのマッピング (順序依存)
    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const statusField = dimensions.length > 2 ? dimensions[2].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;

    // ヘルパー: ステータスに応じたバッジの色決定
    const getStatusStyle = (statusText) => {
      const text = statusText ? statusText.toLowerCase() : "";

      if (text.includes("stock") || text.includes("available")) {
        return { bg: "#E2F5EA", color: "#2E7D32" }; // Green (In Stock)
      } else if (text.includes("out") || text.includes("sold")) {
        return { bg: "#FFEBEE", color: "#C62828" }; // Red (Out of Stock)
      } else if (text.includes("low") || text.includes("limited")) {
        return { bg: "#FFF3E0", color: "#EF6C00" }; // Orange (Low Stock)
      } else {
        return { bg: "#F5F5F5", color: "#666666" }; // Grey (Default)
      }
    };

    // データをループしてカードを生成
    data.forEach(row => {
      [cite_start]// データの取り出し (Looker API Utilを使用 [cite: 315])
      const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
      const imageVal = imageField ? row[imageField].value : "";
      const statusVal = statusField ? LookerCharts.Utils.textForCell(row[statusField]) : "";
      const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

      const statusStyle = getStatusStyle(statusVal);

      // カード要素作成
      const card = document.createElement("div");
      card.className = "product-card";

      // スタイルオプション適用
      card.style.backgroundColor = config.card_bg_color;
      card.style.borderRadius = `${config.border_radius}px`;
      card.style.color = config.font_color;

      [cite_start]// クロスフィルタリングの状態を取得 [cite: 339]
      // 0:NONE, 1:SELECTED, 2:UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) card.classList.add("active");
      else if (selectionState === 2) card.classList.add("dimmed");

      // HTMLの中身
      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imageVal}" class="card-image" alt="${nameVal}" onerror="this.src='https://dummyimage.com/400x400/f0f0f0/999&text=No+Image'">
          <div class="more-options">⋮</div>
        </div>
        <div class="card-info">
          <div class="product-name">${nameVal}</div>

          <div class="product-meta-row">
             <div class="product-price" style="color: ${config.price_color};">
               ${priceVal}
             </div>
             ${statusVal ? `
               <span class="stock-badge" style="background-color: ${statusStyle.bg}; color: ${statusStyle.color};">
                 ${statusVal}
               </span>
             ` : ''}
          </div>
        </div>
      `;

      // -------------------------------------------------------
      // イベントハンドラ設定
      // -------------------------------------------------------
      card.onclick = (event) => {
        // "⋮" (more-options) がクリックされた場合 -> ドリルメニュー
        if (event.target.classList.contains('more-options')) {
            LookerCharts.Utils.openDrillMenu({
                [cite_start]links: row[nameField].links, // メインディメンションのリンクを使用 [cite: 353]
                event: event
            });
            event.stopPropagation(); // 親要素へのイベント伝播を止める
        }
        // カード自体がクリックされた場合 -> クロスフィルタ
        else {
            if (details.crossfilterEnabled) {
                [cite_start]LookerCharts.Utils.toggleCrossfilter({ row: row, event: event }); [cite: 325]
            }
        }
      };

      gridContainer.appendChild(card);
    });

    [cite_start]// 描画完了をLookerに通知 [cite: 303]
    done();
  }
});
