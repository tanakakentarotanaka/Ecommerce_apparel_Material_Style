/**
 * Chic Color Palette Selector - "The Fabric Library" Edition
 * Supports 60+ fashion colors including patterns (Stripe, Check, Floral, Tortoise) via CSS.
 */

looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
    swatch_size: {
      type: "number",
      label: "Swatch Size (px)",
      default: 30, // 数が多いのでデフォルトを少し小さめに
      display: "range",
      min: 15,
      max: 60
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
      default: "hexagon" // 数が多いときはハニカムが一番きれいに収まります
    },
    // コンテナ設定
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
    // スクエア用
    swatch_radius: {
      type: "number",
      label: "Swatch Radius (px)",
      default: 4,
      display: "text"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px; /* 数が多いのでギャップを詰め気味に */
          justify-content: center;
          align-items: center;
          padding: 10px;
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
          transform: translateY(-4px) scale(1.2); /* ホバー時は大きく拡大 */
          z-index: 100;
        }

        .swatch-item {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s;
          background-position: center;
          background-size: cover;
          /* パターン表現のために重要 */
          background-repeat: no-repeat;
        }

        /* 形状スタイル */
        .swatch-circle { border-radius: 50%; border: 1px solid rgba(0,0,0,0.05); }
        .swatch-square { border: 1px solid rgba(0,0,0,0.05); }
        .swatch-hexagon {
          border-radius: 0;
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
          margin: -1px; /* 詰め気味に */
        }

        /* 状態スタイル */
        .swatch-faded {
          opacity: 0.15; /* 数が多いので非選択時はより薄く */
          filter: grayscale(90%);
          transform: scale(0.8);
        }

        .swatch-selected {
          transform: scale(1.2);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          z-index: 10;
          border: 2px solid #333; /* 選択強調 */
        }
        .swatch-hexagon.swatch-selected { border: none; } /* 六角形はボーダーなし */

        /* ツールチップ */
        .swatch-tooltip {
          visibility: hidden;
          opacity: 0;
          background-color: #222;
          color: #fff;
          text-align: center;
          border-radius: 4px;
          padding: 6px 10px;
          position: absolute;
          z-index: 1000;
          top: 130%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          white-space: nowrap;
          pointer-events: none;
          transition: opacity 0.2s;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .swatch-tooltip::after {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent #222 transparent;
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
    if (!data || data.length === 0) return;

    // 背景設定適用
    this.container.style.backgroundColor = config.vis_bg_color || "transparent";
    this.container.style.borderRadius = (config.vis_border_radius || 0) + "px";

    // --- ファブリック・カラーマップ定義 ---
    const map = {
      // Basic & Earth Tones
      "black": "#1a1a1a",
      "white": "#ffffff",
      "camel": "#c19a6b",
      "charcoal": "#36454f",
      "ivory": "#fffff0",
      "red": "#b71c1c",
      "dark brown": "#4b3621",
      "brown": "#795548",
      "navy": "#000080",
      "olive": "#556b2f",
      "beige": "#f5f5dc",
      "oatmeal": "#e0dcc8",
      "taupe": "#483c32",
      "grey": "#808080",
      "sand": "#c2b280",
      "khaki": "#f0e68c",
      "cream": "#fffdd0",
      "stone": "#877f7d",
      "nude": "#e3bc9a",
      "blush": "#de5d83",
      "tan": "#d2b48c",
      "rust": "#b7410e",
      "natural": "#fbf6e3",
      "midnight blue": "#191970",
      "champagne": "#f7e7ce",
      "cognac": "#9a463d",
      "burgundy": "#800020",
      "indigo": "#4b0082",
      "dark green": "#006400",
      "green": "#008000",
      "emerald": "#50c878",
      "teal": "#008080",
      "light blue": "#add8e6",
      "blue": "#0000ff",
      "pink": "#ffc0cb",
      "yellow": "#ffd700",

      // Metallics (Gradients for shine)
      "gold": "linear-gradient(135deg, #ffd700, #fdb931)",
      "silver": "linear-gradient(135deg, #e0e0e0, #b0b0b0)",
      "metallic": "linear-gradient(45deg, #ddd, #999, #ddd)",

      // Denim & Washes
      "denim": "linear-gradient(to bottom, #355C7D, #6C5B7B)",
      "light wash": "#a3c4dc",
      "dark wash": "#1e3d59",
      "grey wash": "#708090",
      "blue wash": "#6497b1",

      // Patterns & Textures (CSS Magic)

      // Stripe: 斜めストライプ
      "stripe": "repeating-linear-gradient(45deg, #fff, #fff 5px, #333 5px, #333 10px)",
      "blue stripe": "repeating-linear-gradient(45deg, #fff, #fff 5px, #6497b1 5px, #6497b1 10px)",

      // Check: 格子柄
      "check": "repeating-linear-gradient(0deg, transparent, transparent 9px, #333 10px), repeating-linear-gradient(90deg, #fff, #fff 9px, #333 10px)",

      // Multi / Print: 抽象的なマルチカラー
      "multi": "linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
      "multi-muted": "linear-gradient(135deg, #D7CCC8 25%, #90A4AE 50%, #BCAAA4 75%)",
      "print": "radial-gradient(circle, #f06 10%, transparent 11%), radial-gradient(circle at 40% 40%, #fd0 10%, transparent 11%), #eee",
      "floral": "radial-gradient(circle at 50% 50%, #ff9a9e, #fad0c4)", // 簡易的な花柄イメージ
      "blue print": "radial-gradient(circle, #add8e6 20%, transparent 20%), #000080",
      "grey print": "repeating-radial-gradient(#ccc, #ccc 2px, #999 3px)",
      "grey marl": "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZWVlIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM5OTkiLz4KPC9zdmc+')", // ノイズテクスチャ風

      // Split Colors (2色)
      "cream/navy": "linear-gradient(90deg, #fffdd0 50%, #000080 50%)",
      "blue/white": "linear-gradient(90deg, #0000ff 50%, #ffffff 50%)",

      // Special Materials
      "leather": "#5D4037",
      "canvas/leather": "linear-gradient(90deg, #f0e68c 60%, #5D4037 60%)",
      "tortoise": "radial-gradient(circle at 30% 30%, #ffd700 0%, transparent 20%), radial-gradient(circle at 70% 70%, #8b4513 0%, transparent 30%), #3e2723", // べっ甲風
      "patterned": "conic-gradient(#eee 25%, #333 0 50%, #eee 0 75%, #333 0)", // 幾何学模様
      "pattern": "conic-gradient(#eee 25%, #333 0 50%, #eee 0 75%, #333 0)"
    };

    const defaultColor = "#e0e0e0";
    const dimension = queryResponse.fields.dimensions[0];

    const size = config.swatch_size || 30;
    const currentShape = config.shape || "hexagon";
    let shapeClass = "swatch-hexagon";
    if (currentShape === "circle") shapeClass = "swatch-circle";
    if (currentShape === "square") shapeClass = "swatch-square";

    data.forEach((row) => {
      const value = row[dimension.name].value;
      const label = LookerCharts.Utils.textForCell(row[dimension.name]);
      const key = String(value).toLowerCase().trim();

      let bgStyle = map[key] || defaultColor;

      // 未定義の「〇〇 Print」などが来た場合の簡易フォールバック（文字が含まれていればグレー扱いなど）
      if (!map[key] && key.includes("print")) bgStyle = map["grey print"];

      const selectionState = LookerCharts.Utils.getCrossfilterSelection(row);

      const wrapper = document.createElement("div");
      wrapper.className = "swatch-wrapper";

      if (selectionState === 2) wrapper.classList.add("swatch-faded");

      const swatch = document.createElement("div");
      swatch.className = `swatch-item ${shapeClass}`;

      if (selectionState === 1) swatch.classList.add("swatch-selected");

      swatch.style.width = size + "px";
      swatch.style.height = size + "px";
      swatch.style.background = bgStyle;
      // グラデーションの場合、background-imageとしてセットされるのでプロパティ上書きに注意
      // colorMapの値が "linear-gradient" 等を含む場合は background: value でOK

      // スクエア時の角丸
      if (currentShape === "square") {
        swatch.style.borderRadius = (config.swatch_radius || 4) + "px";
      }

      // 明るい色への枠線対応 (borderはCSSクラスで薄くつけているが、白は見にくいので濃くする)
      if (["white", "ivory", "cream", "natural", "off white"].includes(key)) {
        swatch.style.border = "1px solid #ccc";
      }

      const tooltip = document.createElement("div");
      tooltip.className = "swatch-tooltip";
      tooltip.innerText = label;

      wrapper.appendChild(swatch);
      wrapper.appendChild(tooltip);

      wrapper.onclick = (e) => {
        if (details.crossfilterEnabled) {
          LookerCharts.Utils.toggleCrossfilter({ row: row, event: e });
        }
      };

      this.container.appendChild(wrapper);
    });

    done();
  }
});
