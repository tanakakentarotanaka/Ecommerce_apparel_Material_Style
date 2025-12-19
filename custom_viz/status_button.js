/**
 * Chic Status Toggle
 * Updated: Added Container Background, Container Radius, and Inactive Button Color settings.
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- ボタン（Pill）の設定 ---
    active_color: {
      type: "string",
      label: "Button Active Color",
      display: "color",
      default: "#AA7777",
      section: "Button Style"
    },
    inactive_color: { // 新規: 未選択時のボタン背景色
      type: "string",
      label: "Button Inactive Color",
      display: "color",
      default: "#FFFFFF",
      section: "Button Style"
    },
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 12,
      display: "range",
      min: 10,
      max: 20,
      section: "Button Style"
    },
    pill_border_radius: { // ラベル変更: ボタンの角丸
      type: "number",
      label: "Button Radius (px)",
      default: 50,
      display: "text",
      section: "Button Style"
    },

    // --- コンテナ（背景）の設定 ---
    vis_bg_color: { // 新規: Viz全体の背景色
      type: "string",
      label: "Container Background",
      display: "color",
      default: "transparent",
      section: "Container Style"
    },
    vis_border_radius: { // 新規: Viz全体の角丸
      type: "number",
      label: "Container Radius (px)",
      default: 0,
      display: "text",
      section: "Container Style"
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
          padding: 10px;
          font-family: 'Inter', sans-serif;
          height: 100%;
          box-sizing: border-box;
          transition: all 0.3s; /* 背景色変更時のアニメーション */
        }

        .status-pill {
          padding: 8px 24px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border: 1px solid transparent; /* 枠線は色指定で制御 */
          font-weight: 500;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
        }

        .status-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.08);
          filter: brightness(0.98); /* ホバー時に少し暗く */
        }

        /* 選択されている状態 (Active) */
        .status-active {
          color: #FFFFFF !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          transform: scale(1.02);
          border-color: transparent;
        }

        /* 選択されていない状態 (Inactive) */
        .status-inactive {
          /* 色はJSで制御 */
          color: #333333;
          border: 1px solid #E0E0E0; /* デフォルトの枠線 */
        }

        /* 他が選択されている状態 (Faded) */
        .status-faded {
          opacity: 0.5;
          transform: scale(0.98);
          box-shadow: none;
          border-color: transparent;
        }
      </style>
      <div id="vis-container" class="status-container"></div>
    `;
    this.container = element.querySelector("#vis-container");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.container.innerHTML = "";

    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません" });
      return;
    }
    this.clearErrors();

    // オプション値の取得
    const dimension = queryResponse.fields.dimensions[0];

    // Button Style
    const activeColor = config.active_color || "#AA7777";
    const inactiveColor = config.inactive_color || "#FFFFFF";
    const fontSize = config.font_size || 12;
    const pillRadius = config.pill_border_radius || 50;

    // Container Style
    const containerBg = config.vis_bg_color || "transparent";
    const containerRadius = config.vis_border_radius || 0;

    // --- コンテナスタイルの適用 ---
    this.container.style.backgroundColor = containerBg;
    this.container.style.borderRadius = containerRadius + "px";

    data.forEach((row) => {
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      // 0: NONE, 1: SELECTED, 2: UNSELECTED
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const pill = document.createElement("div");
      pill.className = "status-pill";
      pill.innerText = label;

      // 共通スタイル
      pill.style.fontSize = fontSize + "px";
      pill.style.borderRadius = pillRadius + "px";

      // 状態別スタイル適用
      if (selectionState === 1) {
        // Active
        pill.classList.add("status-active");
        pill.style.backgroundColor = activeColor;
      } else if (selectionState === 2) {
        // Faded (他が選択されている)
        pill.classList.add("status-faded");
        pill.style.backgroundColor = inactiveColor; // 色はInactiveと同じにして薄くする
      } else {
        // Inactive (初期状態 - 何も選択されていない)
        pill.classList.add("status-inactive");
        pill.style.backgroundColor = inactiveColor;
      }

      // クリックイベント
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
