looker.plugins.visualizations.add({
  // 1. 基本の静的オプション定義
  options: {
    // --- 全般設定 ---
    chart_bg_color: {
      type: "string",
      label: "Chart Background Color",
      display: "color",
      default: "#FFFFFF",
      section: "General"
    },
    inactive_line_color: {
      type: "string",
      label: "Inactive Line Color",
      display: "color",
      default: "#D3CCC6", // Muted Gray
      section: "General"
    },
    show_grid: {
      type: "boolean",
      label: "Show Grid Lines",
      default: true,
      section: "General"
    },

    // --- インデックスシール（タブ）設定 ---
    tab_active_bg_color: {
      type: "string",
      label: "Tab Active Color",
      display: "color",
      default: "#FFFFFF",
      section: "Tabs"
    },
    tab_inactive_bg_color: {
      type: "string",
      label: "Tab Inactive Color",
      display: "color",
      default: "#FAF9F8",
      section: "Tabs"
    },
    tab_text_color: {
      type: "string",
      label: "Tab Text Color",
      display: "color",
      default: "#333333",
      section: "Tabs"
    },
    tab_opacity: {
      type: "number",
      label: "Tab Inactive Opacity",
      display: "range",
      min: 0.1,
      max: 1.0,
      step: 0.1,
      default: 0.7,
      section: "Tabs"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          font-family: 'Inter', sans-serif;
          border-radius: 24px;
          overflow: hidden;
          padding: 16px;
          position: relative;
          transition: background-color 0.3s ease;
        }
        .chart-area {
          flex: 1;
          position: relative;
          overflow: visible;
        }
        .tabs-area {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 10px;
          justify-content: center;
          z-index: 10;
        }
        .tab {
          padding: 10px;
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tab.active {
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: scale(1.02);
          transform-origin: left center;
          opacity: 1.0 !important; /* 選択時は常に不透明 */
        }
        /* Tooltip Style */
        .looker-tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
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
          color: #666;
          font-size: 10px;
        }
        .axis path, .axis line {
          stroke: #ddd;
        }
        .grid-line {
          stroke: #eee;
          stroke-dasharray: 4;
        }
      </style>
      <div class="viz-container" id="vizContainer">
        <div class="chart-area" id="chart"></div>
        <div class="tabs-area" id="tabs"></div>
        <div class="looker-tooltip" id="tooltip"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // 検証
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    // 2. メジャーごとの動的オプション登録
    // Looker 5.24+ feature: registerOptions
    const dynamicOptions = {};
    const defaultColors = ["#AA7777", "#6A8EAE", "#90A959", "#E2B35B", "#D98E8E"]; // デフォルトパレット

    queryResponse.fields.measures.forEach((field, i) => {
        const optionId = "color_" + field.name;
        dynamicOptions[optionId] = {
            label: `${field.label_short || field.label} Color`,
            default: defaultColors[i % defaultColors.length], // 循環してデフォルト色を割り当て
            section: "Measure Colors", // 専用セクションを作成
            type: "string",
            display: "color"
        };
    });
    this.trigger('registerOptions', dynamicOptions);

    // --- 描画準備 ---

    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartContainer = element.querySelector("#chart");
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = chartContainer.clientHeight - margin.top - margin.bottom;

    // 背景色の適用
    element.querySelector("#vizContainer").style.backgroundColor = config.chart_bg_color;

    const chartDiv = d3.select("#chart");
    chartDiv.selectAll("*").remove();
    const tabsDiv = d3.select("#tabs");
    tabsDiv.selectAll("*").remove();
    const tooltip = d3.select("#tooltip");

    const svg = chartDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dimension = queryResponse.fields.dimensions[0];
    const measures = queryResponse.fields.measures;

    if (typeof this.activeMeasureIndex === 'undefined' || this.activeMeasureIndex >= measures.length) {
        this.activeMeasureIndex = 0;
    }
    const activeMeasureIndex = this.activeMeasureIndex;
    const activeMeasure = measures[activeMeasureIndex];

    // アクティブなメジャーの色を取得（動的オプションから）
    const getMeasureColor = (m) => {
        return config["color_" + m.name] || "#AA7777";
    };
    const activeColor = getMeasureColor(activeMeasure);

    // --- スケール & 軸 ---

    const x = d3.scalePoint()
      .range([0, width])
      .domain(data.map(d => LookerCharts.Utils.textForCell(d[dimension.name])))
      .padding(0.1);

    const yDomain = d3.extent(data, d => d[activeMeasure.name].value);
    const yPadding = (yDomain[1] - yDomain[0]) * 0.05;
    const activeY = d3.scaleLinear()
        .range([height, 0])
        .domain([yDomain[0] - yPadding, yDomain[1] + yPadding]);

    // X軸
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .selectAll("text")
      .style("text-anchor", "middle");

    // グリッド
    if (config.show_grid) {
        svg.append("g")
          .attr("class", "grid-line")
          .call(d3.axisLeft(activeY).ticks(5).tickSize(-width).tickFormat("").tickSizeOuter(0))
          .style("stroke-opacity", 0.3)
          .select(".domain").remove();
    }

    // Y軸
    svg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(activeY).ticks(5).tickFormat(d => d3.format(".2s")(d)))
      .select(".domain").remove();

    // Y軸ラベル
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", activeColor) // ラベルもメジャー色に合わせる
        .style("font-weight", "bold")
        .text(activeMeasure.label_short || activeMeasure.label);

    // --- インデックスシール（タブ） ---
    measures.slice(0, 5).forEach((m, i) => {
      const isActive = (i === activeMeasureIndex);
      const mColor = getMeasureColor(m);

      const tab = tabsDiv.append("div")
        .attr("class", `tab ${isActive ? 'active' : ''}`)
        .text(m.label_short || m.label)
        .style("color", config.tab_text_color)
        .on("click", () => {
          this.activeMeasureIndex = i;
          this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
        });

      // デザイン設定の適用
      if (isActive) {
          tab.style("background-color", config.tab_active_bg_color)
             .style("border-left-color", mColor); // アクティブ時は左のバーをそのメジャーの色にする
      } else {
          tab.style("background-color", config.tab_inactive_bg_color)
             .style("opacity", config.tab_opacity);
      }
    });

    // --- グラフ描画 ---

    // レイヤー順序
    const sortedIndices = measures.map((_, i) => i).filter(i => i !== activeMeasureIndex);
    sortedIndices.push(activeMeasureIndex);

    sortedIndices.forEach(i => {
        const measure = measures[i];
        const isActive = (i === activeMeasureIndex);
        const mColor = getMeasureColor(measure);

        const measureExtent = d3.extent(data, d => d[measure.name].value);
        const mPadding = (measureExtent[1] - measureExtent[0]) * 0.05;
        const measureY = d3.scaleLinear()
            .range([height, 0])
            .domain([measureExtent[0] - mPadding, measureExtent[1] + mPadding]);

        const lineGen = d3.line()
            .x(d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
            .y(d => measureY(d[measure.name].value))
            .curve(d3.curveMonotoneX);

        // Path
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", isActive ? mColor : config.inactive_line_color) // アクティブなら固有色、そうでなければ非アクティブ色
            .attr("stroke-width", isActive ? 3 : 4)
            .attr("stroke-opacity", isActive ? 1 : 0) // 非アクティブは透明（ヒットエリアのみ）
            .attr("d", lineGen)
            .style("cursor", isActive ? "default" : "pointer");

        // 非アクティブの視覚的な線（薄い線）
        if (!isActive) {
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", config.inactive_line_color)
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.6)
                .attr("d", lineGen)
                .style("pointer-events", "none");

            path.on("click", () => {
                    this.activeMeasureIndex = i;
                    this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
                })
                .append("title").text(`Click to select ${measure.label}`);
        } else {
             path.style("filter", `drop-shadow(0px 4px 6px ${mColor}40)`); // 影もその色に合わせる
        }

        // Active Dot & Tooltip
        if (isActive) {
           svg.selectAll(`.dot-${i}`)
             .data(data)
             .enter().append("circle")
             .attr("cx", d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
             .attr("cy", d => measureY(d[measure.name].value))
             .attr("r", 5)
             .attr("fill", "#fff")
             .attr("stroke", mColor)
             .attr("stroke-width", 2)
             .style("cursor", "pointer")
             .on("click", function(event, d) {
                if (details.crossfilterEnabled) {
                  LookerCharts.Utils.toggleCrossfilter({row: d, event: event});
                }
             })
             .on("mouseover", function(event, d) {
                 const [mx, my] = d3.pointer(event, element.querySelector('.viz-container'));
                 const val = LookerCharts.Utils.textForCell(d[measure.name]);
                 const dimVal = LookerCharts.Utils.textForCell(d[dimension.name]);

                 tooltip
                    .style("opacity", 1)
                    .style("border-color", mColor) // 枠線もメジャー色に
                    .html(`
                        <div class="tooltip-header" style="color:${mColor}">${dimVal}</div>
                        <div>${measure.label}: <b>${val}</b></div>
                    `)
                    .style("left", (mx + 10) + "px")
                    .style("top", (my - 10) + "px");

                 d3.select(this).attr("r", 8).attr("fill", mColor);
             })
             .on("mouseout", function() {
                 tooltip.style("opacity", 0);
                 d3.select(this).attr("r", 5).attr("fill", "#fff");
             });
        }
    });

    done();
  }
});
