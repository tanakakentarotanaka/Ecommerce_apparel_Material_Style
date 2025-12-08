/**
 * Chic Status Toggle
 * ステータス（2〜3個想定）をスタイリッシュなトグルボタンとして表示し、
 * クロスフィルタリングを可能にするカスタムViz
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // アクティブ時の色（テーマカラー）
    active_color: {
      type: "string",
      label: "Active Color",
      display: "color",
      default: "#AA7777" // テーマのローズゴールド
    },
    // テキストサイズ
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 12,
      display: "range",
      min: 10,
      max: 20
    },
    // 角の丸み（デフォルトは完全な丸/ピル型）
    border_radius: {
      type: "number",
      label: "Border Radius (px)",
      default: 50, // 大きくしてカプセル型にする
      display: "text"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        .status-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center; /* 中央揃え */
          align-items: center;
          padding: 8px;
          font-family: 'Inter', sans-serif;
          height: 100%;
          box-sizing: border-box;
        }

        .status-pill {
          padding: 8px 24px; /* 横長のカプセル型 */
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border: 1px solid #E0E0E0; /* 薄いグレーの枠線 */
          background-color: #FFFFFF;
          color: #333333;
          font-weight: 500;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px; /* ある程度の幅を確保 */
        }

        .status-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.08);
          border-color: #ccc;
        }

        /* 選択されている状態 (Active) */
        .status-active {
          color: #FFFFFF !important;
          border-color: transparent;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          transform: scale(1.02);
        }

        /* 選択されていない状態 (Inactive/Faded) */
        .status-faded {
          opacity: 0.4;
          background-color: #F5F5F5;
          color: #999;
          transform: scale(0.98);
          box-shadow: none;
        }
      </style>
      <div id="vis-container" class="status-container"></div>
    `;
    this.container = element.querySelector("#vis-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.container.innerHTML = ""; // クリア

    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません" });
      return;
    }
    this.clearErrors();

    const dimension = queryResponse.fields.dimensions[0];
    const activeColor = config.active_color || "#AA7777";
    const fontSize = config.font_size || 12;
    const borderRadius = config.border_radius || 50;

    data.forEach((row) => {
      // データの取得
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      // クロスフィルターの状態取得
      // 0: NONE (初期状態), 1: SELECTED (選択中), 2: UNSELECTED (他が選択中)
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      // DOM要素作成
      const pill = document.createElement("div");
      pill.className = "status-pill";
      pill.innerText = label;

      // スタイル適用
      pill.style.fontSize = fontSize + "px";
      pill.style.borderRadius = borderRadius + "px";

      // 状態に応じたスタイル切り替え
      if (selectionState === 1) {
        // 選択中：背景色をテーマカラーに、文字を白に
        pill.classList.add("status-active");
        pill.style.backgroundColor = activeColor;
      } else if (selectionState === 2) {
        // 非選択：薄くする
        pill.classList.add("status-faded");
      }
      // state 0 (None) の場合はデフォルトCSSが適用される

      // クリックイベント：クロスフィルター
      pill.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      this.container.appendChild(pill);
    });

    done();
  }
});
