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

    // 4. レスポンシブ計算
    const elWidth = element.clientWidth;
    const elHeight = element.clientHeight;
    let tabWidth = config.legend_width ? parseInt(config.legend_width, 10) : 0;

    if (!tabWidth || tabWidth <= 0) {
       tabWidth = 150;
       if (elWidth < 600) tabWidth = 120;
       if (elWidth < 400) tabWidth = 90;
       if (elWidth < 300) tabWidth = 70;
    }

    d3.select("#tabs").style("width", tabWidth + "px");

    let yTickCount = 5;
    if (elHeight < 300) yTickCount = 4;
    if (elHeight < 200) yTickCount = 3;

    // ★ 修正: 状態管理 (Step 6) をマージン計算の前に移動 ★
    const measures = queryResponse.fields.measures;
    if (typeof this.activeMeasureIndex === 'undefined') this.activeMeasureIndex = 0;
    if (this.activeMeasureIndex >= measures.length) this.activeMeasureIndex = 0;
    if (typeof this.secondaryMeasureIndex === 'undefined') this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex >= measures.length) this.secondaryMeasureIndex = null;
    if (this.secondaryMeasureIndex === this.activeMeasureIndex) this.secondaryMeasureIndex = null;

    const primaryIndex = this.activeMeasureIndex;
    const secondaryIndex = this.secondaryMeasureIndex;
    const hasSecondary = (secondaryIndex !== null);

    // 5. チャートマージン (修正: rightMarginを動的に変更)
    const rotation = config.x_axis_label_rotation || 0;
    const dynamicBottomMargin = Math.abs(rotation) > 0 ? 60 : 40;
    const leftMargin = elWidth < 400 ? 50 : 70;
    // 第2軸がある場合は左マージンと同じ幅を確保、なければ40px
    const rightMargin = hasSecondary ? leftMargin : 40;

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

    // 9. Tick Valuesの決定
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

        // ★ 修正: ラベル位置の数値を35から50に変更し、左側と対称に ★
        if (labelMode === "reverse") {
            // translate(width, height/2) rotate(90) y=-50
            textObj.attr("transform", `translate(${width}, ${height/2}) rotate(90)`).attr("y", -50).attr("x", 0).text(labelText);
        } else if (labelMode === "vertical") {
            // translate(width + 50, height/2)
            textObj.attr("transform", `translate(${width + 50}, ${height/2})`).attr("y", 0).attr("x", 0)
                .style("writing-mode", "vertical-rl").style("text-orientation", "upright").text(labelText);
        } else {
            // standard: translate(width, height/2) rotate(-90) y=50
            textObj.attr("transform", `translate(${width}, ${height/2}) rotate(-90)`).attr("y", 50).attr("x", 0).text(labelText);
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

    // 12. タブ
    measures.slice(0, 5).forEach((m, i) => {
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
