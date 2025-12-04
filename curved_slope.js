/**
 * Curved Slope Chart for Fashion BI
 * "Rose_Quartz_Runway" Theme Compatible
 */

looker.plugins.visualizations.add({
  // ユーザーが設定可能なオプション（色やサイズなど）
  options: {
    line_color: {
      type: "string",
      label: "線の色 (デフォルト)",
      display: "color",
      default: "#AA7777", // テーマのメインカラー
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
      label: "カーブの強さ",
      display: "select",
      values: [
        {"直線": "linear"},
        {"緩やか": "natural"},
        {"S字カーブ": "bumpX"} // オススメ
      ],
      default: "bumpX",
      section: "Style"
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 6,
      section: "Style"
    }
  },

  // ビジュアライゼーションの初期化
  create: function(element, config) {
    element.innerHTML = "";
    // D3.jsを使ってSVGコンテナを作成
    this.svg = d3.select(element).append("svg");
  },

  // データの更新時に呼び出される関数 (非同期推奨) [cite: 139, 196]
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // エラーハンドリング: ディメンション1つ、メジャー2つが必要
    if (queryResponse.fields.dimensions.length === 0 || queryResponse.fields.measures.length < 2) {
      this.addError({ title: "データ設定エラー", message: "このチャートには、1つのディメンション（商品名など）と、比較する2つのメジャー（先月と今月など）が必要です。" });
      return;
    }

    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 40, right: 50, bottom: 20, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // SVGのリセットとサイズ設定
    this.svg.html("")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "'Inter', sans-serif"); // テーマのフォント [cite: 485]

    const group = this.svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // データの抽出
    const dim = queryResponse.fields.dimensions[0];
    const measure1 = queryResponse.fields.measures[0];
    const measure2 = queryResponse.fields.measures[1];

    // 全データの最大値を取得してY軸のスケールを決める
    const allValues = [];
    data.forEach(d => {
      allValues.push(d[measure1.name].value);
      allValues.push(d[measure2.name].value);
    });
    const maxVal = d3.max(allValues) || 100;

    // スケール設定 (X軸: 左端と右端, Y軸: 値)
    const x = d3.scalePoint().range([0, chartWidth]).padding(0.1).domain([measure1.label_short || "期間A", measure2.label_short || "期間B"]);
    const y = d3.scaleLinear().range([chartHeight, 0]).domain([0, maxVal * 1.1]); // 少し余裕を持たせる

    // カーブ関数の選択
    let curveFactory;
    switch(config.curve_intensity) {
      case "linear": curveFactory = d3.curveLinear; break;
      case "natural": curveFactory = d3.curveNatural; break;
      case "bumpX": default: curveFactory = d3.curveBumpX; break;
    }

    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(curveFactory);

    // 描画ループ
    data.forEach(row => {
      // クロスフィルターの状態を取得 (0: なし, 1: 選択中, 2: 非選択) [cite: 275]
      const isSelected = LookerCharts.Utils.getCrossfilterSelection(row);
      const isDimmed = details.crossfilterEnabled && isSelected === 2; // 非選択状態なら薄くする

      const val1 = row[measure1.name].value;
      const val2 = row[measure2.name].value;

      if (val1 == null || val2 == null) return;

      const points = [
        { x: 0, y: y(val1) },
        { x: chartWidth, y: y(val2) }
      ];

      // 線の描画
      const path = group.append("path")
        .datum(points)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", config.line_color || "#AA7777")
        .attr("stroke-width", config.stroke_width)
        .style("opacity", isDimmed ? 0.1 : 0.8) // クロスフィルター非選択時は透明度を下げる
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease"); // アニメーション

      // マウスオーバー効果
      path.on("mouseover", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width * 2);
      }).on("mouseout", function() {
        if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width);
      });

      // クロスフィルタリングのトリガー [cite: 261]
      path.on("click", (event) => {
        LookerCharts.Utils.toggleCrossfilter({
          row: row,
          event: event
        });
      });

      // 両端の円を描画
      const circles = [
        { cx: 0, cy: y(val1), val: val1 },
        { cx: chartWidth, cy: y(val2), val: val2 }
      ];

      group.selectAll(`.circle-${row[dim.name].value}`) // ユニークなクラス名などを付けるのが理想
        .data(circles)
        .enter()
        .append("circle")
        .attr("cx", d => d.cx)
        .attr("cy", d => d.cy)
        .attr("r", config.circle_radius)
        .attr("fill", isDimmed ? "#ccc" : (config.line_color || "#AA7777"))
        .style("opacity", isDimmed ? 0.1 : 1);

      // ラベル（商品名）を左側に表示
      if (!isDimmed) {
         group.append("text")
          .attr("x", -10)
          .attr("y", y(val1))
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(LookerCharts.Utils.textForCell(row[dim.name])) // フォーマット済みテキストを使用 [cite: 251]
          .style("fill", "#333333")
          .style("font-size", "12px");
      }
    });

    // 軸ラベルの表示
    group.append("text")
       .attr("x", 0)
       .attr("y", -10)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#AA7777")
       .text(measure1.label_short || "Start");

    group.append("text")
       .attr("x", chartWidth)
       .attr("y", -10)
       .style("text-anchor", "middle")
       .style("font-weight", "bold")
       .style("fill", "#AA7777")
       .text(measure2.label_short || "End");

    done(); // 描画完了を通知 [cite: 240]
  }
});
