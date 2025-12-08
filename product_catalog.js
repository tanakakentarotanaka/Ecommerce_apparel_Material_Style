/**
 * Chic Color Palette Selector for Fashion BI
 * Updated: Default size set to smaller (25px) and configurable via UI.
 */

looker.plugins.visualizations.add({
  // ユーザー設定オプション
  // ここで設定した項目がLookerのVisualization編集タブに表示されます
  options: {
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 25,        // デフォルトを小さくしました
      display: "range",
      min: 15,            // より小さく設定できるように変更
      max: 50             // 最大値もバランスを見て調整
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px; /* サイズに合わせてギャップも少し狭めました */
          justify-content: flex-start; /* 左寄せに変更（小さいと左寄せの方が自然なため） */
          padding: 10px;
          font-family: 'Inter', sans-serif;
        }
        .swatch-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
          /* 幅指定を削除し、コンテンツに合わせる形に調整 */
          margin-bottom: 8px;
        }
        .swatch-wrapper:hover {
          transform: translateY(-2px);
        }
        .swatch-circle {
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* 影も少し控えめに */
          border: 2px solid transparent;
          transition: all 0.2s;
          background-position: center;
          background-size: cover;
        }
        /* 選択されていない状態 */
        .swatch-faded {
          opacity: 0.3;
          transform: scale(0.9);
        }
        /* 選択されている状態 */
        .swatch-selected {
          border-color: #333333;
          transform: scale(1.1);
        }
        .swatch-label {
          margin-top: 4px;
          font-size: 9px; /* 文字サイズも少し小さく */
          color: #333333;
          text-align: center;
          line-height: 1.1;
          letter-spacing: 0.2px;
          max-width: 60px; /* 長い色の名前が広がりすぎないように制限 */
          word-wrap: break-word;
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

    // カラーマッピング（前回の内容を維持）
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

    data.forEach((row) => {
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);

      let bgStyle = colorMap[String(value).toLowerCase()];
      if (!bgStyle) {
          bgStyle = defaultColor;
      }

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      if (selectionState === 2) {
         wrapper.classList.add("swatch-faded");
      }

      const circle = document.createElement("div");
      circle.className = "swatch-circle";

      if (selectionState === 1) {
        circle.classList.add("swatch-selected");
      }

      // Configからサイズを取得（デフォルトは25px）
      const size = config.swatch_size || 25;
      circle.style.width = size + "px";
      circle.style.height = size + "px";
      circle.style.background = bgStyle;

      const lightColors = ["#FFFFFF", "#FFFFF0", "#F7E7CE", "#E0DCC8", "#E8E0D5"];
      if (lightColors.includes(bgStyle.toUpperCase()) || label.toLowerCase() === "white") {
        circle.style.border = "1px solid #d0d0d0";
      }

      const textLabel = document.createElement("div");
      textLabel.className = "swatch-label";
      textLabel.innerText = label;

      wrapper.appendChild(circle);
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
