/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Fully mapped to the 17 refined fashion colors.
 */

looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
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
        {"Square": "square"},
        {"Honeycomb (Hexagon)": "hexagon"}
      ],
      default: "square" // デフォルトをスクエアに設定
    },
    vis_bg_color: {
      type: "string",
      label: "Background Color",
      display: "color",
      default: "transparent"
    },
    vis_border_radius: {
      type: "number",
      label: "Background Radius (px)",
      default: 0,
      display: "text"
    },
    swatch_radius: {
      type: "number",
      label: "Swatch Radius (for Square) px",
      default: 4,
      display: "text"
    }
  },

  create: function(element, config) {
    // --- スタイル定義 ---
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

        /* 形状別クラス */
        .swatch-circle { border-radius: 50%; border: 2px solid transparent; }
        .swatch-square { border: 2px solid transparent; }
        .swatch-hexagon {
          border-radius: 0;
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
          margin: -2px;
        }

        /* 状態別クラス */
        .swatch-faded {
          opacity: 0.2;
          filter: grayscale(80%);
          transform: scale(0.9);
        }

        .swatch-selected {
          transform: scale(1.15);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          z-index: 10;
        }

        /* 選択時の枠線色（テーマカラーの黒に近いグレー） */
        .swatch-circle.swatch-selected,
        .swatch-square.swatch-selected {
          border-color: #333333;
        }

        /* ツールチップ（ホバー時の色名表示） */
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
    this.clearErrors();

    if (!data || data.length === 0) {
      this.addError({ title: "No Data", message: "データがありません" });
      return;
    }

    // 背景設定の適用
    this.container.style.backgroundColor = config.vis_bg_color || "transparent";
    this.container.style.borderRadius = (config.vis_border_radius || 0) + "px";

    // --- 17色のカラーマッピング定義 ---
    // キーはすべて小文字で定義（LookMLからの値をtoLowerCaseして照合するため）
    const colorMap = {
      // 1. White Group
      "white":       "#FFFFFF",
      "ivory":       "#FAF7F0",

      // 2. Natural Group
      "oatmeal":     "#E0DCC8",
      "champagne":   "#F3E5AB",
      "beige":       "#DBCDBA",
      "camel":       "#C19A6B",

      // 3. Warm/Pink Group
      "blush":       "#E6B0AA",
      "dusty rose":  "#C27BA0",

      // 4. Brown Group
      "cognac":      "#9A463D",
      "dark brown":  "#4E342E",

      // 5. Green/Blue Group
      "olive":       "#708238",
      "slate blue":  "#607D8B",
      "navy":        "#202A44",

      // 6. Mono Group
      "grey":        "#9E9E9E",
      "charcoal":    "#36454F",
      "black":       "#222222",

      // 7. Multi/Other
      "multi":       "linear-gradient(135deg, #E0DCC8 25%, #9E9E9E 50%, #36454F 75%)"
    };

    const defaultColor = "#E0E0E0"; // マッピング外の色が来た場合のフォールバック
    const dimension = queryResponse.fields.dimensions[0];

    // Config値の取得
    const size = config.swatch_size || 35;
    const currentShape = config.shape || "square";

    // 形状クラスの決定
    let shapeClass = "swatch-square";
    if (currentShape === "circle") shapeClass = "swatch-circle";
    if (currentShape === "hexagon") shapeClass = "swatch-hexagon";

    data.forEach((row) => {
      // 値の取得
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]); // 表示ラベル

      // カラーコードの取得 (小文字化して辞書引き)
      let bgStyle = colorMap[String(value).toLowerCase()];
      if (!bgStyle) {
          bgStyle = defaultColor;
      }

      // クロスフィルター状態の取得
      [cite_start]// [cite: 339] LookerCharts.Utils.getCrossfilterSelection
      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      // --- DOM要素の構築 ---
      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      // 非選択状態（他が選ばれている時）
      if (selectionState === 2) {
         wrapper.classList.add("swatch-faded");
      }

      const swatch = document.createElement("div");
      swatch.className = `swatch-item ${shapeClass}`;

      // 選択状態
      if (selectionState === 1) {
        swatch.classList.add("swatch-selected");
      }

      // スタイル適用
      swatch.style.width = size + "px";
      swatch.style.height = size + "px";
      swatch.style.background = bgStyle;

      // 角丸適用（スクエアの場合のみ）
      if (currentShape === "square") {
        swatch.style.borderRadius = (config.swatch_radius || 4) + "px";
      } else {
        swatch.style.borderRadius = "";
      }

      // 明るい色には薄い枠線を付けて視認性を確保
      // (White, Ivory, Oatmeal, Champagne, Beige など)
      const lightColors = ["white", "ivory", "champagne", "oatmeal", "beige"];
      if (currentShape !== "hexagon" && lightColors.includes(String(value).toLowerCase())) {
        swatch.style.border = "1px solid #d0d0d0";
      }

      // ツールチップの作成
      const tooltip = document.createElement("div");
      tooltip.className = "swatch-tooltip";
      tooltip.innerText = label;

      wrapper.appendChild(swatch);
      wrapper.appendChild(tooltip);

      // クリックイベント設定（クロスフィルター実行）
      [cite_start]// [cite: 325] LookerCharts.Utils.toggleCrossfilter
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
