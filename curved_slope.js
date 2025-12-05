/**
 * Elegant Slope Chart v3 (Layout Matched)
 * Features:
 * - Matches container structure of the reference Line Chart (padding: 16px)
 * - Shadow options
 * - Configurable Margins
 * - Custom Background & Radius
 */

looker.plugins.visualizations.add({
  // --- 1. 設定オプション ---
  options: {
    // --- コンテナスタイル設定 ---
    chart_background_color: { // 参考コードに合わせて変数名を変更
      type: "string",
      label: "背景色",
      display: "color",
      default: "#ffffff",
      section: "Style",
      order: 1
    },
    // 参考コードにはないが、角丸の変更機能は維持
    border_radius: {
      type: "number",
      label: "角丸 (px)",
      default: 24,
      section: "Style",
      order: 2
    },
    // 影の設定（ご要望）
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
    // デフォルト値を「別のViz」に合わせました
    // padding(16px)の内側のマージン設定になります
    margin_top: {
      type: "number",
      label: "余白: 上 (px)",
      default: 30, // 別のViz(30)に合わせる
      section: "Config",
      order: 1
    },
    margin_bottom: {
      type: "number",
      label: "余白: 下 (px)",
      default: 40, // 別のViz(40)に合わせる
      section: "Config",
      order: 2
    },
    margin_left: {
      type: "number",
      label: "余白: 左 (px)",
      default: 120, // ラベル用
      section: "Config",
      order: 3
    },
    margin_right: {
      type: "number",
      label: "余白: 右 (px)",
      default: 60, // フィルタボタン用
      section: "Config",
      order: 4
    },

    // --- チャート設定 ---
    line_color: {
      type: "string",
      label: "線の色",
      display: "color",
      default: "#AA7777",
      section: "Style",
      order: 4
    },
    stroke_width: {
      type: "number",
      label: "線の太さ",
      default: 3,
      section: "Style",
      order: 5
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
      order: 6
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 5,
      section: "Style",
      order: 7
    }
  },

  // --- 2. 初期化 (構造を別のVizに合わせる) ---
  create: function(element, config) {
    // HTML構造を定義 (padding: 16px のコンテナを作成)
    element.innerHTML = `
      <style>
        .slope-viz-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #ffffff; /* 初期値 */
          border-radius: 24px;       /* 初期値 */
          overflow: hidden;
          padding: 16px;             /* ここが重要：別のVizと同じ余白 */
          box-sizing: border-box;    /* paddingを含めたサイズ計算 */
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
      <div class="slope-viz-container">
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

    // --- コンテナスタイル適用 ---
    const container = element.querySelector(".slope-viz-container");
    container.style.backgroundColor = config.chart_background_color;
    container.style.borderRadius = `${config.border_radius}px`;
    container.style.boxShadow = config.box_shadow;

    // --- データ検証 ---
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

    // --- データ読み解き ---
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

    // --- データ処理 ---
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

    // --- 描画ロジック ---
    const renderChart = () => {
      // .chart-area のサイズを取得 (padding 16px が除かれたサイズ)
      const rect = element.querySelector("#slope-chart").getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // SVG内部のマージン設定
      // ユーザー設定 (デフォルトは Top:30, Bottom:40)
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

      // Y軸スケール
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

        // 線
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

        // 円
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

      // 左軸ラベル（間引き）
      leftLabels.sort((a, b) => a.y - b.y);
      let lastY = -1000;
      const labelSpacing = 16;

      leftLabels.forEach(label => {
        if (Math.abs(label.y - lastY) >= labelSpacing) {
          group.append("text")
            .attr("x", -15)
            .attr("y", label.y)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(label.text)
            .style("fill", "#555")
            .style("font-size", "11px")
            .style("font-family", "'Inter', sans-serif")
            .style("font-weight", "500");
          lastY = label.y;
        }
      });

      // ヘッダー（上部マージン内に配置）
      const headerStyle = { fill: "#888", size: "12px", weight: "bold" };
      const headerY = - (config.margin_top / 2);

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
