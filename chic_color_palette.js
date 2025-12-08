/**
 * Chic Color Palette Selector for Fashion BI
 * Updated:
 * 1. Added "Square" shape option.
 * 2. Added Container Background Color & Border Radius settings.
 * 3. Added Swatch Border Radius setting (for Square).
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  options: {
    // --- 既存の設定 ---
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 35,
      display: "range",
      min: 20,
      max: 80
    },
    shape: {
      type: "string",
      label: "Shape",
      display: "select",
      values: [
        {"Circle": "circle"},
        {"Square": "square"},         // 新しく追加
        {"Honeycomb (Hexagon)": "hexagon"}
      ],
      default: "square"
    },

    // --- 新規追加設定 ---

    // 1. 背景色設定
    vis_bg_color: {
      type: "string",
      label: "Background Color",
      display: "color",
      default: "transparent" // デフォルトは透明
    },

    // 2. 背景の角丸設定 (px)
    vis_border_radius: {
      type: "number",
      label: "Background Radius (px)",
      default: 0,
      display: "text"
    },

    // 3. スクエア選択時の角丸設定 (px)
    swatch_radius: {
      type: "number",
      label: "Swatch Radius (for Square) px",
      default: 4,
      display: "text"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        /* コンテナ自体のスタイルを後でJSで上書きできるように定義 */
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          align-items: center;
          padding: 15px;
          font-family: 'Inter', sans-serif;
          /* 高さが足りない場合に背景色が途切れないように */
          min-height: 95%;
          box-sizing: border-box;
          transition: all 0.3s;
        }

        .swatch-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
          z-index: 1;
        }

        .swatch-wrapper:hover {
          transform: translateY(-4px) scale(1.1);
          z-index: 100;
        }

        .swatch-item {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.2s;
          background-position: center;
          background-size: cover;
        }

        /* 形状別の基本スタイル */

        /* 円形 */
        .swatch-circle {
          border-radius: 50%;
          border: 2px solid transparent;
        }

        /* 正方形（角丸はJSで制御） */
        .swatch-square {
          border: 2px solid transparent;
        }

        /* 六角形 */
        .swatch-hexagon {
          border-radius: 0;
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
          margin: -2px;
        }

        /* 選択されていない状態 */
        .swatch-faded {
          opacity: 0.2;
          filter: grayscale(80%);
          transform: scale(0.9);
        }

        /* 選択されている状態 */
        .swatch-selected {
          transform: scale(1.15);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          z-index: 10;
        }
        /* 円と四角の選択時のみ枠線色をつける */
        .swatch-circle.swatch-selected,
        .swatch-square.swatch-selected {
          border-color: #333333;
        }

        /* ツールチップ */
        .swatch-tooltip {
          visibility: hidden;
          opacity: 0;
          background-color: #333333;
          color: #fff;
          text-align: center;
          border-radius: 4px;
          padding: 5px 10px;
          position: absolute;
          z-index: 1000;
          top: 125%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          white-space: nowrap;
          pointer-events: none;
          transition: opacity 0.2s, visibility 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .swatch-tooltip::after {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent #333333 transparent;
        }

        .swatch-wrapper:hover .swatch-tooltip {
          visibility: visible;
          opacity: 1;
        }
      </style>
      <div id="vis-container" class="palette-container"></div>
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

    // --- 1. 背景スタイルの適用 ---
    // 背景色
    this.container.style.backgroundColor = config.vis_bg_color || "transparent";
    // 背景の角丸 (px)
    this.container.style.borderRadius = (config.vis_border_radius || 0) + "px";


    // カラーマッピング
    const colorMap = {
      "beige":       "#E8E0D5",
      "black":       "#222222",
      "camel":       "#C19A6B",
      "champagne":   "#F7E7CE",
      "charcoal":    "#36454F",
      "cognac":      "#9A463D",
      "dark brown":  "#4B3621",
      "grey":        "#9E9E9E",
      "ivory":       "#FFFFF0",
      "navy":        "#202A44",
      "oatmeal":     "#E0DCC8",
      "red":         "#B71C1C",
      "taupe":       "#876C5E",
      "white":       "#FFFFFF",
      "multi-muted": "linear-gradient(135deg, #D7CCC8 25%, #90A4AE 50%, #BCAAA4 75%)"
    };

    const defaultColor = "#E0E0E0";
    const dimension = queryResponse.fields.dimensions[0];

    // オプション値の取得
    const size = config.swatch_size || 35;
    const currentShape = config.shape || "square";

    // 形状に応じたクラス名の決定
    let shapeClass = "swatch-square";
    if (currentShape === "circle") shapeClass = "swatch-circle";
    if (currentShape === "hexagon") shapeClass = "swatch-hexagon";

    data.forEach((row) => {
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      let bgStyle = colorMap[String(value).toLowerCase()] || defaultColor;

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      if (selectionState === 2) {
         wrapper.classList.add("swatch-faded");
      }

      const swatch = document.createElement("div");
      swatch.className = `swatch-item ${shapeClass}`;

      if (selectionState === 1) {
        swatch.classList.add("swatch-selected");
      }

      // サイズ適用
      swatch.style.width = size + "px";
      swatch.style.height = size + "px";

      // 背景色適用
      swatch.style.background = bgStyle;

      // --- 2. スウォッチの角丸設定 (スクエア時のみ適用) ---
      if (currentShape === "square") {
        swatch.style.borderRadius = (config.swatch_radius || 0) + "px";
      } else {
        // 円や六角形に切り替えた時にスタイルが残らないようにリセット
        swatch.style.borderRadius = "";
      }


      // 明るい色の枠線対応（六角形以外で適用）
      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      if (currentShape !== "hexagon" && (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white")) {
        swatch.style.border = "1px solid #d0d0d0";
      }

      // ツールチップ
      const tooltip = document.createElement("div");
      tooltip.className = "swatch-tooltip";
      tooltip.innerText = label;

      wrapper.appendChild(swatch);
      wrapper.appendChild(tooltip);

      wrapper.onclick = (event) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({
            row: row,
            event: event
          });
        }
      };

      this.container.appendChild(wrapper);
    });

    done();
  }
});
