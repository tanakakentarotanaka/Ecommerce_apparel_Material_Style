/**
 * three_ring_viz.js
 * 3つの指標を連携するリングチャートを表示するカスタムビジュアライゼーション
 */

looker.plugins.visualizations.add({
  // 設定オプション（ユーザーが編集画面で変更できる項目）
  options: {
    circle1Color: {
      type: "array",
      label: "1. 大リングの色 (下)",
      display: "color",
      default: ["#4285F4"] // Google Blue
    },
    circle2Color: {
      type: "array",
      label: "2. 中リングの色 (左上)",
      display: "color",
      default: ["#FBBC04"] // Google Yellow
    },
    circle3Color: {
      type: "array",
      label: "3. 小リングの色 (右上)",
      display: "color",
      default: ["#34A853"] // Google Green
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

  // ビジュアライゼーションの初期化処理
  create: function(element, config) {
    // 既存の要素をクリア
    element.innerHTML = "";

    // SVGコンテナを作成
    this.container = d3.select(element)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
  },

  // データの描画・更新処理
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // エラーハンドリング
    this.clearErrors();
    if (data.length == 0 || queryResponse.fields.measures.length < 3) {
      this.addError({ title: "データ不足", message: "少なくとも3つのメジャー（指標）を選択してください。" });
      return;
    }

    // 設定値の取得（デフォルト値を適用）
    const c1Color = config.circle1Color ? config.circle1Color[0] : "#4285F4";
    const c2Color = config.circle2Color ? config.circle2Color[0] : "#FBBC04";
    const c3Color = config.circle3Color ? config.circle3Color[0] : "#34A853";
    const txtColor = config.labelColor ? config.labelColor[0] : "#333333";
    const thickness = config.ringThickness || 15;

    // データの抽出（最初の行のデータを使用）
    const row = data[0];
    const measures = queryResponse.fields.measures;

    // 表示用に数値をフォーマットする関数
    const formatValue = (value) => {
      if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
      if (value >= 1000) return (value / 1000).toFixed(1) + "K";
      return value.toLocaleString();
    };

    // 3つのノードデータを定義
    // サイズ比率: 大(1.0), 中(0.7), 小(0.5)
    const nodes = [
      { id: 0, r: 80,  x: 0,   y: 100, color: c1Color, val: row[measures[0].name].value, label: measures[0].label_short || measures[0].label },
      { id: 1, r: 55,  x: -60, y: -40, color: c2Color, val: row[measures[1].name].value, label: measures[1].label_short || measures[1].label },
      { id: 2, r: 40,  x: 40,  y: -100, color: c3Color, val: row[measures[2].name].value, label: measures[2].label_short || measures[2].label }
    ];

    // 描画エリアのサイズ取得
    const width = element.clientWidth;
    const height = element.clientHeight;

    // SVGの更新
    const svg = this.container;
    svg.selectAll("*").remove(); // 前回の描画を消去

    // 全体を中央に配置するためのグループ
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // --- 接続線の描画 ---
    // つなぎ方: 大(0) -> 中(1) -> 小(2)
    const links = [
      { source: nodes[0], target: nodes[1] },
      { source: nodes[1], target: nodes[2] }
    ];

    g.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 4);

    // --- リング（ドーナツ）の描画 ---
    const arc = d3.arc()
      .innerRadius(d => d.r - thickness)
      .outerRadius(d => d.r)
      .startAngle(0);

    const groups = g.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // アニメーション付きで円を描画
    groups.append("path")
      .attr("fill", d => d.color)
      .datum(d => d)
      .transition()
      .duration(1000) // 1秒かけてアニメーション
      .attrTween("d", function(d) {
        // 0度から360度(2*PI)までアニメーション
        const i = d3.interpolate(0, 2 * Math.PI);
        return function(t) {
          d.endAngle = i(t);
          return arc(d);
        }
      });

    // --- テキスト（数値）の描画 ---
    // 数値
    groups.append("text")
      .attr("dy", "0.35em") // 垂直方向の中央揃え
      .attr("text-anchor", "middle")
      .attr("fill", txtColor)
      .style("font-size", d => Math.max(10, d.r / 2.5) + "px") // 円の大きさに合わせて文字サイズ調整
      .style("font-weight", "bold")
      .style("opacity", 0) // 最初は透明
      .text(d => formatValue(d.val))
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", 1); // ふわっと表示

    // ラベル（項目名）を円の下に表示
    groups.append("text")
      .attr("dy", d => d.r + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("font-size", "11px")
      .text(d => d.label);

    // 処理完了をLookerに通知
    done();
  }
});
