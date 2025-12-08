/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * Ref: API 2.0 Reference [cite: 1]
 */

looker.plugins.visualizations.add({
  // 設定オプション [cite: 50, 221]
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
      default: "#AA7777", // Rose Quartz theme color [cite: 380]
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
      default: 12, // Slightly sharper than 24px for a modern card look
      display: "range",
      min: 0,
      max: 30,
      section: "Style"
    }
  },

  // 初期化関数 [cite: 37, 85]
  create: function(element, config) {
    // Lookerコンテナのデフォルトスタイルを上書きしてレスポンシブ挙動を安定させる
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.overflow = "hidden";
    element.style.padding = "0";

    // スタイルと構造の定義 [cite: 22]
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* 全体のコンテナ */
        .catalog-container {
          font-family: 'Inter', sans-serif; /* Theme font [cite: 388] */
          flex: 1;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          box-sizing: border-box;
          background-color: #FAF9F8; /* Theme Background [cite: 386] */
        }

        /* グリッドレイアウト */
        .catalog-grid {
          display: grid;
          /* レスポンシブの要: コンテナ幅に合わせて自動折り返し */
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          padding-bottom: 20px;
        }

        /* 商品カード */
        .product-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* Softer shadow like the image */
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

        /* 選択状態（クロスフィルタ） [cite: 180] */
        .product-card.active {
          border: 2px solid #AA7777;
          background-color: #FFFDFD !important;
        }

        .product-card.dimmed {
          opacity: 0.4;
          filter: grayscale(80%);
        }

        /* 画像エリア */
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
          object-fit: cover; /* 画像のトリミングを最適化 */
          transition: transform 0.5s ease;
        }

        .product-card:hover .card-image {
          transform: scale(1.08);
        }

        /* 情報エリア */
        .card-info {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .product-name {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          margin: 0;
        }

        .product-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 12px;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* 在庫バッジ (参考画像のデザインに寄せる) */
        .stock-badge {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
        }

        /* ドリルメニュー用のアイコン（オプション） */
        .more-options {
            opacity: 0;
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: opacity 0.2s;
        }
        .product-card:hover .more-options {
            opacity: 1;
        }

      </style>
      <div id="viz-root" class="catalog-container">
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // 描画関数 [cite: 42, 98]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");
    const container = element.querySelector(".catalog-container");

    // エラー処理 [cite: 60]
    this.clearErrors();
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "表示するデータがありません。" });
      return;
    }
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Data Error", message: "少なくとも1つのディメンション（商品名）が必要です。" });
       return;
    }

    // テーマ設定の適用（CSS変数的に使うか、直接DOMに適用）
    container.style.backgroundColor = "#FAF9F8"; // Theme background fix

    // DOMリセット（完全な再描画）
    gridContainer.innerHTML = "";

    // フィールド定義
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const statusField = dimensions.length > 2 ? dimensions[2].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;

    // ヘルパー：ステータスに応じたバッジスタイル
    const getStatusStyle = (statusText) => {
      const text = statusText ? statusText.toLowerCase() : "";
      // 参考画像の "Stock" バッジのような配色へ
      if (text.includes("stock") || text.includes("available")) {
        return { bg: "#E2F5EA", color: "#2E7D32" }; // Green tint
      } else if (text.includes("out") || text.includes("sold")) {
        return { bg: "#FFEBEE", color: "#C62828" }; // Red tint
      } else {
        return { bg: "#FFF3E0", color: "#EF6C00" }; // Orange tint
      }
    };

    // データループ [cite: 12]
    data.forEach(row => {
      // データ取得 [cite: 154]
      const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
      const imageVal = imageField ? row[imageField].value : "";
      const statusVal = statusField ? LookerCharts.Utils.textForCell(row[statusField]) : "In Stock";
      const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

      const statusStyle = getStatusStyle(statusVal);

      // カード要素の作成
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.backgroundColor = config.card_bg_color;
      card.style.borderRadius = `${config.border_radius}px`;
      card.style.color = config.font_color;

      // クロスフィルタリングの状態判定 [cite: 178]
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);
      if (selectionState === 1) card.classList.add("active");
      else if (selectionState === 2) card.classList.add("dimmed");

      // HTML組み立て
      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imageVal}" class="card-image" alt="${nameVal}" onerror="this.src='https://dummyimage.com/300x300/eee/aaa&text=No+Image'">
          <div class="more-options">⋮</div>
        </div>
        <div class="card-info">
          <div class="product-name">${nameVal}</div>

          <div class="product-meta-row">
             <div class="product-price" style="color: ${config.price_color};">
               ${priceVal}
             </div>
             <span class="stock-badge" style="background-color: ${statusStyle.bg}; color: ${statusStyle.color};">
               ${statusVal}
             </span>
          </div>
        </div>
      `;

      // クリックイベントハンドラ
      card.onclick = (event) => {
        // ドリルメニューを開くか、フィルタをかけるか [cite: 192, 164]
        // 画像右上の "⋮" 付近をクリックした場合はドリルメニュー、それ以外はクロスフィルタ
        if (event.target.classList.contains('more-options')) {
            LookerCharts.Utils.openDrillMenu({
                links: row[nameField].links, // ディメンションのリンクを使用
                event: event
            });
            event.stopPropagation(); // バブリング防止
        } else {
            if (details.crossfilterEnabled) {
                LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
            }
        }
      };

      gridContainer.appendChild(card);
    });

    // レンダリング完了通知 [cite: 142]
    done();
  }
});
