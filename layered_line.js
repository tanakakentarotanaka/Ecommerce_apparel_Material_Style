looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
    // 1. Primary Axis Color
    line_color: {
      type: "string",
      label: "Primary Axis Color (Left)",
      display: "color",
      default: "#AA7777",
      section: "Style",
      order: 1
    },
    // 2. Secondary Axis Color
    secondary_line_color: {
      type: "string",
      label: "Secondary Axis Color (Right)",
      display: "color",
      default: "#5F8D8B",
      section: "Style",
      order: 2
    },
    // 3. Inactive Line Color
    background_line_color: {
      type: "string",
      label: "Inactive Line Color",
      display: "color",
      default: "#D3CCC6",
      section: "Style",
      order: 3
    },
    // 4. Chart Background
    chart_background_color: {
      type: "string",
      label: "Chart Background Color",
      display: "color",
      default: "#ffffff",
      section: "Style",
      order: 4
    },
    // 5. Index Font Size
    index_font_size: {
      type: "string",
      label: "Index Font Size",
      default: "11px",
      placeholder: "e.g. 12px, 0.9rem",
      section: "Style",
      order: 5
    },
    // --- Box Model & Shadow ---
    card_margin: {
      type: "string",
      label: "Card Margin (Outer Spacing)",
      default: "0px",
      section: "Box Model & Shadow",
      order: 1
    },
    card_padding: {
      type: "string",
      label: "Card Padding (Inner Spacing)",
      default: "16px",
      section: "Box Model & Shadow",
      order: 2
    },
    shadow_x: {
      type: "string",
      label: "Shadow X Offset",
      default: "0px",
      section: "Box Model & Shadow",
      order: 3
    },
    shadow_y: {
      type: "string",
      label: "Shadow Y Offset",
      default: "4px",
      section: "Box Model & Shadow",
      order: 4
    },
    shadow_blur: {
      type: "string",
      label: "Shadow Blur Radius",
      default: "12px",
      section: "Box Model & Shadow",
      order: 5
    },
    shadow_spread: {
      type: "string",
      label: "Shadow Spread",
      default: "0px",
      section: "Box Model & Shadow",
      order: 6
    },
    shadow_color: {
      type: "string",
      label: "Shadow Color",
      default: "rgba(0,0,0,0.05)",
      section: "Box Model & Shadow",
      order: 7
    },
    // --- Config Section ---
    show_grid: {
      type: "boolean",
      label: "Show Grid Lines",
      default: true,
      section: "Config",
      order: 1
    },
    x_axis_label_rotation: {
      type: "number",
      label: "X-Axis Label Rotation",
      default: 0,
      placeholder: "e.g. -45",
      section: "Config",
      order: 2
    },
    rotate_right_axis_label: {
      type: "string",
      label: "Right Axis Label Direction",
      display: "select",
      values: [
        {"Standard (Bottom-to-Top)": "standard"},
        {"Japanese Style (Top-to-Bottom)": "reverse"},
        {"Vertical (Upright)": "vertical"}
      ],
      default: "standard",
      section: "Config",
      order: 3
    }
  },

  // --- 初期化 ---
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }
        .chart-area {
          flex: 1;
          position: relative;
          overflow: visible;
          min-width: 0;
        }
        .tabs-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 0px;
          padding-left: 4px;
          justify-content: center;
          z-index: 10;
          transition: width 0.3s ease;
        }
        .tab {
          padding: 10px 10px 10px 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 11px;
          color: #333333;
          transition: all 0.2s ease;
          border-left: none;
          border-right: 4px solid transparent;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          backdrop-filter: blur(4px);
          position: relative;
          text-align: right;
        }
        .tab:hover {
          background: rgba(255, 255, 255, 0.8);
          opacity: 0.9;
        }
        .tab.active-primary {
          background: #fff;
          font-weight: 600;
          opacity: 1.0;
          transform: scale(1.02);
          transform-origin: right center;
        }
        .tab.active-secondary {
          background: #fff;
          font-weight: 600;
          opacity: 1.0;
        }
        /* Tooltip */
        .looker-tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ccc;
          color: #333;
          padding: 8px 12px;
          border-radius: 8px;
          pointer-events: none;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 100;
          top: 0;
          left: 0;
        }
        .tooltip-header {
          font-weight: bold;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .axis text {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
        }
        .axis path, .axis line {
          stroke: rgba(0,0,0,0.1);
        }
        .grid-line {
          stroke: rgba(0,0,0,0.05);
          stroke-dasharray: 4;
        }
      </style>
      <div class="viz-container">
        <div class="chart-area" id="chart"></div>
        <div class="tabs-area" id="tabs"></div>
        <div class="looker-tooltip" id="tooltip"></div>
      </div>
    `;
  },

  // --- 描画ロジック ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // 1. 検証
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.
