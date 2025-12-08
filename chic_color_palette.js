/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Layout fixed by hiding labels. Labels now appear as styled tooltips on hover.
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  options: {
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 35,
      display: "range",
      min: 20,
      max: 60
    },
    shape: {
      type: "string",
      label: "Shape",
      display: "select",
      values: [
        {"Circle": "circle"},
        {"Honeycomb (Hexagon)": "hexagon"}
      ],
      default: "hexagon"
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
        }

        .swatch-wrapper {
          position: relative; /* ツールチップの基準点 */
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
          z-index: 1;
        }

        .swatch-wrapper:hover {
          transform: translateY(-4px) scale(1.1);
          z-index: 100; /* ホバー時は最前面に */
        }

        .swatch-item {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.2s;
          background-position: center;
          background-size: cover;
        }

        /* 円形スタイル */
        .swatch-circle {
          border-radius: 50%;
          border: 2px solid transparent;
        }

        /* ハニカム（六角形）スタイル */
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
        .swatch-circle.swatch-selected {
          border-color: #333333;
        }

        /* --- ツールチップのスタイル設定 --- */
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

          /* 位置調整: アイコンの下に表示 */
          top: 115%;
          left: 50%;
          transform: translateX(-50%);

          /* テキスト設定 */
          font-size: 11px;
          white-space: nowrap; /* 改行させない */
          pointer-events: none; /* ツールチップ自体はクリックの邪魔をしない */
          transition: opacity 0.2s, visibility 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* 三角形の矢印（吹き出しのしっぽ） */
        .swatch-tooltip::after {
          content: "";
          position: absolute;
          bottom: 100%; /* ツールチップの上側 */
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent #333333 transparent;
        }

        /* ホバー時にツールチップを表示 */
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
    const shapeClass = (config.shape === "hexagon") ? "swatch-hexagon" : "swatch-circle";

    data.forEach((row) => {
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      let bgStyle = colorMap[String(value).toLowerCase()] || defaultColor;

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      // ラッパー自体にはサイズを持たせず、中の要素で決める（配置ズレ防止）
      // ただしクリック判定エリアのために最小サイズは確保される

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

      // 明るい色の枠線対応
      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      if (config.shape !== "hexagon" && (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white")) {
        swatch.style.border = "1px solid #d0d0d0";
      }

      // --- 変更点: ラベルをTooltip用のdivに変更 ---
      const tooltip = document.createElement("div");
      tooltip.className = "swatch-tooltip";
      tooltip.innerText = label;

      wrapper.appendChild(swatch);
      wrapper.appendChild(tooltip); // TooltipをDOMに追加（普段はCSSで非表示）

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
