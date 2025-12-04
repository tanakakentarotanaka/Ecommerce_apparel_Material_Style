/**
 * Curved Slope Chart for Fashion BI (Internal Filter Added)
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
    // フィルタ状態の初期化 (all, up, flat, down)
    this.filterState = 'all';
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

    // --- データにトレンド情報を付与 ---
    // ここで計算しておくことで、後続のフィルタリング処理を高速化します
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
    }).filter(d => d.v1 != null && d.v2 != null); // 欠損データを除外


    // --- 描画関数 (フィルタ切り替え時に再利用するため関数化) ---
    const renderChart = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      // 右側にボタンエリアを確保するため margin.right を拡張 (60 -> 120)
      const margin = { top: 40, right: 120, bottom: 20, left: 150 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      this.svg.html("")
        .attr("width", width)
        .attr("height", height)
        .style("font-family", "'Inter', sans-serif");

      const group = this.svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // 1. フィルタリング実行
      const activeData = processedData.filter(d => {
        if (this.filterState === 'all') return true;
        return d.trend === this.filterState;
      });

      // 2. Y軸スケール計算 (表示データの最大値に基づく)
      //    常に全データの最大値で固定したい場合は processedData を使ってください
      let maxVal = 0;
      activeData.forEach(d => {
        if (d.v1 > maxVal) maxVal = d.v1;
        if (d.v2 > maxVal) maxVal = d.v2;
      });
      // データがない場合のフォールバック
      if (maxVal === 0) maxVal = 100;

      const y = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, maxVal * 1.1]);

      // カーブ設定
      let curveFactory = d3.curveBumpX;
      if (config.curve_intensity === "linear") curveFactory = d3.curveLinear;
      if (config.curve_intensity === "natural") curveFactory = d3.curveNatural;

      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveFactory);

      const leftLabels = [];

      // 3. データ描画ループ
      activeData.forEach(item => {
        const { row, v1, v2, c1, c2 } = item;
        const isSelected = LookerCharts.Utils.getCrossfilterSelection(row);
        const isDimmed = details.crossfilterEnabled && isSelected === 2;

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
          .style("opacity", isDimmed ? 0.1 : 0.8)
          .style("cursor", "pointer");

        // クロスフィルタリング (線をクリック)
        path.on("click", (event) => {
          LookerCharts.Utils.toggleCrossfilter({ row: row, event: event });
        });

        // ホバー効果
        path.on("mouseover", function() {
          if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width * 2.5);
        }).on("mouseout", function() {
          if (!isDimmed) d3.select(this).attr("stroke-width", config.stroke_width);
        });

        // 円と数値ラベル
        const circles = [
          { cx: 0, cy: y(v1), formattedText: LookerCharts.Utils.textForCell(c1), align: "end" },
          { cx: chartWidth, cy: y(v2), formattedText: LookerCharts.Utils.textForCell(c2), align: "start" }
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
          leftLabels.push({
            y: y(v1),
            text: LookerCharts.Utils.textForCell(row[dim.name])
          });

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

      // 4. ラベルの間引き処理
      leftLabels.sort((a, b) => a.y - b.y);
      let lastY = -1000;
      const labelSpacing = 14;

      leftLabels.forEach(label => {
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
          lastY = label.y;
        }
      });

      // 5. ヘッダー
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


      // --- 6. フィルタボタンの描画 (右側エリア) ---
      const buttonAreaX = chartWidth + 40;
      const buttonSize = 30;
      const buttonGap = 15;
      const startY = chartHeight / 2 - (buttonSize * 3 + buttonGap * 2) / 2;

      // ボタン定義
      const buttons = [
        { id: 'up',   label: '↗', title: '上昇' },
        { id: 'flat', label: '→', title: '維持' },
        { id: 'down', label: '↘', title: '下降' },
        { id: 'all',  label: '↺', title: '全て' } // リセット用に追加
      ];

      buttons.forEach((btn, i) => {
        const isActive = this.filterState === btn.id;
        const yPos = startY + i * (buttonSize + buttonGap);

        const btnGroup = group.append("g")
          .attr("transform", `translate(${buttonAreaX}, ${yPos})`)
          .style("cursor", "pointer")
          .on("click", () => {
            // ステートを更新して再描画
            this.filterState = (this.filterState === btn.id) ? 'all' : btn.id;
            renderChart(); // 再帰呼び出しのような形だが関数内なのでOK
          });

        // ボタン背景
        btnGroup.append("rect")
          .attr("width", buttonSize)
          .attr("height", buttonSize)
          .attr("rx", 8) // 丸み
          .attr("ry", 8)
          .attr("fill", isActive ? config.line_color : "#f0f0f0")
          .attr("stroke", isActive ? config.line_color : "#ddd")
          .attr("stroke-width", 1);

        // ボタンアイコン文字
        btnGroup.append("text")
          .attr("x", buttonSize / 2)
          .attr("y", buttonSize / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(btn.label)
          .style("fill", isActive ? "#fff" : "#666")
          .style("font-size", "16px")
          .style("font-weight", "bold");

        // ツールチップ的なラベル（右側に小さく）
        btnGroup.append("text")
          .attr("x", buttonSize + 8)
          .attr("y", buttonSize / 2)
          .attr("dy", "0.35em")
          .text(btn.title)
          .style("fill", isActive ? config.line_color : "#999")
          .style("font-size", "10px")
          .style("opacity", 0.8);
      });
    };

    // 初回描画実行
    renderChart();
    done();
  }
});
