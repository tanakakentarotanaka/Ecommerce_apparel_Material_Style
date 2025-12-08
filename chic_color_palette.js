/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Adds configurable Background Color and Corner Radius options.
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  options: {
    // 1. スウォッチのサイズ設定
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 35,
      display: "range",
      min: 20,
      max: 60,
      section: "Style" // 設定項目が増えたのでセクションで整理 [cite: 460]
    },
    // 2. 形状設定（選択肢にカスタムを追加）
    shape: {
      type: "string",
      label: "Shape",
      display: "select",
      values: [
        {"Honeycomb (Hexagon)": "hexagon"},
        {"Circle": "circle"},
        {"Square / Rounded (Custom)": "custom"} // 角丸を有効にするモード
      ],
      default: "hexagon",
      section: "Style"
    },
    // 3. 角丸の半径設定（ShapeでCustomを選んだ時に有効）
    swatch_radius: {
      type: "number",
      label: "Corner Radius (px)",
      default: 8,
      display: "range",
      min: 0,
      max: 30,
      section: "Style"
    },
    // 4. 背景色の設定
    viz_background_color: {
      type: "string",
      label: "Background Color",
      default: "transparent", // デフォルトは透明
      display: "color",       // カラーピッカーを表示 [cite: 426]
      section: "Style"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          align-items: center;
          padding: 15px;
          font-family: 'Inter', sans-serif;
          /* コンテナ自体の角丸も少しつけて柔らかく */
          border-radius: 8px;
          transition: background-color 0.3s;
          /* コンテナが小さすぎると背景が見えにくいので高さを確保 */
          min-height: 100%;
          box-sizing: border-box;
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

        /* 円形 */
        .swatch-circle {
          border-radius: 50%;
          border: 2px solid transparent;
        }

        /* ハニカム（六角形） */
        .swatch-hexagon {
          border-radius: 0;
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
          margin: -2px;
        }

        /* カスタム（四角・角丸） */
        .swatch-custom {
          /* border-radiusはJSで動的に適用します */
          border: 2px solid transparent;
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
        /* 六角形以外の場合の選択枠線 */
        .swatch-circle.swatch-selected,
        .swatch-custom.swatch-selected {
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
          top: 115%;
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

    // 1. 背景色の適用
    // カラーピッカーで選んだ色をコンテナ全体に適用します
    this.container.style.backgroundColor = config.viz_background_color || "transparent";

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

    // オプション取得
    const size = config.swatch_size || 35;

    // 形状とクラスの決定
    let shapeClass = "swatch-hexagon";
    if (config.shape === "circle") shapeClass = "swatch-circle";
    if (config.shape === "custom") shapeClass = "swatch-custom";

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

      swatch.style.width = size + "px";
      swatch.style.height = size + "px";
      swatch.style.background = bgStyle;

      // 2. 角丸（Radius）の適用
      // Shapeが "Square / Rounded (Custom)" の時のみ、スライダーの値を適用
      if (config.shape === "custom") {
        swatch.style.borderRadius = (config.swatch_radius || 0) + "px";
      }

      // 明るい色の枠線対応
      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      // 六角形以外の場合のみ枠線をつける
      if (config.shape !== "hexagon" && (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white")) {
        swatch.style.border = "1px solid #d0d0d0";
      }

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
