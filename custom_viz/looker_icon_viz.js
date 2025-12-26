/**
 * three_ring_viz.js
 * 3つの指標を連携するリングチャートを表示するカスタムビジュアライゼーション
 * 更新: 接続線を円の「手前」に表示し、文字をさらにその上に配置
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    circle1Color: {
      type: "array",
      label: "1. 大リングの色 (下)",
      display: "color",
      default: ["#4285F4"]
    },
    circle2Color: {
      type: "array",
      label: "2. 中リングの色 (左上)",
      display: "color",
      default: ["#FBBC04"]
    },
    circle3Color: {
      type: "array",
      label: "3. 小リングの色 (右上)",
      display: "color",
      default: ["#34A853"]
    },
    lineColor: {
      type: "array",
      label: "接続線の色",
      display: "color",
      default: ["#cccccc"]
    },
    labelColor: {
      type: "array",
      label: "文字の色",
      display: "color",
      default: ["#333333"]
    },
    ringThickness: {
      type: "number",
      label: "リングの太さ (px)",
      default: 15
    }
  },

  // 初期化
  create: function(element, config) {
    element.innerHTML = "";
    this.container = d3.select(element)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
  },

  // 描画・更新
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    if (data.length == 0 || queryResponse.fields.measures.length < 3) {
      this.addError({ title: "データ不足", message: "少なくとも3つのメジャー（指標）を選択してください。" });
      return;
    }

    // --- 設定値取得 ---
    const c1Color = config.circle1Color ? config.circle1Color[0] : "#4285F4";
    const c2Color = config.circle2Color ? config.circle2Color[0] : "#FBBC04";
    const c3Color = config.circle3Color ? config.circle3Color[0] : "#34A853";
    const lnColor = config.lineColor ? config.lineColor[0] : "#cccccc";
    const txtColor = config.labelColor ? config.labelColor[0] : "#333333";
    const thickness = config.ringThickness || 15;

    // --- データ準備 ---
    const row = data[0];
    const measures = queryResponse.fields.measures;

    const formatValue = (value) => {
      if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
      if (value >= 1000) return (value / 1000).toFixed(1) + "K";
      return value.toLocaleString();
    };

    // ノード定義
    const nodes = [
      { id: 0, r: 80,  x: 0,   y: 100, color: c1Color, val: row[measures[0].name].value, label: measures[0].label_short || measures[0].label },
      { id: 1, r: 55,  x: -60, y: -40, color: c2Color, val: row[measures[1].name].value, label: measures[1].label_short || measures[1].label },
      { id: 2, r: 40,  x: 40,  y: -100, color: c3Color, val: row[measures[2].name].value, label: measures[2].label_short || measures[2].label }
    ];

    // リンク定義
    const links = [
      { source: nodes[0], target: nodes[1] },
      { source: nodes[1], target: nodes[2] }
    ];

    // --- 描画処理 ---
    const width = element.clientWidth;
    const height = element.clientHeight;
    const svg = this.container;
    svg.selectAll("*").remove();

    // 全体のグループ
    const mainGroup = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    /** * レイヤー（重なり順）の定義
     * SVGは追加した順に上に重なるため、ここでグループを作成して順序を固定します。
     */
    const circleLayer = mainGroup.append("g").attr("class", "layer-circles"); // 1. 一番下：円
    const lineLayer   = mainGroup.append("g").attr("class", "layer-lines");   // 2. 中間：線（円の上）
    const textLayer   = mainGroup.append("g").attr("class", "layer-texts");   // 3. 最前面：文字（線の上）

    // 1. 円（リング）の描画
    const arc = d3.arc()
      .innerRadius(d => d.r - thickness)
      .outerRadius(d => d.r)
      .startAngle(0);

    circleLayer.selectAll(".ring-path")
      .data(nodes)
      .enter()
      .append("path")
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .attr("fill", d => d.color)
      .datum(d => d)
      .transition()
      .duration(1000)
      .attrTween("d", function(d) {
        const i = d3.interpolate(0, 2 * Math.PI);
        return function(t) {
          d.endAngle = i(t);
          return arc(d);
        }
      });

    // 2. 接続線の描画（ここが円より後に描かれるので手前になります）
    lineLayer.selectAll(".link-line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", lnColor)
      .attr("stroke-width", 4);

    // 3. テキストの描画（最前面）
    // グループ化してデータバインド
    const textGroups = textLayer.selectAll(".text-group")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // 数値ラベル
    textGroups.append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", txtColor)
      .style("font-size", d => Math.max(10, d.r / 2.5) + "px")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(d => formatValue(d.val))
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1);

    // 項目名ラベル
    textGroups.append("text")
      .attr("dy", d => d.r + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("font-size", "11px")
      .text(d => d.label);

    done();
  }
});
