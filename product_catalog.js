updateAsync: function(data, element, config, queryResponse, details, done) {
  const gridContainer = element.querySelector("#grid-container");
  const container = element.querySelector(".catalog-container");

  // エラーや警告を一旦クリア
  this.clearErrors(); [cite: 71]

  // 1. フィールド定義の取得
  const dimensions = queryResponse.fields.dimensions;
  const measures = queryResponse.fields.measures;

  // 2. ガイド表示ロジック: ディメンションが0個（未設定）の場合にガイドを出す
  if (dimensions.length === 0) {
    this.addError({ [cite: 60]
      title: "✨ カタログを表示する準備",
      message: `この可視化を使用するには、以下の順序でフィールドを選択してください：

      【ディメンション】
      1. 商品名 (必須)
      2. 商品画像URL
      3. ステータス (In Stock / Out of Stock 等)

      【メジャー】
      1. 商品価格`
    });
    return;
  }

  // 3. データ存在チェック: フィールドはあるが、検索結果が0件の場合
  if (!data || data.length === 0) {
    this.addError({
      title: "データが見つかりません",
      message: "検索条件に一致する商品は現在ありません。"
    });
    return;
  }

  // --- ここから下は前回のコードと同じ描画ロジック ---

  // テーマ設定の適用
  container.style.backgroundColor = "#FAF9F8";

  // ... (以下、前回提供したコードの `// DOMリセット` 以降を続けてください)
