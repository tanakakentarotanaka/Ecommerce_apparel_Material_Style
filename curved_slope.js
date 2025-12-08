/**
 * Elegant Slope Chart v8 (Title Styling Full Control)
 * * New Features:
 * 1. Chart Title Color setting.
 * 2. Chart Title Bold toggle.
 */

looker.plugins.visualizations.add({
  // --- 1. 設定オプション ---
  options: {
    // --- チャートタイトル設定 ---
    chart_title: {
      type: "string",
      label: "1. タイトル: テキスト",
      default: "",
      placeholder: "タイトルを入力...",
      section: "Title",
      order: 1
    },
    chart_title_align: {
      type: "string",
      label: "2. タイトル: 配置",
      display: "select",
      values: [
        {"左寄せ": "start"},
        {"中央": "middle"},
        {"右寄せ": "end"}
      ],
      default: "middle",
      section: "Title",
      order: 2
    },
    chart_title_x: {
      type: "number",
      label: "3. タイトル: X軸調整 (px)",
      default: 0,
      section: "Title",
      order: 3
    },
    chart_title_y: {
      type: "number",
      label: "4. タイトル: Y軸調整 (px)",
      default: -25,
      section: "Title",
      order: 4
    },
    chart_title_size: {
      type: "number",
      label: "5. タイトル: 文字サイズ (px)",
      default: 16,
      section: "Title",
      order: 5
    },
    chart_title_color: {
      type: "string",
      label: "6. タイトル: 文字色",
      display: "color",
      default: "#333333",
      section: "Title",
      order: 6
    },
    chart_title_bold: {
      type: "boolean",
      label: "7. タイトル: 太字",
      default: true,
      section: "Title",
      order: 7
    },

    // --- ディメンションラベル設定 (左側の文字) ---
    dimension_label_size: {
      type: "number",
      label: "ラベル: 文字サイズ (px)",
      default: 11,
      section: "Labels",
      order: 1
    },
    dimension_label_bold: {
      type: "boolean",
      label: "ラベル: 太字にする",
      default: false,
      section: "Labels",
      order: 2
    },

    // --- スタイル設定 ---
    chart_background_color: {
      type: "string",
      label: "背景色",
      display: "color",
      default: "#ffffff",
      section: "Style",
      order: 1
    },
    border_radius: {
      type: "number",
      label: "角丸 (px)",
      default: 24,
      section: "Style",
      order: 2
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
      order: 3
    },

    // --- レイアウト (マージン) ---
    margin_top: {
      type: "number",
      label: "余白: 上 (px)",
      default: 50,
      section: "Layout",
      order: 1
    },
    margin_bottom: {
      type: "number",
      label: "余白: 下 (px)",
      default: 10,
      section: "Layout",
      order: 2
    },
    margin_left: {
      type: "number",
      label: "余白: 左 (px)",
      default: 120,
      section: "Layout",
      order: 3
    },
    margin_right: {
      type: "number",
      label: "余白: 右 (px)",
      default: 60,
      section: "Layout",
      order: 4
    },

    // --- チャート設定 ---
    line_color: {
      type: "string",
      label: "線の色",
      display: "color",
      default: "#AA7777",
      section: "Chart",
      order: 1
    },
    stroke_width: {
      type: "number",
      label: "線の太さ",
      default: 3,
      section: "Chart",
      order: 2
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
      section: "Chart",
      order: 3
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 5,
      section: "Chart",
      order: 4
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

    // データ検証
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

      // フィルタリング
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

      // パスと点の描画
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

      // --- ディメンションラベル描画 ---
      leftLabels.sort((a, b) => a.y - b.y);
      let lastY = -1000;

      const labelSize = config.dimension_label_size || 11;
      const labelBold = config.dimension_label_bold ? "bold" : "500";
      const labelSpacing = labelSize * 2.2;
      const maxChars = 8;

      leftLabels.forEach(label => {
        if (Math.abs(label.y - lastY) >= labelSpacing) {
          const textEl = group.append("text")
            .attr("x", -15)
            .attr("y", label.y)
            .attr("text-anchor", "end")
            .style("fill", "#555")
            .style("font-size", `${labelSize}px`)
            .style("font-family", "'Inter', sans-serif")
            .style("font-weight", labelBold);

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

      // ヘッダーラベル (Start / End)
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

      // --- ★更新: チャートタイトル描画 (色・太字設定反映) ---
      if (config.chart_title) {
        let titleX = 0;
        let anchor = "start";

        if (config.chart_title_align === "middle") {
          titleX = chartWidth / 2;
          anchor = "middle";
        } else if (config.chart_title_align === "end") {
          titleX = chartWidth;
          anchor = "end";
        }

        titleX += (config.chart_title_x || 0);
        const titleY = (config.chart_title_y || 0);

        // 設定値の取得 (デフォルト値を考慮)
        const titleColor = config.chart_title_color || "#333333";
        const titleWeight = config.chart_title_bold ? "bold" : "normal";

        group.append("text")
          .attr("x", titleX)
          .attr("y", titleY)
          .attr("text-anchor", anchor)
          .style("font-weight", titleWeight) // 太字設定を反映
          .style("font-size", `${config.chart_title_size || 16}px`)
          .style("fill", titleColor) // 色設定を反映
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
