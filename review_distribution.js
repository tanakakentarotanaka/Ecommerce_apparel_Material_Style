looker.plugins.visualizations.add({
  id: "custom-star-rating-filter",
  label: "Star Rating Filter (Toggle Style)",

  // ============================================================
  //  Configuration Options
  // ============================================================
  options: {
    // --- General Settings ---
    selection_mode: {
      label: "Selection Mode",
      type: "string",
      display: "select",
      values: [
        { "Multi-select": "multi" },
        { "Single-select": "single" }
      ],
      default: "multi",
      section: "General Settings",
      order: 1
    },
    title_override: {
      label: "Title Override",
      type: "string",
      default: "",
      section: "General Settings",
      order: 2
    },
    show_star_icon: {
      label: "Show Star Icon (★)",
      type: "boolean",
      default: true,
      section: "General Settings",
      order: 3
    },

    // --- Visualization Settings ---
    selected_measure: {
      label: "Measure to Display",
      type: "string",
      display: "select",
      values: [{ "None": "" }],
      default: "",
      section: "Visualization Settings",
      order: 1
    },
    vis_type: {
      label: "Visualization Type",
      type: "string",
      display: "select",
      values: [
        { "None": "none" },
        { "Data Bar": "data_bar" },
        { "Color Scale": "color_scale" }
      ],
      default: "data_bar",
      section: "Visualization Settings",
      order: 2
    },
    show_measure_val: {
      label: "Show Measure Value",
      type: "boolean",
      default: true,
      section: "Visualization Settings",
      order: 5
    },
    measure_format: {
      label: "Measure Format",
      type: "string",
      default: "",
      placeholder: "#,##0",
      section: "Visualization Settings",
      order: 6
    },

    // --- Color Settings ---
    header_vis_colors: {
      type: 'string',
      label: '--- Data Bar Colors ---',
      display: 'heading',
      section: 'Visualization Settings',
      order: 10
    },
    data_bar_opacity: {
      label: "Bar Opacity (%)",
      type: "number",
      display_size: 'half',
      default: 20, // 薄めに設定
      min: 0, max: 100,
      section: "Visualization Settings",
      order: 11
    },
    color_min: {
      label: "Min Color",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#f8696b",
      section: "Visualization Settings",
      order: 12
    },
    color_max: {
      label: "Max Color",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#63be7b",
      section: "Visualization Settings",
      order: 14
    },

    // ============================================================
    //  Design Settings
    // ============================================================

    // --- Global Settings ---
    header_design_global: {
      type: 'string',
      label: '--- Global Settings ---',
      display: 'heading',
      section: 'Design',
      order: 1
    },
    global_border_radius: {
      label: "Border Radius",
      type: "string",
      display: "text",
      default: "4px",
      placeholder: "e.g. 4px",
      section: 'Design',
      order: 2
    },
    global_bg_color: {
      label: "Global Background",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#ffffff",
      section: 'Design',
      order: 3
    },

    // --- Title Settings ---
    header_design_title: {
      type: 'string',
      label: '--- Title ---',
      display: 'heading',
      section: 'Design',
      order: 10
    },
    header_font_size: {
      label: "Font Size",
      type: "string",
      display_size: 'third',
      default: "14",
      section: 'Design',
      order: 11
    },
    header_text_color: {
      label: "Text Color",
      type: "string",
      display: "color",
      display_size: 'third',
      default: "#444444",
      section: 'Design',
      order: 12
    },

    // --- List Item Settings ---
    header_design_list: {
      type: 'string',
      label: '--- List Items ---',
      display: 'heading',
      section: 'Design',
      order: 32
    },
    list_font_size: {
      label: "List Font Size",
      type: "string",
      default: "14",
      display_size: 'half',
      section: 'Design',
      order: 34
    },
    list_text_color: {
      label: "Text Color",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#333333",
      section: 'Design',
      order: 35
    },

    // --- Toggle Switch Settings ---
    header_design_toggle: {
      type: 'string',
      label: '--- Toggle Switch ---',
      display: 'heading',
      section: 'Design',
      order: 38
    },
    toggle_on_color: {
      label: "Active Color",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#d67f7f", // 画像のような少しくすんだ赤/茶色
      section: 'Design',
      order: 40
    },
    toggle_off_color: {
      label: "Inactive Color",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#cccccc",
      section: 'Design',
      order: 41
    },

    // --- Row Interaction ---
    header_design_row: {
      type: 'string',
      label: '--- Row Style ---',
      display: 'heading',
      section: 'Design',
      order: 50
    },
    row_hover_color: {
      label: "Hover Background",
      type: "string",
      display: "color",
      display_size: 'half',
      default: "#f1f3f4",
      section: 'Design',
      order: 52
    },
    row_border_radius: {
      label: "Row Radius",
      type: "string",
      display_size: 'half',
      default: "4px",
      section: 'Design',
      order: 53
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .cv-container {
          --global-radius: 4px;
          --header-font-size: 14px;
          --header-text-color: #444;
          --list-font-size: 14px;
          --list-text-color: #333;
          --row-radius: 4px;

          /* Toggle Colors */
          --toggle-on: #d67f7f;
          --toggle-off: #cccccc;
          --row-hover-bg: #f1f3f4;
          --data-bar-opacity: 0.2;

          font-family: inherit;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-radius: var(--global-radius);
          background-color: var(--global-bg, #fff);
          padding: 8px;
          box-sizing: border-box;
        }

        .group-label {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: var(--header-font-size);
          color: var(--header-text-color);
          flex-shrink: 0;
        }

        .scroll-area {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 8px;
          cursor: pointer;
          font-size: var(--list-font-size);
          color: var(--list-text-color);
          border-radius: var(--row-radius);
          position: relative;
          margin-bottom: 2px;
          transition: background-color 0.1s;
        }
        .item-row:hover { background-color: var(--row-hover-bg); }

        /* Label Section (Left) */
        .item-left {
          display: flex;
          align-items: center;
          flex: 1;
          z-index: 2;
          font-weight: 600;
          gap: 6px;
        }
        .star-icon {
          color: #fac43b; /* Star Yellow */
          font-size: 1.1em;
        }

        /* Toggle Switch Implementation */
        .toggle-wrapper {
          position: relative;
          width: 36px;
          height: 20px;
          margin: 0 12px;
          flex-shrink: 0;
          z-index: 2;
        }

        .toggle-wrapper input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--toggle-off);
          transition: .4s;
          border-radius: 20px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        input:checked + .slider {
          background-color: var(--toggle-on);
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }

        /* Value Section (Right) */
        .item-right {
          flex-shrink: 0;
          text-align: right;
          color: inherit;
          z-index: 2;
          font-variant-numeric: tabular-nums;
          font-weight: 400;
          opacity: 0.8;
        }

        /* Data Bar (Background) */
        .data-bar {
          position: absolute;
          top: 0; bottom: 0; left: 0;
          border-radius: var(--row-radius);
          opacity: var(--data-bar-opacity);
          pointer-events: none;
          z-index: 1;
          transition: width 0.3s ease;
        }

        .viz-error { color: #c00; padding: 10px; font-size: 12px; }
      </style>
      <div id="viz-root" class="cv-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const root = element.querySelector("#viz-root");

    // --- Helpers ---
    const fixPx = (val, def) => val ? (typeof val === 'number' || /^\d+$/.test(val) ? val + "px" : val) : def;
    const setVar = (name, val) => root.style.setProperty(name, val);

    // --- Apply Config ---
    setVar('--global-bg', config.global_bg_color);
    setVar('--global-radius', fixPx(config.global_border_radius, '4px'));
    setVar('--header-font-size', fixPx(config.header_font_size, '14px'));
    setVar('--header-text-color', config.header_text_color);
    setVar('--list-font-size', fixPx(config.list_font_size, '14px'));
    setVar('--list-text-color', config.list_text_color);
    setVar('--row-radius', fixPx(config.row_border_radius, '4px'));
    setVar('--toggle-on', config.toggle_on_color || '#d67f7f');
    setVar('--toggle-off', config.toggle_off_color || '#cccccc');
    setVar('--row-hover-bg', config.row_hover_color);

    const barOpacity = (config.data_bar_opacity !== undefined) ? config.data_bar_opacity : 20;
    setVar('--data-bar-opacity', barOpacity / 100);

    // --- Error Handling ---
    if (!queryResponse || !queryResponse.fields || !data) { if(done) done(); return; }

    const dimField = queryResponse.fields.dimensions && queryResponse.fields.dimensions[0];
    if (!dimField) {
      root.innerHTML = `<div class="viz-error">Dimension required.</div>`;
      if(done) done(); return;
    }

    // --- Measure Handling ---
    const measures = queryResponse.fields.measures || [];
    const measureOptions = [{ "None": "" }];
    measures.forEach(m => { measureOptions.push({ [m.label_short || m.label]: m.name }); });

    // Register measure options dynamically
    this.trigger('registerOptions', {
      ...this.options,
      selected_measure: { ...this.options.selected_measure, values: measureOptions }
    });

    const dimName = dimField.name;
    const selectedMeasureName = config.selected_measure || (measures[0] ? measures[0].name : "");
    const showStar = config.show_star_icon !== false;
    const showVal = config.show_measure_val !== false;
    const visType = config.vis_type || "data_bar";

    // --- Data Processing ---
    let maxVal = 0;
    const items = [];

    data.forEach(row => {
      const dimCell = row[dimName];
      if(!dimCell) return;

      const val = String(dimCell.value);
      const rendered = dimCell.rendered || val;

      let measureVal = 0;
      let measureRendered = "";

      if(selectedMeasureName && row[selectedMeasureName]) {
        measureVal = Number(row[selectedMeasureName].value);
        measureRendered = row[selectedMeasureName].rendered || measureVal;
        if(!isNaN(measureVal) && measureVal > maxVal) maxVal = measureVal;
      }

      items.push({
        value: val,
        label: rendered,
        measureVal,
        measureRendered,
        rowContext: row
      });
    });

    // --- Rendering ---
    root.innerHTML = ""; // Clear previous

    // 1. Title
    const labelDiv = document.createElement("div");
    labelDiv.className = "group-label";
    labelDiv.innerText = config.title_override || dimField.label_short || dimField.label;
    root.appendChild(labelDiv);

    // 2. List Container
    const scrollArea = document.createElement("div");
    scrollArea.className = "scroll-area";

    items.forEach(item => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "item-row";

      // A. Label (Left)
      const leftDiv = document.createElement("div");
      leftDiv.className = "item-left";
      if(showStar) {
        const star = document.createElement("span");
        star.className = "star-icon";
        star.innerText = "★";
        leftDiv.appendChild(star);
      }
      const labelSpan = document.createElement("span");
      labelSpan.innerText = item.label;
      leftDiv.appendChild(labelSpan);

      // B. Toggle Switch (Middle)
      const toggleWrapper = document.createElement("div");
      toggleWrapper.className = "toggle-wrapper";

      const input = document.createElement("input");
      input.type = (config.selection_mode === "single") ? "radio" : "checkbox";
      input.name = "viz_filter_group"; // important for radio

      // Check Selection State
      if (details.crossfilterEnabled) {
         const state = LookerCharts.Utils.getCrossfilterSelection(item.rowContext, null);
         input.checked = (state === 1);
      }

      const slider = document.createElement("span");
      slider.className = "slider";

      toggleWrapper.appendChild(input);
      toggleWrapper.appendChild(slider);

      // C. Value (Right)
      const rightDiv = document.createElement("div");
      rightDiv.className = "item-right";
      if(showVal && selectedMeasureName) {
        rightDiv.innerText = item.measureRendered;
      }

      // D. Data Bar (Background)
      if (visType === "data_bar" && maxVal > 0) {
        const bar = document.createElement("div");
        bar.className = "data-bar";
        const pct = Math.min(100, (item.measureVal / maxVal) * 100);
        bar.style.width = `${pct}%`;
        // Use Min/Max color gradient logic simply or just use one color
        // For simplicity here, using the Min Color settings as the bar color
        bar.style.backgroundColor = config.color_min || "#f8696b";
        rowDiv.appendChild(bar);
      }

      // Append Elements
      rowDiv.appendChild(leftDiv);
      rowDiv.appendChild(toggleWrapper);
      rowDiv.appendChild(rightDiv);

      // E. Click Event (Crossfilter)
      rowDiv.addEventListener("click", (e) => {
        if (!details.crossfilterEnabled) return;
        // Trigger Toggle Animation immediately for better UX
        input.checked = !input.checked;

        LookerCharts.Utils.toggleCrossfilter({
          row: item.rowContext,
          pivot: null,
          event: e
        });
      });

      scrollArea.appendChild(rowDiv);
    });

    root.appendChild(scrollArea);
    if (done) done();
  }
});
