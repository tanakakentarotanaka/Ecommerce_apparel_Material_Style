/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Centered layout (Honeycomb-like vibe), Hexagon option, and responsive styling.
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
    // 形状を選択できるオプションを追加
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
          gap: 12px;
          /* 左揃え(flex-start)ではなく中央揃え(center)にすることで、
             ウィンドウ幅が変わっても常にバランス良く、おしゃれに見えます */
          justify-content: center;
          align-items: center;
          padding: 15px;
          font-family: 'Inter', sans-serif;
        }
        .swatch-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          position: relative;
        }
        .swatch-wrapper:hover {
          transform: translateY(-4px) scale(1.05);
          z-index: 10;
        }
        .swatch-item {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.2s;
          background-position: center;
          background-size: cover;
          position: relative;
        }

        /* 円形スタイル */
        .swatch-circle {
          border-radius: 50%;
          border: 2px solid transparent;
        }

        /* ハニカム（六角形）スタイル */
        .swatch-hexagon {
          border-radius: 0;
          /* CSSで六角形に切り抜く記述 */
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
          /* 六角形の場合、borderプロパティが効かないため、擬似要素などで枠線を表現するのが一般的ですが、
             今回はシンプルに影と余白で表現します */
          margin: -2px; /* 少し詰めるとハニカム感が増します */
        }

        /* 選択されていない状態 */
        .swatch-faded {
          opacity: 0.2;
          filter: grayscale(80%);
          transform: scale(0.9);
        }

        /* 選択されている状態 */
        .swatch-selected {
          /* 選択時はサイズを大きくして強調 */
          transform: scale(1.15);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          z-index: 5;
        }
        /* 円形の選択時のみ枠線をつける */
        .swatch-circle.swatch-selected {
          border-color: #333333;
        }

        .swatch-label {
          margin-top: 8px;
          font-size: 10px;
          color: #555;
          text-align: center;
          line-height: 1.1;
          letter-spacing: 0.5px;
          max-width: 70px;
          font-weight: 500;
          opacity: 0.8;
          /* ハニカム感を出すため、ラベルはホバー時のみ表示するのもおしゃれですが、
             今回は常時表示で薄めにしています */
        }
        .swatch-wrapper:hover .swatch-label {
          opacity: 1;
          color: #000;
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

      if (selectionState === 2) {
         wrapper.classList.add("swatch-faded");
      }

      const swatch = document.createElement("div");
      // 共通クラス(swatch-item)と形状クラス(swatch-hexagon等)を付与
      swatch.className = `swatch-item ${shapeClass}`;

      if (selectionState === 1) {
        swatch.classList.add("swatch-selected");
      }

      swatch.style.width = size + "px";
      swatch.style.height = size + "px";
      swatch.style.background = bgStyle;

      // 明るい色への枠線対応（円形のみ適用、六角形は影で表現）
      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      if (config.shape !== "hexagon" && (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white")) {
        swatch.style.border = "1px solid #d0d0d0";
      }

      const textLabel = document.createElement("div");
      textLabel.className = "swatch-label";
      textLabel.innerText = label;

      wrapper.appendChild(swatch);
      wrapper.appendChild(textLabel);

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
