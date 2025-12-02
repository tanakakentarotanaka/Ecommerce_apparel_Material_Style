looker.plugins.visualizations.add({
    // Looker管理画面で表示される基本設定
    id: "simple_line_chart",
    label: "Simple Line Chart (Custom)",
    
    // グラフのオプション設定（ここでは設定なし）
    options: {},

    // --- 1. 初期設定（create） ---
// looker.plugins.visualizations.add({...
    
    // ... options: {} などはそのまま ...

    create: function(element, config) {
        // グラフエリア全体を囲むコンテナにスタイルを適用
        element.innerHTML = `
            <style>
                .line-chart-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center;
                    height: 100%;
                    width: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                    font-family: sans-serif;
                }
                .chart-area {
                    width: 90%;
                    height: 90%;
                    position: relative; 
                    border-left: 2px solid #333; 
                    border-bottom: 2px solid #333; 
                }
                /* 目盛り線のスタイル */
                .y-axis-line {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 1px;
                    background-color: #ddd; /* 薄いグレーの線 */
                }
                /* 目盛りの値のスタイル */
                .y-axis-label {
                    position: absolute;
                    right: 100%; /* グラフエリアの外側（左側）に配置 */
                    font-size: 10px;
                    padding-right: 5px;
                    transform: translateY(50%); /* 中央寄せ */
                }
                .data-point {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background-color: #3388FF; 
                    border-radius: 50%; 
                    transform: translate(-50%, 50%); 
                    z-index: 10;
                }
            </style>
        `;

        // グラフ全体を囲むコンテナ要素の作成
        this._container = element.appendChild(document.createElement("div"));
        this._container.className = "line-chart-container";

        // グラフの座標系となる描画エリアの作成（ここに点や線が入る）
        this._chartArea = this._container.appendChild(document.createElement("div"));
        this._chartArea.className = "chart-area";
    },

// --- 2. データ描画と更新（updateAsync） ---
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();

        // --- データのチェック ---
        if (queryResponse.fields.dimensions.length == 0) {
            this.addError({title: "No Dimensions", message: "線グラフにはディメンション（X軸）が必要です。"});
            return;
        }
        if (queryResponse.fields.measures.length == 0) {
            this.addError({title: "No Measures", message: "線グラフにはメジャー（Y軸）が必要です。"});
            return;
        }
        
        // --- フィールド名と値の準備 ---
        var dimensionName = queryResponse.fields.dimensions[0].name;
        var measureName = queryResponse.fields.measures[0].name;
        
        // 描画エリアをクリア
        this._chartArea.innerHTML = ''; 

        // --- Y軸の最大値を見つける (データ値の最大値) ---
        var data_max_y = 0;
        data.forEach(function(row) {
            // LookerCharts.Utils.textForCell で整形済みのテキスト値を取得し、数値に変換
            var value = parseFloat(LookerCharts.Utils.textForCell(row[measureName])); 
            if (!isNaN(value) && value > data_max_y) {
                data_max_y = value;
            }
        });
        
        if (data_max_y === 0) {
            this.addError({title: "No Data", message: "データが見つからないか、全てのメジャー値が0です。"});
            return;
        }

        // --- 📊 Y軸の最大値の計算（データ最大値 + 10%） ---
        var max_y_scale = data_max_y * 1.1; // 実際の最大値の1.1倍（10%上乗せ）
        
        // --- 📌 Y軸の目盛り線と値の描画（5分割） ---
        const num_ticks = 5; // 目盛り線の数（0%と100%を除く）
        const tick_interval_value = max_y_scale / num_ticks; // 目盛りの値の増加量
        
        for (let i = 0; i <= num_ticks; i++) {
            const y_pos_percent = (i / num_ticks) * 100; // 下から0%, 20%, 40%, 60%, 80%, 100%
            const tick_value = i * tick_interval_value;
            
            // 1. 目盛り線の描画 (0%と100%の線は枠線が代用するため、内側の線のみ描画)
            if (i > 0 && i < num_ticks) {
                var line = document.createElement("div");
                line.className = "y-axis-line";
                line.style.bottom = y_pos_percent + '%'; // 線の位置
                this._chartArea.appendChild(line);
            }
            
            // 2. 目盛りの値の描画 (全ての目盛りの値)
            var label = document.createElement("div");
            label.className = "y-axis-label";
            
            // toFixed(2)で小数点以下2桁表示にしていますが、必要に応じて調整してください
            label.innerHTML = tick_value.toFixed(2); 
            label.style.bottom = y_pos_percent + '%'; 
            
            this._chartArea.appendChild(label);
        }

        // --- データの描画（点の配置） ---
        var num_points = data.length;
        
data.forEach((row, index) => {
  // X軸の位置を計算
    var x_percent = (num_points === 1) ? 50 : (index / (num_points - 1)) * 100;
    
    // =======================================================
    // 💡 1. X軸のラベル（目盛り）を先に描画する 💡
    // =======================================================
    // Nullであっても、ディメンション（日付など）の目盛りは表示する
    var label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.left = x_percent + '%';
    label.style.bottom = '-20px'; 
    label.style.transform = 'translateX(-50%)';
    label.style.fontSize = '10px';
    // X軸ラベルとしてディメンションの値を挿入
    label.innerHTML = LookerCharts.Utils.textForCell(row[dimensionName]); 
    this._chartArea.appendChild(label);
    
    
    // Y軸の値を取得
    var raw_y_value = parseFloat(LookerCharts.Utils.textForCell(row[measureName]));

    
    // =======================================================
    // 💡 2. Y軸の値が有効な数値であるかをチェック 💡
    // =======================================================
    if (isNaN(raw_y_value) || raw_y_value === null) {
        // Y軸の値が Null や無効な場合は、このデータ点（プロット）の描画をスキップする
        // X軸ラベルは既に描画されているため、ここでは何も処理しない（=点なし）
        return; 
    }
    // =ベーションのロジックが誤動作することで発生することがあります。

Nullのときに点を非表示にするには、`updateAsync`関数内で、データを取り出して描画する直前に**「値が有効な数値であるか」**をチェックする条件を追加する必要があります。

---

## 🛠️ Null値（データがない場合）を無視する修正方法

前回作成した`updateAsync`関数に、データ点（`raw_y_value`）が有効な数値であるかを確認するロジックを挿入します。

### 📌 修正箇所: `updateAsync`関数のデータの描画部分

前回のコードの `data.forEach((row, index) => { ... }` のループ内を以下のように修正します。

```javascript
// ... updateAsync関数の前半（最大値計算まで）はそのまま ...

// --- データの描画 ---
var num_points = data.length;

data.forEach((row, index) => {
    // X軸の位置を計算 (データのインデックスに基づいて均等に配置)
    var x_percent = (num_points === 1) ? 50 : (index / (num_points - 1)) * 100;

    // Y軸の値を取得
    var raw_y_value = parseFloat(LookerCharts.Utils.textForCell(row[measureName]));

    // =======================================================
    // 💡 【ここが修正ポイント】Null/無効な値の場合はスキップ 💡
    // =======================================================
    // isNaN(Not a Number) は、raw_y_value が数値に変換できなかった場合（例：Null, "-") に true を返す
    if (isNaN(raw_y_value)) {
        // Null や無効な値の場合は、この点の描画をスキップし、次のデータへ
        return; 
    }
    // =======================================================

    // Y軸の位置を計算 ( max_y_scale に対する割合でスケール)
    var y_percent = (raw_y_value / max_y_scale) * 100; 

    // --- 1. データ点（円）の描画 ---
    var point = document.createElement("div");
    point.className = "data-point";
    point.style.left = x_percent + '%';
    point.style.bottom = y_percent + '%'; 
    
    // ツールチップの設定 (ディメンションとメジャーの値)
    point.title = 
        queryResponse.fields.dimensions[0].label + ": " + LookerCharts.Utils.textForCell(row[dimensionName]) + "\n" +
        queryResponse.fields.measures[0].label + ": " + raw_y_value.toFixed(2);
    
    this._chartArea.appendChild(point);

    // --- 2. X軸のラベル（ディメンション名）の描画（値がある場合のみ表示） ---
    var label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.left = x_percent + '%';
    label.style.bottom = '-20px'; 
    label.style.transform = 'translateX(-50%)';
    label.style.fontSize = '10px';
    label.innerHTML = LookerCharts.Utils.textForCell(row[dimensionName]);
    this._chartArea.appendChild(label);
});

        done();
    }
 }); 