looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    line_color: {
      type: "string",
      label: "Active Line Color",
      display: "color",
      default: "#AA7777", // Rose Quartz
      section: "Style"
    },
    background_line_color: {
      type: "string",
      label: "Inactive Line Color",
      display: "color",
      default: "#D3CCC6", // Muted Gray
      section: "Style"
    },
    chart_background_color: {
      type: "string",
      label: "Chart Background Color",
      display: "color",
      default: "#ffffff",
      section: "Style"
    },
    show_grid: {
      type: "boolean",
      label: "Show Grid Lines",
      default: true,
      section: "Config"
    }
  },

  // セットアップ関数
  create: function(element, config) {
    // 初期スタイル定義
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          height: 100%;
          font-family: 'Inter', sans-serif;
          /* 背景色はconfigで上書きされるため初期値のみ */
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          padding: 16px;
          position: relative;
          transition: background-color 0.3s ease; /* 色変更をスムーズに */
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
          background: rgba(255, 255, 255, 0.5); /* 半透明にして背景色に馴染ませる */
          border-radius: 0 12px 12px 0;
          cursor: pointer;
          font-size: 11px;
          color: #333333;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          backdrop-filter: blur(4px); /* すりガラス効果 */
        }
        .tab.active {
          background: #fff;
          font-weight: 600;
          border-left: 4px solid #AA7777; /* JSで動的に変更されますが初期値として */
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          opacity: 1.0;
          transform: scale(1.02);
          transform-origin: left center;
        }
        /* Tooltip */
        .looker-tooltip {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #AA7777;
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
          color: #AA7777;
          font-size: 11px;
        }
        .axis text {
          font-family: 'Inter', sans-serif;
          color: #666;
          font-size: 10px;
        }
        .axis path, .axis line {
          stroke: rgba(0,0,0,0.1); /* 軸の色も少し汎用的に */
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

  // 描画更新関数
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // 必須チェック
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({ title: "No Dimensions", message: "1つのディメンションが必要です" });
      return;
    }
    if (queryResponse.fields.measures.length < 1) {
      this.addError({ title: "No Measures", message: "少なくとも1つのメジャーが必要です" });
      return;
    }

    // --- コンテナ設定の適用 ---
    const container = element.querySelector(".viz-container");
    // 背景色をConfigから適用
    container.style.backgroundColor = config.chart_background_color || "#ffffff";

    // --- チャート描画準備 ---
    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
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

    // インデックス管理
    if (typeof this.activeMeasureIndex === 'undefined') this.activeMeasureIndex = 0;
    if (this.activeMeasureIndex >= measures.length) this.activeMeasureIndex = 0;
    const activeMeasureIndex = this.activeMeasureIndex;

    // --- スケール設定 ---
    const x = d3.scalePoint()
      .range([0, width])
      .domain(data.map(d => LookerCharts.Utils.textForCell(d[dimension.name])))
      .padding(0.1);

    const activeMeasure = measures[activeMeasureIndex];
    const yDomain = d3.extent(data, d => d[activeMeasure.name].value);
    const yPadding = (yDomain[1] - yDomain[0]) * 0.05;
    const activeY = d3.scaleLinear()
        .range([height, 0])
        .domain([yDomain[0] - yPadding, yDomain[1] + yPadding]);

    // --- 軸・グリッド ---
    // X軸
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .selectAll("text")
      .style("text-anchor", "middle");

    // グリッド線
    if (config.show_grid !== false) {
        svg.append("g")
          .attr("class", "grid-line")
          .call(d3.axisLeft(activeY)
              .ticks(5)
              .tickSize(-width)
              .tickFormat("")
          )
          .select(".domain").remove();
    }

    // Y軸
    const yAxis = d3.axisLeft(activeY)
        .ticks(5)
        .tickFormat(d => d3.format(".2s")(d));

    svg.append("g")
      .attr("class", "axis")
      .call(yAxis)
      .select(".domain").remove();

    // Y軸ラベル
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", config.line_color)
        .style("font-weight", "bold")
        .text(activeMeasure.label_short || activeMeasure.label);

    // --- タブ（インデックス）生成 ---
    measures.slice(0, 5).forEach((m, i) => {
      const isActive = i === activeMeasureIndex;
      const tab = tabsDiv.append("div")
        .attr("class", `tab ${isActive ? 'active' : ''}`)
        .text(m.label_short || m.label)
        .on("click", () => {
          this.activeMeasureIndex = i;
          this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
        });

      // アクティブなタブのボーダー色を設定色に合わせる
      if(isActive) {
        tab.style("border-left-color", config.line_color);
      }
    });

    // --- グラフ描画 ---
    const sortedIndices = measures.map((_, i) => i).filter(i => i !== activeMeasureIndex);
    sortedIndices.push(activeMeasureIndex);

    sortedIndices.forEach(i => {
        const measure = measures[i];
        const isActive = (i === activeMeasureIndex);

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
            .attr("stroke", isActive ? config.line_color : config.background_line_color)
            .attr("stroke-width", isActive ? 3 : 5)
            .attr("stroke-opacity", isActive ? 1 : 0.0)
            .attr("d", lineGen)
            .style("cursor", isActive ? "default" : "pointer");

        // 非アクティブ（表示用）
        if (!isActive) {
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", config.background_line_color)
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.5)
                .attr("d", lineGen)
                .style("pointer-events", "none");

            // 非アクティブ（クリック用透明線）
            path.attr("stroke-opacity", 0)
                .on("click", () => {
                    this.activeMeasureIndex = i;
                    this.trigger('updateConfig', [{_force_redraw: Date.now()}]);
                })
                .append("title").text(`Click to show ${measure.label}`);
        } else {
             path.style("filter", "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))");
        }

        // ポイント & Tooltip
        if (isActive) {
           svg.selectAll(`.dot-${i}`)
             .data(data)
             .enter().append("circle")
             .attr("cx", d => x(LookerCharts.Utils.textForCell(d[dimension.name])))
             .attr("cy", d => measureY(d[measure.name].value))
             .attr("r", 6)
             .attr("fill", "#fff")
             .attr("stroke", config.line_color)
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
                    .html(`
                        <div class="tooltip-header" style="color:${config.line_color}">${dimVal}</div>
                        <div>${measure.label}: <b>${val}</b></div>
                    `)
                    .style("left", (mx + 15) + "px")
                    .style("top", (my - 15) + "px")
                    .style("border-color", config.line_color); // Tooltip枠色も合わせる

                 d3.select(this).attr("r", 8).attr("fill", config.line_color);
             })
             .on("mouseout", function() {
                 tooltip.style("opacity", 0);
                 d3.select(this).attr("r", 6).attr("fill", "#fff");
             });
        }
    });

    done();
  }
});
