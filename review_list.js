/**
 * Fashion BI Review List Visualization
 * 顧客属性と返品ステータスを強調したレビュー一覧
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    font_size: {
      type: "number",
      label: "Font Size (px)",
      default: 14,
      display: "number",
      section: "Style"
    },
    primary_color: {
      type: "string",
      label: "Primary Color",
      default: "#AA7777",
      display: "color",
      section: "Style"
    },
    text_color: {
      type: "string",
      label: "Text Color",
      default: "#333333",
      display: "color",
      section: "Style"
    }
  },

  create: function(element, config) {
    // スタイル定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .review-container {
          font-family: 'Inter', sans-serif;
          height: 100%;
          overflow-y: auto;
          padding: 10px;
          box-sizing: border-box;
          background-color: #FAF9F8; /* ダッシュボード背景に合わせる */
        }

        .review-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #eee;
          transition: box-shadow 0.2s;
        }

        .review-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* ヘッダーエリア（評価・日付・属性タグ） */
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .star-rating {
          color: #FFC107;
          letter-spacing: 2px;
          font-size: 16px;
        }

        .review-date {
          font-size: 12px;
          color: #999;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        /* 属性タグ (世代・性別) */
        .attribute-tag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          background-color: #F5F5F5;
          color: #555;
          font-weight: 500;
        }

        /* 返品ステータスタグ */
        .return-tag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
        }

        .return-tag.returned {
          background-color: #FFEBEE; /* 赤背景 */
          color: #C62828;
        }

        .return-tag.kept {
          background-color: #E8F5E9; /* 緑背景 */
          color: #2E7D32;
        }

        /* レビュータイトル */
        .review-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        /* レビュー本文 */
        .review-body {
          font-size: 14px;
          line-height: 1.6;
          color: #444;
          position: relative;
        }

        /* 本文中のキーワードハイライト */
        .highlight {
          font-weight: 700;
          color: #AA7777; /* テーマカラー */
          background-color: rgba(170, 119, 119, 0.1);
          padding: 0 2px;
        }

        .read-more-btn {
          color: #AA7777;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          display: inline-block;
          border: none;
          background: none;
          padding: 0;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      </style>
      <div id="viz-root" class="review-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#viz-root");
    this.clearErrors();

    // データチェック
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="no-data">レビューデータがありません。</div>`;
      done();
      return;
    }

    // 必須フィールドの確認
    // 期待するフィールド順序:
    // 1. タイトル (Title)
    // 2. 本文 (Body)
    // 3. 投稿日 (Date)
    // 4. 属性: 世代 (Generation) - 例: "30s", "40代"
    // 5. 属性: 性別 (Gender) - 例: "Female", "女性"
    // 6. 属性: 返品ステータス (Return Status) - 例: "Returned", "Kept"
    // メジャー1: 評価スコア (Rating)

    const dims = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dims.length < 3) {
      this.addError({ title: "Data Error", message: "少なくともタイトル、本文、日付の3つのディメンションが必要です。" });
      return;
    }

    // フィールドマッピング（順序依存）
    const titleField = dims[0].name;
    const bodyField = dims[1].name;
    const dateField = dims[2].name;

    // オプショナル属性
    const genField = dims.length > 3 ? dims[3].name : null;
    const genderField = dims.length > 4 ? dims[4].name : null;
    const returnField = dims.length > 5 ? dims[5].name : null;

    const ratingField = measures.length > 0 ? measures[0].name : null;

    container.innerHTML = "";

    // 星生成ヘルパー
    const generateStars = (value) => {
      const score = Math.round(parseFloat(value) || 0);
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        stars += (i <= score) ? "★" : "☆";
      }
      return stars;
    };

    // テキストハイライト処理
    const highlightKeywords = (text) => {
      if (!text) return "";
      const keywords = ["サイズ", "色", "素材", "丈", "フィット", "size", "color", "fit", "material"];
      let highlighted = text;
      keywords.forEach(kw => {
        // 大文字小文字区別なく置換
        const regex = new RegExp(`(${kw})`, "gi");
        highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
      });
      return highlighted;
    };

    data.forEach(row => {
      // データの取得
      const title = LookerCharts.Utils.textForCell(row[titleField]);
      const bodyRaw = LookerCharts.Utils.textForCell(row[bodyField]);
      const date = LookerCharts.Utils.textForCell(row[dateField]);

      const gen = genField ? LookerCharts.Utils.textForCell(row[genField]) : "";
      const gender = genderField ? LookerCharts.Utils.textForCell(row[genderField]) : "";
      const returnStatus = returnField ? LookerCharts.Utils.textForCell(row[returnField]) : "";

      const rating = ratingField ? row[ratingField].value : 0;

      // 返品ステータスの判定（文字列一致で色分け）
      let returnClass = "kept";
      if (returnStatus.toLowerCase().includes("return") || returnStatus.includes("返品")) {
        returnClass = "returned";
      }

      // レビューカード作成
      const card = document.createElement("div");
      card.className = "review-card";

      // 長文省略ロジック (CSSのline-clampも使えるが、JS制御の方が"Read More"を出しやすい)
      const isLong = bodyRaw.length > 120;
      const shortBody = isLong ? bodyRaw.substring(0, 120) + "..." : bodyRaw;
      const displayBody = highlightKeywords(shortBody);

      card.innerHTML = `
        <div class="review-header">
          <div class="header-left">
            <div class="star-rating">${generateStars(rating)}</div>
            <div class="review-date">${date}</div>
          </div>
          <div class="header-right">
            ${gen ? `<span class="attribute-tag">${gen}</span>` : ""}
            ${gender ? `<span class="attribute-tag">${gender}</span>` : ""}
            ${returnStatus ? `<span class="return-tag ${returnClass}">${returnStatus}</span>` : ""}
          </div>
        </div>

        <div class="review-title">${title}</div>

        <div class="review-body">
          <span class="body-text">${displayBody}</span>
          ${isLong ? `<button class="read-more-btn">Read more</button>` : ""}
        </div>
      `;

      // Read More ボタンのイベント
      if (isLong) {
        const btn = card.querySelector(".read-more-btn");
        const bodySpan = card.querySelector(".body-text");

        btn.onclick = (e) => {
          e.stopPropagation(); // 親要素のクリックイベント伝播防止
          if (btn.innerText === "Read more") {
            bodySpan.innerHTML = highlightKeywords(bodyRaw); // 全文表示
            btn.innerText = "Show less";
          } else {
            bodySpan.innerHTML = displayBody; // 省略表示
            btn.innerText = "Read more";
          }
        };
      }

      container.appendChild(card);
    });

    done();
  }
});
