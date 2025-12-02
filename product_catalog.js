/**
 * Fashion BI Product Catalog Visualization
 * API 2.0 Referenceに基づく実装
 */

looker.plugins.visualizations.add({
  // 設定オプション: ユーザーがUIで色などを変更できるようにする [cite: 66, 285]
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
      label: "Accent Color (Price/Highlight)",
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

  // セットアップ関数: 初期化時に一度だけ呼ばれる [cite: 101, 148]
  create: function(element, config) {
    // スタイルシートの定義
    // Google FontsのInterを読み込み、カードデザインを定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

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
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* レスポンシブなグリッド */
          gap: 24px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          border: 1px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          overflow: hidden;
          cursor: pointer;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(170, 119, 119, 0.15); /* #AA7777の薄い影 */
        }

        /* 選択時のスタイル */
        .product-card.active {
          border: 2px solid #AA7777;
          background-color: #FAF9F8 !important;
        }

        /* 非選択時のスタイル（他が選ばれている時） */
        .product-card.dimmed {
          opacity: 0.4;
        }

        .card-image-wrapper {
          width: 100%;
          height: 200px; /* 画像の高さ固定 */
          background-color: #f4f4f4;
          overflow: hidden;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover; /* 画像の比率を維持してトリミング */
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
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
        }

        .stock-badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          background-color: #EEE;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
      <div id="viz-root" class="catalog-container">
        <div id="grid-container" class="catalog-grid"></div>
      </div>
    `;
  },

  // 描画更新関数: データ変更やリサイズ時に呼ばれる [cite: 106, 163]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const gridContainer = element.querySelector("#grid-container");

    // エラーハンドリング [cite: 124, 135]
    this.clearErrors();
    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "表示するデータがありません。" });
      return;
    }

    // 必須項目のチェック (最低限1つのディメンションが必要)
    if (queryResponse.fields.dimensions.length < 1) {
       this.addError({ title: "Data Error", message: "少なくとも1つのディメンション（商品名）が必要です。" });
       return;
    }

    gridContainer.innerHTML = ""; // コンテナをクリア

    // データのフィールドマッピング（柔軟に対応させるロジック）
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    // 仮定: 1番目のディメンション=商品名, 2番目=画像URL (あれば)
    // 仮定: 1番目のメジャー=価格
    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;

    // データ行ごとのループ処理
    data.forEach(row => {
      // セルの値を取得 [cite: 218]
      const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
      const imageVal = imageField ? row[imageField].value : "https://dummyimage.com/300x300/eee/aaa&text=No+Image"; // 画像がない場合のダミー
      const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

      // カード要素の作成
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.backgroundColor = config.card_bg_color;
      card.style.borderRadius = `${config.border_radius}px`;
      card.style.color = config.font_color;

      // クロスフィルタリングの状態判定 [cite: 242]
      // 1 = SELECTED, 2 = UNSELECTED, 0 = NONE
      // getCrossfilterSelectionは行(row)を引数に取る
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      if (selectionState === 1) {
        card.classList.add("active");
      } else if (selectionState === 2) {
        card.classList.add("dimmed");
      }

      // カードのHTML構成
      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imageVal}" class="card-image" alt="${nameVal}" onerror="this.src='https://dummyimage.com/300x300/eee/aaa&text=Image+Error'">
        </div>
        <div class="card-info">
          <div class="product-name">${nameVal}</div>
          <div class="product-meta">
            <span class="product-price" style="color: ${config.accent_color};">${priceVal}</span>
            <span class="stock-badge">In Stock</span>
          </div>
        </div>
      `;

      // クリックイベント設定 [cite: 228]
      // ダッシュボード上の他のタイルをこの商品でフィルタリングする
      card.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event,
          });
        }
      };

      gridContainer.appendChild(card);
    });

    // 描画完了をLookerに通知 [cite: 206]
    done();
  }
});
