/**
 * Curved Slope Chart for Fashion BI (Label Overlap Fix)
 * "Rose_Quartz_Runway" Theme Compatible
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    line_color: {
      type: "string",
      label: "線の色",
      display: "color",
      default: "#AA7777",
      section: "Style"
    },
    stroke_width: {
      type: "number",
      label: "線の太さ",
      default: 3,
      section: "Style"
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
      section: "Style"
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 5,
      section: "Style"
    }
  },

  create: function(element, config) {
    element.innerHTML = "";
    this.svg = d3.select(element).append("svg");
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // データの整合性チェック
    const hasPivots = queryResponse.pivots && queryResponse.pivots.length >= 2;
    const hasTwoMeasures = queryResponse.fields.measures.length >= 2;

    if (queryResponse.fields.dimensions.length === 0) {
      this.addError({ title: "設定エラー", message: "ディメンション（商品名など）が1つ必要です。" });
      return;
    }
    if (!hasPivots && !hasTwoMeasures) {
      this.addError({ title: "データ不足", message: "比較のために「2つのメジャー」を選択するか、ピボットで「2つ以上の期間」を表示してください。" });
      return;
    }

    // --- データの読み解き ---
    const dim = queryResponse.fields.dimensions[0];
    let startLabel, endLabel, getCellStart, getCellEnd, measureName;

    if (hasPivots) {
      // ピボットあり
      const startPivot = queryResponse.pivots[0];
      const endPivot = queryResponse.pivots[queryResponse.pivots.length - 1];
      measureName = queryResponse.fields.measures[0].name;

      startLabel = startPivot.label_short || startPivot.key;
      endLabel = endPivot.label_short || endPivot.key;

      getCellStart = (row) => row[measureName][startPivot.key];
      getCellEnd = (row) => row[measureName][endPivot.key];
    } else {
      // ピボットなし
      const measure1 = queryResponse.fields.measures[0];
      const measure2 = queryResponse.fields.measures[1];

      startLabel = measure1.label_short || measure1.label;
      endLabel = measure2.label_short || measure2.label;

      getCellStart = (row) => row[measure1.name];
      getCellEnd = (row) => row[measure2.name];
    }

    // --- 描画準備 ---
    const width = element.clientWidth;
    const height = element.clientHeight;
    // ★修正1: 左余白(left)を 60 -> 150 に拡大して文字切れを防止
    const margin = { top: 40, right: 60, bottom: 20, left: 150 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    this.svg.html("")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "'Inter', sans-serif");

    const group = this.svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y軸スケール計算
    let maxVal = 0;
    data.forEach(d => {
      const v1 = getCellStart(d).value;
      const v2 = getCellEnd(d).value;
      if (v1 > maxVal) maxVal = v1;
      if (v2 > maxVal) maxVal = v2;
    });

    const y = d3.scaleLinear()
      .range([chartHeight, 0])
      .domain([0, maxVal * 1.1]);

    // カーブ生成
    let curveFactory = d3.curveBumpX;
    if(config.curve_intensity === "linear") curveFactory = d3.curveLinear;
    if(config.curve_intensity === "natural") curveFactory = d3.curveNatural;

    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveFactory);

    // ★修正2: ラベル表示用の配列を準備
    const leftLabels = [];

    // --- データ描画ループ ---
    data.forEach(row => {
      const cell1 = getCellStart(row);
      const cell2 = getCellEnd(row);
      const val1 = cell1.value;
      const val2 = cell2.value;

      if (val1 == null || val2 == null) return;

      const isSelected = LookerCharts.Utils.getCrossfilterSelection(row);
      const isDimmed = details.crossfilterEnabled && isSelected === 2;

      const points = [
        { x: 0, y: y(val1) },
        { x: chartWidth, y: y(val2) }
      ];

      // 線の描画
      const path = group.append("path")
        .datum(points)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", config.line_color)
        .attr("stroke-width", config.stroke_width)
        .style("opacity", isDimmed ? 0.1 : 0.8)
        .style("cursor", "pointer")
        .style("transition", "all 0.3s");

      path.on("mouseover", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width * 2.5);
      })
      .on("mouseout", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width);
      })
      .on("click", (event) => {
        LookerCharts.Utils.toggleCrossfilter({
          row: row,
          event: event
        });
      });

      // 円と数値ラベル
      const circles = [
        { cx: 0, cy: y(val1), formattedText: LookerCharts.Utils.textForCell(cell1), align: "end", xOff: -10 },
        { cx: chartWidth, cy: y(val2), formattedText: LookerCharts.Utils.textForCell(cell2), align: "start", xOff: 10 }
      ];

      group.selectAll(`.circle-${row[dim.name].value}`)
        .data(circles)
        .enter()
        .append("circle")
        .attr("cx", d => d.cx)
        .attr("cy", d => d.cy)
        .attr("r", config.circle_radius)
        .attr("fill", isDimmed ? "#ccc" : config.line_color)
        .style("opacity", isDimmed ? 0.1 : 1);

      if (!isDimmed) {
        // ★修正2: 商品名ラベルをすぐ描画せず、リストに追加する
        leftLabels.push({
          y: y(val1),
          text: LookerCharts.Utils.textForCell(row[dim.name])
        });

         // 数値ラベル（左右の金額等）はそのまま表示
         circles.forEach(c => {
             group.append("text")
              .attr("x", c.cx + (c.align === "start" ? 10 : -10))
              .attr("y", c.cy - 10)
              .attr("text-anchor", c.align === "start" ? "start" : "end")
              .text(c.formattedText)
              .style("fill", config.line_color)
              .style("font-size", "10px");
         });
      }
    });

    // ★修正2: 商品名ラベルの重なり判定と描画
    // Y座標でソート
    leftLabels.sort((a, b) => a.y - b.y);

    let lastY = -1000; // 直前に描画したY座標
    const labelSpacing = 14; // ラベル同士に必要な間隔(px)

    leftLabels.forEach(label => {
      // 前のラベルと十分離れていれば描画する
      if (Math.abs(label.y - lastY) >= labelSpacing) {
        group.append("text")
          .attr("x", -15)
          .attr("y", label.y)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(label.text)
          .style("fill", "#333333")
          .style("font-size", "11px")
          .style("font-weight", "500");

        lastY = label.y; // 描画した位置を更新
      }
    });

    // --- ヘッダー ---
    group.append("text")
       .attr("x", 0)
       .attr("y", -20)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#888")
       .text(startLabel);

    group.append("text")
       .attr("x", chartWidth)
       .attr("y", -20)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#888")
       .text(endLabel);

    done();
  }
});
