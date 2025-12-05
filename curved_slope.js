/**
 * Elegant Slope Chart for Fashion BI
 * Features: Curved lines, Cross-filtering, Custom Background/Radius
 */

looker.plugins.visualizations.add({
  // --- 1. 設定オプション (Configuration UI) ---
  options: {
    // スタイル設定（背景・角丸）
    background_color: {
      type: "string",
      label: "背景色",
      display: "color",
      default: "#ffffff", // デフォルトは白
      section: "Container Style",
      order: 1
    },
    border_radius: {
      type: "number",
      label: "角丸のサイズ (px)",
      default: 24, // テーマに合わせた24px
      section: "Container Style",
      order: 2
    },
    // チャート設定
    line_color: {
      type: "string",
      label: "線の色",
      display: "color",
      default: "#AA7777", // Rose Quartz
      section: "Chart Style"
    },
    stroke_width: {
      type: "number",
      label: "線の太さ",
      default: 3,
      section: "Chart Style"
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
      section: "Chart Style"
    },
    circle_radius: {
      type: "number",
      label: "点の半径",
      default: 4,
      section: "Chart Style"
    }
  },

  // --- 2. 初期化 (Create) ---
  create: function(element, config) {
    // コンテナのスタイル初期設定
    element.style.fontFamily = "'Inter', sans-serif"; // フォント指定
    element.style.overflow = "hidden"; // 角丸からはみ出さないようにする

    this.container = d3.select(element);
    this.svg = this.container.append("svg");
    this.filterState = 'all';
  },

  // --- 3. 描画更新 (UpdateAsync) ---
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors(); // エラーのクリア

    // --- コンテナスタイルの適用 (背景色・角丸) ---
    // ここでユーザー設定の背景色と角丸をDOM要素に直接適用します
    element.style.backgroundColor = config.background_color;
    element.style.borderRadius = `${config.border_radius}px`;

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
      const width = element.clientWidth;
      const height = element.clientHeight;
      const margin = { top: 50, right: 60, bottom: 20, left: 120 }; // マージン調整
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      this.svg.html("")
        .attr("width", width)
        .attr("height", height);

      const group = this.svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // 1. 内部フィルタリング
      const activeData = processedData.filter(d => {
        if (this.filterState === 'all') return true;
        return d.trend === this.filterState;
      });

      // 2. スケール設定
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

      // 3. パスと点の描画
      activeData.forEach(item => {
        const { row, v1, v2, c1, c2 } = item;

        // クロスフィルタリングの状態を取得
        const isSelected = LookerCharts.Utils.getCrossfilterSelection(row);
        const isDimmed = details.crossfilterEnabled && isSelected === 2; // UNSELECTED = 2

        const points = [
          { x: 0, y: y(v1) },
          { x: chartWidth, y: y(v2) }
        ];

        // 線の描画
        const path = group.append("path")
          .datum(points)
          .attr("d", lineGenerator)
          .attr("fill", "none")
          .attr("stroke", config.line_color)
          .attr("stroke-width", config.stroke_width)
          .style("opacity", isDimmed ? 0.1 : 0.6) // 非選択時は薄く
          .style("cursor", "pointer")
          .style("transition", "opacity 0.2s, stroke-width 0.2s");

        // クロスフィルタリングイベントの発火
        path.on("click", (event) => {
          if (!details.crossfilterEnabled) {
             // 通常のクリック時の挙動があれば記述
          }
          LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
        });

        // ホバー効果
        path.on("mouseover", function() {
          if (!isDimmed) {
             d3.select(this)
               .attr("stroke-width", config.stroke_width * 2)
               .style("opacity", 1);
          }
        }).on("mouseout", function() {
          if (!isDimmed) {
             d3.select(this)
               .attr("stroke-width", config.stroke_width)
               .style("opacity", 0.6);
          }
        });

        // 円の描画
        const circles = [
          { cx: 0, cy: y(v1), val: v1 },
          { cx: chartWidth, cy: y(v2), val: v2 }
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
          .style("pointer-events", "none"); // クリックは線を優先

        // ラベル用データ収集（重なり回避のため）
        if (!isDimmed) {
          leftLabels.push({
            y: y(v1),
            text: LookerCharts.Utils.textForCell(row[dim.name]) //
          });
        }
      });

      // 4. 左軸ラベル（アイテム名）の間引き描画
      leftLabels.sort((a, b) => a.y - b.y);
      let lastY = -1000;
      const labelSpacing = 16; // フォントサイズに合わせて調整

      leftLabels.forEach(label => {
        if (Math.abs(label.y - lastY) >= labelSpacing) {
          group.append("text")
            .attr("x", -15)
            .attr("y", label.y)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(label.text)
            .style("fill", "#555") // 少し濃いグレー
            .style("font-size", "11px")
            .style("font-family", "'Inter', sans-serif")
            .style("font-weight", "500");
          lastY = label.y;
        }
      });

      // 5. ヘッダー（期間ラベル）
      const headerStyle = { fill: "#888", size: "12px", weight: "bold" };
      group.append("text")
         .attr("x", 0)
         .attr("y", -25)
         .style("text-anchor", "middle")
         .style("font-weight", headerStyle.weight)
         .style("font-size", headerStyle.size)
         .style("fill", headerStyle.fill)
         .text(startLabel);

      group.append("text")
         .attr("x", chartWidth)
         .attr("y", -25)
         .style("text-anchor", "middle")
         .style("font-weight", headerStyle.weight)
         .style("font-size", headerStyle.size)
         .style("fill", headerStyle.fill)
         .text(endLabel);

       // 6. シンプルなアイコンフィルタ (チャート右側)
      const buttonAreaX = chartWidth + 25;
      const buttonSize = 24;
      const buttonGap = 10;
      const startY = chartHeight / 2 - (buttonSize * 4) / 2;

      const buttons = [
        { id: 'up',   label: '↗', color: '#4CAF50' }, // 上昇トレンド
        { id: 'flat', label: '→', color: '#FFC107' }, // 横ばい
        { id: 'down', label: '↘', color: '#F44336' }, // 下降
        { id: 'all',  label: '↺', color: '#999' }     // リセット
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

        // 丸いボタン背景
        btnGroup.append("circle")
          .attr("cx", buttonSize/2)
          .attr("cy", buttonSize/2)
          .attr("r", buttonSize/2)
          .attr("fill", isActive ? btn.color : "#fff")
          .attr("stroke", isActive ? btn.color : "#ddd")
          .attr("stroke-width", 1.5);

        // アイコン
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
    done(); //
  }
});
