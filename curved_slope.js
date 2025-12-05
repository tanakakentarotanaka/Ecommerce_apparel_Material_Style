/**
 * Elegant Slope Chart v6 (Font Weight Option Added)
 * * New Features:
 * 1. Added "Bold Label" toggle option.
 * 2. Labels font size and weight are fully configurable.
 */

looker.plugins.visualizations.add({
  // --- 1. 設定オプション ---
  options: {
    // --- タイトル・テキスト設定 ---
    chart_title: {
      type: "string",
      label: "チャートタイトル (任意)",
      default: "",
      placeholder: "タイトルを入力...",
      section: "Config",
      order: 0
    },
    label_font_size: {
      type: "number",
      label: "ラベル文字サイズ (px)",
      default: 11,
      section: "Style",
      order: 1
    },
    label_font_bold: {
      type: "boolean",
      label: "ラベルを太字にする",
      default: false,
      section: "Style",
      order: 2
    },

    // --- スタイル設定 ---
    chart_background_color: {
      type: "string",
      label: "背景色",
      display: "color",
      default: "#ffffff",
      section: "Style",
      order: 3
    },
    border_radius: {
      type: "number",
      label: "角丸 (px)",
      default: 24,
      section: "Style",
      order: 4
    },
    box_shadow: {
      type: "string",
      label: "影 (Shadow)",
      display: "select",
      values: [
        {"なし": "none"},
        {"弱": "0 2px 4px rgba(0,0,0,0.1)"},
        {"中": "0 4px 8px rgba(0,0,0,0.15)"},
        {"強": "0 8px 16px rgba(0,0,0,0.2)"}
      ],
      default: "none",
      section: "Style",
      order: 5
    },

    // --- レイアウト (マージン) ---
    margin_top: {
      type: "number",
      label: "余白: 上 (px)",
      default: 40,
      section: "Config",
      order: 3
    },
    margin_bottom: {
      type: "number",
      label: "余白: 下 (px)",
      default: 10,
      section: "Config",
      order: 4
    },
    margin_left: {
      type: "number",
      label: "余白: 左 (px)",
      default: 120,
      section: "Config",
      order: 5
    },
    margin_right: {
      type: "number",
      label: "余白: 右 (px)",
      default: 60,
      section: "Config",
      order: 6
    },

    // --- チャート設定 ---
    line_color: {
      type: "string",
      label: "線の色",
      display: "color",
      default: "#AA7777",
      section: "Style",
      order: 6
    },
    stroke_width: {
      type: "number",
      label: "線の太さ",
      default: 3,
      section: "Style",
      order: 7
    },
    curve_intensity: {
      type: "string",
      label: "カーブの種類",
      display: "select",
      values: [
        {"直線": "linear"},
        {"緩やか": "natural"},
        {"S字カーブ": "bumpX"}
      ],
      default: "bumpX",
      section: "Style",
      order: 8
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 5,
      section: "Style",
      order: 9
    }
  },

  // --- 2. 初期化 ---
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .viz-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          padding: 16px;
          box-sizing: border-box;
          position: relative;
          transition: background-color 0.3s ease;
        }
        .chart-area {
          flex: 1;
          position: relative;
          overflow: visible;
          min-width: 0;
          min-height: 0;
        }
      </style>
      <div class="viz-container">
        <div class="chart-area" id="slope-chart"></div>
      </div>
    `;

    this.chartContainer = d3.select(element).select("#slope-chart");
    this.svg = this.chartContainer.append("svg");
    this.filterState = 'all';
  },

  // --- 3. 描画更新 ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    const container = element.querySelector(".viz-container");
    container.style.backgroundColor = config.chart_background_color;
    container.style.borderRadius = `${config.border_radius}px`;
    container.style.boxShadow = config.box_shadow;

    const hasPivots = queryResponse.pivots && queryResponse.pivots.length >= 2;
    const hasTwoMeasures = queryResponse.fields.measures.length >= 2;

    if (queryResponse.fields.dimensions.length === 0) {
      this.addError({ title: "設定エラー", message: "ディメンションが1つ必要です。" });
      return;
    }
    if (!hasPivots && !hasTwoMeasures) {
      this.addError({ title: "データ不足", message: "比較のため2つのメジャーか、ピボットが必要です。" });
      return;
    }

    const dim = queryResponse.fields.dimensions[0];
    let startLabel, endLabel, getCellStart, getCellEnd, measureName;

    if (hasPivots) {
      const startPivot = queryResponse.pivots[0];
      const endPivot = queryResponse.pivots[queryResponse.pivots.length - 1];
      measureName = queryResponse.fields.measures[0].name;
      startLabel = startPivot.label_short || startPivot.key;
      endLabel = endPivot.label_short || endPivot.key;
      getCellStart = (row) => row[measureName][startPivot.key];
      getCellEnd = (row) => row[measureName][endPivot.key];
    } else {
      const measure1 = queryResponse.fields.measures[0];
      const measure2 = queryResponse.fields.measures[1];
      startLabel = measure1.label_short || measure1.label;
      endLabel = measure2.label_short || measure2.label;
      getCellStart = (row) => row[measure1.name];
      getCellEnd = (row) => row[measure2.name];
    }

    const processedData = data.map(row => {
      const c1 = getCellStart(row);
      const c2 = getCellEnd(row);
      const v1 = c1 ? c1.value : null;
      const v2 = c2 ? c2.value : null;
      let trend = 'flat';
      if (v1 != null && v2 != null) {
        if (v2 > v1) trend = 'up';
        else if (v2 < v1) trend = 'down';
      }
      return { row, v1, v2, c1, c2, trend };
    }).filter(d => d.v1 != null && d.v2 != null);

    const renderChart = () => {
      const rect = element.querySelector("#slope-chart").getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const margin = {
        top: config.margin_top,
        right: config.margin_right,
        bottom: config.margin_bottom,
        left: config.margin_left
      };

      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      this.svg.html("")
        .attr("width", width)
        .attr("height", height);

      const group = this.svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const activeData = processedData.filter(d => {
        if (this.filterState === 'all') return true;
        return d.trend === this.filterState;
      });

      let maxVal = 0;
      activeData.forEach(d => {
        if (d.v1 > maxVal) maxVal = d.v1;
        if (d.v2 > maxVal) maxVal = d.v2;
      });
      if (maxVal === 0) maxVal = 100;

      const y = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, maxVal * 1.1]);

      let curveFactory = d3.curveBumpX;
      if (config.curve_intensity === "linear") curveFactory = d3.curveLinear;
      if (config.curve_intensity === "natural") curveFactory = d3.curveNatural;

      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveFactory);

      const leftLabels = [];

      activeData.forEach(item => {
        const { row, v1, v2, c1, c2 } = item;
        const isSelected = LookerCharts.Utils.getCrossfilterSelection(row);
        const isDimmed = details.crossfilterEnabled && isSelected === 2;

        const points = [
          { x: 0, y: y(v1) },
          { x: chartWidth, y: y(v2) }
        ];

        const path = group.append("path")
          .datum(points)
          .attr("d", lineGenerator)
          .attr("fill", "none")
          .attr("stroke", config.line_color)
          .attr("stroke-width", config.stroke_width)
          .style("opacity", isDimmed ? 0.1 : 0.6)
          .style("cursor", "pointer")
          .style("transition", "opacity 0.2s, stroke-width 0.2s");

        path.on("click", (event) => {
          LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
        });

        path.on("mouseover", function() {
          if (!isDimmed) {
             d3.select(this).attr("stroke-width", config.stroke_width * 2).style("opacity", 1);
          }
        }).on("mouseout", function() {
          if (!isDimmed) {
             d3.select(this).attr("stroke-width", config.stroke_width).style("opacity", 0.6);
          }
        });

        const circles = [
          { cx: 0, cy: y(v1) },
          { cx: chartWidth, cy: y(v2) }
        ];

        group.selectAll(`.circle-${row[dim.name].value}`)
          .data(circles)
          .enter()
          .append("circle")
          .attr("cx", d => d.cx)
          .attr("cy", d => d.cy)
          .attr("r", config.circle_radius)
          .attr("fill", isDimmed ? "#ccc" : config.line_color)
          .style("opacity", isDimmed ? 0.1 : 1)
          .style("pointer-events", "none");

        if (!isDimmed) {
          leftLabels.push({
            y: y(v1),
            text: LookerCharts.Utils.textForCell(row[dim.name])
          });
        }
      });

      // --- ラベル描画（設定反映箇所） ---
      leftLabels.sort((a, b) => a.y - b.y);
      let lastY = -1000;

      const fontSize = config.label_font_size || 11;
      const fontWeight = config.label_font_bold ? "bold" : "500"; // ★太字設定の適用
      const labelSpacing = fontSize * 2.2;
      const maxChars = 8;

      leftLabels.forEach(label => {
        if (Math.abs(label.y - lastY) >= labelSpacing) {
          const textEl = group.append("text")
            .attr("x", -15)
            .attr("y", label.y)
            .attr("text-anchor", "end")
            .style("fill", "#555")
            .style("font-size", `${fontSize}px`)
            .style("font-family", "'Inter', sans-serif")
            .style("font-weight", fontWeight); // ★設定値を適用

          const content = label.text;
          if (content.length > maxChars) {
            const mid = Math.ceil(content.length / 2);
            const line1 = content.slice(0, mid);
            const line2 = content.slice(mid);

            textEl.append("tspan")
              .attr("x", -15)
              .attr("dy", "-0.1em")
              .text(line1);

            textEl.append("tspan")
              .attr("x", -15)
              .attr("dy", "1.1em")
              .text(line2);
          } else {
            textEl.attr("dy", "0.35em").text(content);
          }

          lastY = label.y;
        }
      });

      // 垂直軸
      const axisGroup = group.append("g").attr("class", "axis-pillars").lower();
      axisGroup.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", chartHeight)
        .attr("stroke", "#ddd").attr("stroke-width", 1).attr("stroke-dasharray", "4 4");
      axisGroup.append("line")
        .attr("x1", chartWidth).attr("y1", 0)
        .attr("x2", chartWidth).attr("y2", chartHeight)
        .attr("stroke", "#ddd").attr("stroke-width", 1).attr("stroke-dasharray", "4 4");

      // ヘッダー
      const headerStyle = { fill: "#888", size: "12px", weight: "bold" };
      const headerY = -15;

      group.append("text")
         .attr("x", 0)
         .attr("y", headerY)
         .style("text-anchor", "middle")
         .style("font-weight", headerStyle.weight)
         .style("font-size", headerStyle.size)
         .style("fill", headerStyle.fill)
         .text(startLabel);

      group.append("text")
         .attr("x", chartWidth)
         .attr("y", headerY)
         .style("text-anchor", "middle")
         .style("font-weight", headerStyle.weight)
         .style("font-size", headerStyle.size)
         .style("fill", headerStyle.fill)
         .text(endLabel);

      // チャートタイトル
      if (config.chart_title) {
        group.append("text")
          .attr("x", - margin.left + 20)
          .attr("y", - margin.top + 20)
          .attr("text-anchor", "start")
          .style("font-weight", "bold")
          .style("font-size", "14px")
          .style("fill", "#333")
          .text(config.chart_title);
      }

      // フィルタボタン
      const buttonAreaX = chartWidth + 20;
      const buttonSize = 24;
      const buttonGap = 10;
      const startY = chartHeight / 2 - (buttonSize * 4 + buttonGap * 3) / 2;

      const buttons = [
        { id: 'up',   label: '↗', color: '#4CAF50' },
        { id: 'flat', label: '→', color: '#FFC107' },
        { id: 'down', label: '↘', color: '#F44336' },
        { id: 'all',  label: '↺', color: '#999' }
      ];

      buttons.forEach((btn, i) => {
        const isActive = this.filterState === btn.id;
        const yPos = startY + i * (buttonSize + buttonGap);

        const btnGroup = group.append("g")
          .attr("transform", `translate(${buttonAreaX}, ${yPos})`)
          .style("cursor", "pointer")
          .on("click", () => {
            this.filterState = (this.filterState === btn.id) ? 'all' : btn.id;
            renderChart();
          });

        btnGroup.append("circle")
          .attr("cx", buttonSize/2)
          .attr("cy", buttonSize/2)
          .attr("r", buttonSize/2)
          .attr("fill", isActive ? btn.color : "#fff")
          .attr("stroke", isActive ? btn.color : "#ddd")
          .attr("stroke-width", 1.5);

        btnGroup.append("text")
          .attr("x", buttonSize / 2)
          .attr("y", buttonSize / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(btn.label)
          .style("fill", isActive ? "#fff" : "#999")
          .style("font-size", "14px")
          .style("font-weight", "bold");
      });
    };

    renderChart();
    done();
  }
});
