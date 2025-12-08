looker.plugins.visualizations.add({
  // --- 設定オプション ---
  options: {
    // ... Style Section ...
    line_color: {
      type: "string",
      label: "Primary Axis Color (Left)",
      display: "color",
      default: "#AA7777",
      section: "Style",
      order: 1
    },
    secondary_line_color: {
      type: "string",
      label: "Secondary Axis Color (Right)",
      display: "color",
      default: "#5F8D8B",
      section: "Style",
      order: 2
    },
    background_line_color: {
      type: "string",
      label: "Inactive Line Color",
      display: "color",
      default: "#D3CCC6",
      section: "Style",
      order: 3
    },
    chart_background_color: {
      type: "string",
      label: "Chart Background Color",
      display: "color",
      default: "#ffffff",
      section: "Style",
      order: 4
    },
    index_font_size: {
      type: "string",
      label: "Index Font Size",
      default: "11px",
      placeholder: "e.g. 12px, 0.9rem",
      section: "Style",
      order: 5
    },
    // ★ Option: 凡例幅の指定 ★
    legend_width: {
      type: "number",
      label: "Legend Width (px)",
      default: 0,
      placeholder: "Set 0 for Auto (e.g. 200)",
      section: "Style",
      order: 6
    },

    // --- Box Model & Shadow Section ---
    card_margin: {
      type: "string",
      label: "Card Margin (Outer Spacing)",
      default: "0px",
      placeholder: "e.g. 10px",
      section: "Box Model & Shadow",
      order: 1
    },
    card_padding: {
      type: "string",
      label: "Card Padding (Inner Spacing)",
      default: "16px",
      placeholder: "e.g. 20px",
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
      placeholder: "rgba(0,0,0,0.1)",
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
    x_axis_custom_ticks: {
      type: "string",
      label: "Custom X-Axis Labels (Comma separated)",
      placeholder: "e.g., 2024-03, 2024-06",
      section: "Config",
      order: 3
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
      order: 4
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    // 2. 動的オプション登録
    const newOptions = {};
    queryResponse.fields.measures.forEach((measure, index) => {
        const minOptionId = `y_min_${measure.name}`;
        newOptions[minOptionId] = {
            label: `Min Scale: ${measure.label_short || measure.label}`,
            type: "string",
            placeholder: "Auto (0), 100, or 90%",
            section: "Y-Axis Scaling",
            order: index * 2
        };
        const maxOptionId = `y_max_${measure.name}`;
        newOptions[maxOptionId] = {
            label: `Max Scale: ${measure.label_short || measure.label}`,
            type: "string",
            placeholder: "Auto, 1000, or 120%",
            section: "Y-Axis Scaling",
            order: index * 2 + 1
        };
    });
    this.trigger('registerOptions', { ...this.options, ...newOptions });

    // 3. コンテナスタイル設定
    const container = d3.select(element).select(".viz-container");
    container.style("background-color", config.chart_background_color || "#ffffff");
    container
        .style("margin", config.card_margin || "0px")
        .style("padding", config.card_padding || "16px")
        .style("height", `calc(100% - ${(parseInt(config.card_margin)||0)*2}px)`)
        .style("width", `calc(100% - ${(parseInt(config.card_margin)||0)*2}px)`);
    const shadow = `${config.shadow_x || "0px"} ${config.shadow_y || "4px"} ${config.shadow_blur || "12px"} ${config.shadow_spread || "0px"} ${config.shadow_color || "rgba(0,0,0,0.05)"}`;
    container.style("box-shadow", shadow);

    // 4. レスポンシブ計算 (ユーザー指定幅に対応)
    const elWidth = element.clientWidth;
    const elHeight = element.clientHeight;

    // ★ ユーザー設定の幅を取得
    let tabWidth = config.legend_width ? parseInt(config.legend_width, 10) : 0;
    if (!tabWidth || tabWidth <= 0) {
       // 自動調整
       tabWidth = 150;
       if (elWidth < 600) tabWidth = 120;
       if (elWidth < 400) tabWidth = 90;
       if (elWidth < 300) tabWidth = 70;
    }
    d3.select("#tabs").style("width", tabWidth + "px");

    let yTickCount = 5;
    if (elHeight < 300) yTickCount = 4;
    if (elHeight < 200) yTickCount = 3;

    // 5. チャートマージン
    const rotation = config.x_axis_label_rotation || 0;
    const dynamicBottomMargin = Math.abs(rotation) > 0 ? 60 : 40;
    const rightMargin = 40;
    const leftMargin = elWidth < 400 ? 50 : 70;

    const margin = { top: 30, right: rightMargin, bottom: dynamicBottomMargin, left: leftMargin };
    const chartContainer = element.querySelector("#chart");

    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = chartContainer.clientHeight - margin.top - margin.bottom;

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

    // 6. 状態管理
    if (typeof this.activeMeasureIndex === 'undefined') this.activeMeasureIndex = 0;
    if (this.activeMeasureIndex >= measures.length) this.activeMeasureIndex = 0;
    if (typeof this.secondaryMeasureIndex === 'undefined') this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex >= measures.length) this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex === this.activeMeasureIndex) this.secondaryMeasureIndex = null;

    const primaryIndex = this.activeMeasureIndex;
    const secondaryIndex = this.secondaryMeasureIndex;
    const hasSecondary = (secondaryIndex !== null);

    // 7. ドメイン計算
    const calculateYDomain = (measureName, dataValues) => {
        const validValues = dataValues.filter(v => v !== null);
        const dataExtent = d3.extent(validValues);
        const dataMin = dataExtent[0];
        const dataMax = dataExtent[1];

        const userMinInput = config[`y_min_${measureName}`];
        const userMaxInput = config[`y_max_${measureName}`];
        let yMin, yMax;

        if (userMinInput) {
            const trimmed = userMinInput.toString().trim();
            if (trimmed.endsWith("%")) {
                const percentage = parseFloat(trimmed) / 100;
                if (!isNaN(percentage)) yMin = dataMin * percentage;
            } else {
                const absoluteVal = parseFloat(trimmed);
                if (!isNaN(absoluteVal)) yMin = absoluteVal;
            }
        } else {
            yMin = dataMin < 0 ? dataMin : 0;
        }

        if (userMaxInput) {
            const trimmed = userMaxInput.toString().trim();
            if (trimmed.endsWith("%")) {
                const percentage = parseFloat(trimmed) / 100;
                if (!isNaN(percentage)) yMax = dataMax * percentage;
            } else {
                const absoluteVal = parseFloat(trimmed);
                if (!isNaN(absoluteVal)) yMax = absoluteVal;
            }
        } else {
            yMax = dataMax + ((dataMax - (dataMin||0)) * 0.05);
        }

        if (typeof yMin !== 'undefined' && typeof yMax !== 'undefined') {
             if (yMin >= yMax) yMax = yMin + 1;
        }
        return [yMin, yMax];
    };

    // 8. スケール
    const allLabels = data.map(d => LookerCharts.Utils.textForCell(d[dimension.name]));

    // 9. Tick Values
    let finalTickValues;
    const customTicksInput = config.x_axis_custom_ticks;
    if (customTicksInput && customTicksInput.trim().length > 0) {
        finalTickValues = customTicksInput.split(',').map(s => s.trim());
    } else {
        const labelWidthEstimate = Math.abs(rotation) > 0 ? 40 : 60;
        const maxTicks = Math.max(2, width / labelWidthEstimate);
        const tickInterval = Math.ceil(allLabels.length / maxTicks);
        finalTickValues = allLabels.filter((_, i) => i % tickInterval === 0);
    }

    const x = d3.scalePoint()
      .range([0, width])
      .domain(allLabels)
      .padding(0.1);

    const primaryMeasure = measures[primaryIndex];
    const primaryDomain = calculateYDomain(primaryMeasure.name, data.map(d => d[primaryMeasure.name].value));
    const yLeft = d3.scaleLinear().range([height, 0]).domain(primaryDomain);

    let yRight = null;
    if (hasSecondary) {
        const secondaryMeasure = measures[secondaryIndex];
        const secondaryDomain = calculateYDomain(secondaryMeasure.name, data.map(d => d[secondaryMeasure.name].value));
        yRight = d3.scaleLinear().range([height, 0]).domain(secondaryDomain);
    }

    // 10. 軸描画
    // --- 左軸 (Primary) ---
    const xAxisG = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickValues(finalTickValues).tickSize(0).tickPadding(10));

    if (rotation !== 0) {
        xAxisG.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", `rotate(${rotation})`);
    } else {
        xAxisG.selectAll("text").style("text-anchor", "middle");
    }
    xAxisG.selectAll("text").style("fill", "#666");

    if (config.show_grid !== false) {
        svg.append("g")
          .attr("class", "grid-line")
          .call(d3.axisLeft(yLeft).ticks(yTickCount).tickSize(-width).tickFormat("")).select(".domain").remove();
    }

    const leftAxisG = svg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yLeft).ticks(yTickCount).tickFormat(d => d3.format(".2s")(d)));
    leftAxisG.select(".domain").remove();
    leftAxisG.selectAll("text").style("fill", config.line_color).style("font-weight", "600");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -(height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", config.line_color)
        .style("font-weight", "bold")
        .text(primaryMeasure.label_short || primaryMeasure.label);

    // --- 右軸 (Secondary) ---
    if (hasSecondary) {
        const rightAxisG = svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(${width}, 0)`)
          .call(d3.axisRight(yRight).ticks(yTickCount).tickFormat(d => d3.format(".2s")(d)));
        rightAxisG.select(".domain").remove();
        rightAxisG.selectAll("text").style("fill", config.secondary_line_color).style("font-weight", "600");

        const labelMode = config.rotate_right_axis_label || "standard";
        const labelText = measures[secondaryIndex].label_short || measures[secondaryIndex].label;
        const textObj = svg.append("text")
            .attr("style", `fill: ${config.secondary_line_color}; font-weight: bold; font-size: 11px; text-anchor: middle;`);

        const axisOffset = 50;

        if (labelMode === "reverse") {
            textObj.attr("transform", `translate(${width}, ${height/2}) rotate(90)`)
                   .attr("y", -axisOffset)
                   .attr("x", 0)
                   .text(labelText);
        } else if (labelMode === "vertical") {
            textObj.attr("transform", `translate(${width + axisOffset}, ${height/2})`)
                   .attr("y", 0)
                   .attr("x", 0)
                   .style("writing-mode", "vertical-rl")
                   .style("text-orientation", "upright")
                   .text(labelText);
        } else {
            textObj.attr("transform", `translate(${width}, ${height/2}) rotate(-90)`)
                   .attr("y", axisOffset)
                   .attr("x", 0)
                   .text(labelText);
        }
    }

    // 11. ハンドラ
    const handleToggle = (index, event) => {
        event.stopPropagation();
        const isMultiSelect = event.metaKey || event.ctrlKey || event.shiftKey;
        if (isMultiSelect) {
            if (this.secondaryMeasureIndex === index) {
                this.secondaryMeasureIndex = null;
            } else if (this.activeMeasureIndex !== index) {
                this.secondaryMeasureIndex = index;
            }
        } else {
            this.activeMeasureIndex = index;
            if (this.secondaryMeasureIndex === index) {
                this.secondaryMeasureIndex = null;
            }
        }
        this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
    };

    // 12. タブ (★ ここを10に変更しました)
    measures.slice(0, 10).forEach((m, i) => {
      const isPrimary = i === primaryIndex;
      const isSecondary = i === secondaryIndex;

      const tab = tabsDiv.append("div")
        .attr("class", `tab ${isPrimary ? 'active-primary' : ''} ${isSecondary ? 'active-secondary' : ''}`)
        .text(m.label_short || m.label)
        .on("click", (e) => handleToggle(i, e))
        .attr("title", "Click to set Primary. Ctrl/Cmd+Click to set Secondary.")
        .style("font-size", config.index_font_size || "11px");

      if(isPrimary) {
        tab.style("border-right-color", config.line_color);
        tab.style("color", config.line_color);
        tab.style("box-shadow", `0 2px 8px ${config.shadow_color || "rgba(0,0,0,0.05)"}`);
      } else if(isSecondary) {
        tab.style("border-right-color", config.secondary_line_color);
        tab.style("color", config.secondary_line_color);
        tab.style("box-shadow", `0 2px 8px ${config.shadow_color || "rgba(0,0,0,0.05)"}`);
      }
    });

    // 13. グラフ
    const sortedIndices = measures.map((_, i) => i).filter(i => i !== primaryIndex && i !== secondaryIndex);
    if (hasSecondary) sortedIndices.push(secondaryIndex);
    sortedIndices.push(primaryIndex);

    sortedIndices.forEach(i => {
        const measure = measures[i];
        const isPrimary = (i === primaryIndex);
        const isSecondary = (i === secondaryIndex);

        let targetYScale, strokeColor, strokeWidth, opacity;
        const domain = calculateYDomain(measure.name, data.map(d => d[measure.name].value));
        const yScale = d3.scaleLinear().range([height, 0]).domain(domain);

        if (isPrimary) {
            targetYScale = yLeft;
            strokeColor = config.line_color;
            strokeWidth = 3;
            opacity = 1;
        } else if (isSecondary) {
            targetYScale = yRight;
            strokeColor = config.secondary_line_color;
            strokeWidth = 2.5;
            opacity = 1;
        } else {
            targetYScale = yScale;
            strokeColor = config.background_line_color;
            strokeWidth = 1.5;
            opacity = 0.4;
        }

        // Null/Zero Handling
        const lineGen = d3.line()
            .defined(d => d[measure.name].value !== null && d[measure.name].value !== 0)
            .x(d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
            .y(d => targetYScale(d[measure.name].value))
            .curve(d3.curveMonotoneX);

        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", strokeColor)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-opacity", opacity)
            .attr("d", lineGen)
            .style("cursor", (isPrimary || isSecondary) ? "default" : "pointer");

        if (isPrimary) {
            path.style("filter", `drop-shadow(0px 4px 6px ${config.shadow_color || "rgba(170, 119, 119, 0.3)"})`);
        } else if (!isSecondary) {
             path.attr("stroke-opacity", 0.3);
             svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 8)
                .attr("d", lineGen)
                .style("cursor", "pointer")
                .on("click", (e) => handleToggle(i, e))
                .append("title").text(`Click to Select ${measure.label}`);
        }

        if (isPrimary || isSecondary) {
           const validData = data.filter(d => d[measure.name].value !== null && d[measure.name].value !== 0);

           svg.selectAll(`.dot-${i}`)
             .data(validData)
             .enter().append("circle")
             .attr("cx", d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
             .attr("cy", d => targetYScale(d[measure.name].value))
             .attr("r", isPrimary ? 5 : 4)
             .attr("fill", "#fff")
             .attr("stroke", strokeColor)
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
                 const axisLabel = isPrimary ? "Primary (Left)" : "Secondary (Right)";
                 tooltip
                    .style("opacity", 1)
                    .html(`
                        <div class="tooltip-header" style="color:${strokeColor}">${dimVal}</div>
                        <div><span style="color:#999;font-size:10px;">${axisLabel}</span></div>
                        <div>${measure.label}: <b>${val}</b></div>
                    `)
                    .style("left", (mx + 15) + "px")
                    .style("top", (my - 15) + "px")
                    .style("border-color", strokeColor);
                 d3.select(this).attr("r", isPrimary ? 7 : 6).attr("fill", strokeColor);
             })
             .on("mouseout", function() {
                 tooltip.style("opacity", 0);
                 d3.select(this).attr("r", isPrimary ? 5 : 4).attr("fill", "#fff");
             });
        }
    });

    done();
  }
});
