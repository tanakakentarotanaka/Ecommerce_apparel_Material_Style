looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    line_color: {
      type: "string",
      label: "Primary Axis Color (Left)",
      display: "color",
      default: "#AA7777", // Rose Quartz
      section: "Style",
      order: 1
    },
    secondary_line_color: {
      type: "string",
      label: "Secondary Axis Color (Right)",
      display: "color",
      default: "#5F8D8B", // Muted Teal
      section: "Style",
      order: 2
    },
    background_line_color: {
      type: "string",
      label: "Inactive Line Color",
      display: "color",
      default: "#D3CCC6", // Muted Gray
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
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
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
          min-width: 0;
        }
        .tabs-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 0px; /* スペースを詰めるため0に */
          padding-left: 4px; /* 少しだけ隙間を確保 */
          justify-content: center;
          z-index: 10;
          transition: width 0.3s ease;
        }
        .tab {
          padding: 10px 10px 10px 12px;
          background: rgba(255, 255, 255, 0.5);
          /* 形状維持: 左直角、右丸 */
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 11px;
          color: #333333;
          transition: all 0.2s ease;
          /* 左ボーダーを削除し、右ボーダーを追加 */
          border-left: none;
          border-right: 4px solid transparent;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          backdrop-filter: blur(4px);
          position: relative;
          text-align: right; /* テキストも右寄せでバランスを取る */
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
          transform-origin: right center; /* 拡大起点を右に */
        }
        .tab.active-secondary {
          background: #fff;
          font-weight: 600;
          opacity: 1.0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // --- 検証 ---
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    // --- オプション登録 ---
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

    // --- レイアウト最適化 ---
    const containerWidth = element.clientWidth;
    const containerHeight = element.clientHeight;

    // タブ幅
    let tabWidth = 150;
    if (containerWidth < 600) tabWidth = 120;
    if (containerWidth < 400) tabWidth = 90;
    if (containerWidth < 300) tabWidth = 70;

    d3.select("#tabs").style("width", tabWidth + "px");

    let yTickCount = 5;
    if (containerHeight < 300) yTickCount = 4;
    if (containerHeight < 200) yTickCount = 3;

    // --- コンテナ設定 ---
    const container = element.querySelector(".viz-container");
    container.style.backgroundColor = config.chart_background_color || "#ffffff";

    // --- マージン調整 (スペースを詰める) ---
    const rotation = config.x_axis_label_rotation || 0;
    const dynamicBottomMargin = Math.abs(rotation) > 0 ? 60 : 40;

    // 右側のマージンを大幅に削減（40pxあれば第2軸ラベルが入る）
    const rightMargin = 40;
    const leftMargin = containerWidth < 400 ? 50 : 70;

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

    // --- 状態管理 ---
    if (typeof this.activeMeasureIndex === 'undefined') this.activeMeasureIndex = 0;
    if (this.activeMeasureIndex >= measures.length) this.activeMeasureIndex = 0;
    if (typeof this.secondaryMeasureIndex === 'undefined') this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex >= measures.length) this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex === this.activeMeasureIndex) this.secondaryMeasureIndex = null;

    const primaryIndex = this.activeMeasureIndex;
    const secondaryIndex = this.secondaryMeasureIndex;
    const hasSecondary = (secondaryIndex !== null);

    // --- ドメイン計算 ---
    const calculateYDomain = (measureName, dataValues) => {
        const dataExtent = d3.extent(dataValues);
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
            yMax = dataMax + ((dataMax - dataMin) * 0.05);
        }

        if (typeof yMin !== 'undefined' && typeof yMax !== 'undefined') {
             if (yMin >= yMax) yMax = yMin + 1;
        }
        return [yMin, yMax];
    };

    // --- スケール ---
    const allLabels = data.map(d => LookerCharts.Utils.textForCell(d[dimension.name]));
    const labelWidthEstimate = Math.abs(rotation) > 0 ? 40 : 60;
    const maxTicks = Math.max(2, width / labelWidthEstimate);
    const tickInterval = Math.ceil(allLabels.length / maxTicks);
    const tickValues = allLabels.filter((_, i) => i % tickInterval === 0);

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

    // --- 軸 ---
    const xAxisG = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickValues(tickValues).tickSize(0).tickPadding(10));

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

    if (hasSecondary) {
        const rightAxisG = svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(${width}, 0)`)
          .call(d3.axisRight(yRight).ticks(yTickCount).tickFormat(d => d3.format(".2s")(d)));
        rightAxisG.select(".domain").remove();
        rightAxisG.selectAll("text").style("fill", config.secondary_line_color).style("font-weight", "600");

        // ラベル位置調整: マージン削減に伴い、少し内側に寄せる
        svg.append("text")
            .attr("transform", `translate(${width}, ${height/2}) rotate(-90)`)
            .attr("y", 35) // ラベル位置を少し軸に近づける
            .attr("x", 0)
            .attr("dy", "0em")
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", config.secondary_line_color)
            .style("font-weight", "bold")
            .text(measures[secondaryIndex].label_short || measures[secondaryIndex].label);
    }

    // --- ハンドラ ---
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

    // --- タブ (右ボーダー対応) ---
    measures.slice(0, 5).forEach((m, i) => {
      const isPrimary = i === primaryIndex;
      const isSecondary = i === secondaryIndex;

      const tab = tabsDiv.append("div")
        .attr("class", `tab ${isPrimary ? 'active-primary' : ''} ${isSecondary ? 'active-secondary' : ''}`)
        .text(m.label_short || m.label)
        .on("click", (e) => handleToggle(i, e))
        .attr("title", "Click to set Primary. Ctrl/Cmd+Click to set Secondary.");

      if(isPrimary) {
        // 右ボーダーに色を適用
        tab.style("border-right-color", config.line_color);
        tab.style("color", config.line_color);
      } else if(isSecondary) {
        tab.style("border-right-color", config.secondary_line_color);
        tab.style("color", config.secondary_line_color);
      }
    });

    // --- グラフ ---
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

        const lineGen = d3.line()
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
            path.style("filter", "drop-shadow(0px 4px 6px rgba(170, 119, 119, 0.3))");
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
           svg.selectAll(`.dot-${i}`)
             .data(data)
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
