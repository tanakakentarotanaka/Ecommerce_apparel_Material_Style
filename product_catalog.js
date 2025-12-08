/**
 * Fashion BI Product Catalog Visualization
 * Theme: Rose Quartz Runway
 * Ref: API 2.0 Reference
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
      label: "Accent Color",
      default: "#AA7777", // Rose Quartz theme color
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

  create: function(element, config) {
    // コンテナの基本スタイル設定
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.overflow = "hidden";
    element.style.padding = "0";
    element.style.fontFamily = "'Inter', sans-serif";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // 標準エラーをクリア

    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    // --- ガイド画面 (Empty State) の表示判定 ---
    // ディメンションが1つも選ばれていない、またはデータがない場合に表示
    if (dimensions.length === 0) {
        element.innerHTML = `
            <style>
                .viz-guide {
                    padding: 40px;
                    text-align: center;
                    color: #555;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: #FAF9F8;
                }
                .viz-guide h2 {
                    color: #AA7777;
                    margin-bottom: 20px;
                }
                .viz-guide-table {
                    margin: 0 auto;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 14px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .viz-guide-table th, .viz-guide-table td {
                    padding: 12px 20px;
                    border-bottom: 1px solid #eee;
                }
                .viz-guide-table th {
                    background-color: #f4f4f4;
                    font-weight: 600;
                }
                .badge-req {
                    background: #FFEBEE; color: #C62828; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;
                }
                .badge-opt {
                    background: #E8F5E9; color: #2E7D32; padding: 2px 8px; border-radius: 4px; font-size: 11px;
                }
            </style>
            <div class="viz-guide">
                <h2>🛍️ Product Catalog Viz Setup</h2>
                <p>この可視化を使用するには、以下の順序でフィールドを選択してください：</p>
                <br>
                <table class="viz-guide-table">
                    <thead>
                        <tr>
                            <th>順序</th>
                            <th>フィールドタイプ</th>
                            <th>用途</th>
                            <th>必須/任意</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Dimension</td>
                            <td><strong>商品名</strong> (タイトル)</td>
                            <td><span class="badge-req">必須</span></td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Dimension</td>
                            <td><strong>商品画像URL</strong></td>
                            <td><span class="badge-opt">推奨</span></td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Dimension</td>
                            <td><strong>在庫ステータス</strong></td>
                            <td><span class="badge-opt">推奨</span></td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>Measure</td>
                            <td><strong>価格</strong></td>
                            <td><span class="badge-opt">任意</span></td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Measure</td>
                            <td><strong>評価スコア</strong> (数値)</td>
                            <td><span class="badge-opt">任意</span></td>
                        </tr>
                    </tbody>
                </table>
                <br>
                <p style="font-size: 12px; color: #888;">※ 左側のフィールドピッカーから上記の順にクリックしてください。</p>
            </div>
        `;
        done();
        return;
    }

    // --- データはあるが必須要件を満たさない場合のエラー ---
    // ここではあえてLooker標準のaddErrorを使わず、ガイドを表示したままにするか、
    // あるいは最小限のメッセージを出すか選べますが、今回は描画を続行します。

    // --- メイン描画処理 (前回のコードと同じロジック) ---
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
          background-color: #FAF9F8;
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          padding-bottom: 20px;
        }
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
          padding-top: 100%;
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
        .stock-badge {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
        }
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

    const gridContainer = element.querySelector("#grid-container");

    const nameField = dimensions[0].name;
    const imageField = dimensions.length > 1 ? dimensions[1].name : null;
    const statusField = dimensions.length > 2 ? dimensions[2].name : null;
    const priceField = measures.length > 0 ? measures[0].name : null;

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

    data.forEach(row => {
      const nameVal = LookerCharts.Utils.textForCell(row[nameField]);
      const imageVal = imageField ? row[imageField].value : "";
      const statusVal = statusField ? LookerCharts.Utils.textForCell(row[statusField]) : "In Stock";
      const priceVal = priceField ? LookerCharts.Utils.textForCell(row[priceField]) : "";

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

    done();
  }
});
