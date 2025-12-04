/**
 * Curved Slope Chart for Fashion BI (Pivot & Flat Data Compatible)
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

    // --- データの読み解きロジック (ここが重要) ---
    const dim = queryResponse.fields.dimensions[0];
    let startLabel, endLabel, getValueStart, getValueEnd, measureName;

    if (hasPivots) {
      // パターンA: 画像のようなピボットテーブルの場合
      // 最初の列(2026-09)と最後の列(2026-12)を比較します
      const startPivot = queryResponse.pivots[0];
      const endPivot = queryResponse.pivots[queryResponse.pivots.length - 1]; // 最後の列を取得
      measureName = queryResponse.fields.measures[0].name; // ピボット時はメジャーは1つ扱いのことが多い

      startLabel = startPivot.label_short || startPivot.key; // "2026-09"
      endLabel = endPivot.label_short || endPivot.key;     // "2026-12"

      // ピボットデータへのアクセス関数
      getValueStart = (row) => row[measureName][startPivot.key].value;
      getValueEnd = (row) => row[measureName][endPivot.key].value;

    } else {
      // パターンB: ピボットなしで2つのメジャーを選んだ場合
      const measure1 = queryResponse.fields.measures[0];
      const measure2 = queryResponse.fields.measures[1];

      startLabel = measure1.label_short || measure1.label;
      endLabel = measure2.label_short || measure2.label;

      // 通常データへのアクセス関数
      getValueStart = (row) => row[measure1.name].value;
      getValueEnd = (row) => row[measure2.name].value;
    }

    // --- 描画準備 ---
    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 40, right: 60, bottom: 20, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    this.svg.html("")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "'Inter', sans-serif");

    const group = this.svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y軸のスケール計算 (全データの最大値を探す)
    let maxVal = 0;
    data.forEach(d => {
      const v1 = getValueStart(d);
      const v2 = getValueEnd(d);
      if (v1 > maxVal) maxVal = v1;
      if (v2 > maxVal) maxVal = v2;
    });

    // スケール設定
    const y = d3.scaleLinear()
      .range([chartHeight, 0])
      .domain([0, maxVal * 1.1]); // 余白

    // カーブ生成器
    let curveFactory = d3.curveBumpX; // デフォルト
    if(config.curve_intensity === "linear") curveFactory = d3.curveLinear;
    if(config.curve_intensity === "natural") curveFactory = d3.curveNatural;

    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveFactory);

    // --- データ描画ループ ---
    data.forEach(row => {
      // ピボットの場合、row[measureName]の中にデータが入っているため、構造が変わることに注意
      // ここでは上で定義した getValueStart/End 関数を使うので共通化されています
      const val1 = getValueStart(row);
      const val2 = getValueEnd(row);

      // データが欠損している場合はスキップ
      if (val1 == null || val2 == null) return;

      // クロスフィルター判定
      // ピボットの有無に関わらず、行(Product)でフィルタリングするため row を渡す
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

      // インタラクション
      path.on("mouseover", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width * 2.5);
      })
      .on("mouseout", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width);
      })
      .on("click", (event) => {
        // LookerのAPIドキュメントに基づき、行レベルのフィルタリングを実行
        LookerCharts.Utils.toggleCrossfilter({
          row: row,
          event: event
        });
      });

      // 両端の円と値ラベル
      const circles = [
        { cx: 0, cy: y(val1), val: val1, align: "end", xOff: -10 },
        { cx: chartWidth, cy: y(val2), val: val2, align: "start", xOff: 10 }
      ];

      // 円の描画
      group.selectAll(`.circle-${row[dim.name].value}`) // ユニーク化
        .data(circles)
        .enter()
        .append("circle")
        .attr("cx", d => d.cx)
        .attr("cy", d => d.cy)
        .attr("r", config.circle_radius)
        .attr("fill", isDimmed ? "#ccc" : config.line_color)
        .style("opacity", isDimmed ? 0.1 : 1);

      // 商品名ラベル (左側のみに表示)
      if (!isDimmed) {
        group.append("text")
          .attr("x", -15)
          .attr("y", y(val1))
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(LookerCharts.Utils.textForCell(row[dim.name]))
          .style("fill", "#333333")
          .style("font-size", "11px")
          .style("font-weight", "500");

         // 値ラベル (左右に表示)
         circles.forEach(c => {
             group.append("text")
              .attr("x", c.cx + (c.align === "start" ? 10 : -10))
              .attr("y", c.cy - 10)
              .attr("text-anchor", c.align === "start" ? "start" : "end")
              .text("¥" + d3.format(",")(c.val)) // フォーマット調整
              .style("fill", config.line_color)
              .style("font-size", "10px");
         });
      }
    });

    // --- ヘッダー（期間ラベル） ---
    // 左上
    group.append("text")
       .attr("x", 0)
       .attr("y", -20)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#888")
       .text(startLabel); // 例: 2026-09

    // 右上
    group.append("text")
       .attr("x", chartWidth)
       .attr("y", -20)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#888")
       .text(endLabel); // 例: 2026-12

    done();
  }
});
