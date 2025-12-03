/**
 * Fashion BI Hero Video Menu
 * Background YouTube Video with Navigation Menu Overlay
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- 動画設定 ---
    youtube_video_id: {
      type: "string",
      label: "YouTube Video ID",
      default: "ScMzIvxBSi4", // サンプル: Fashion Film (変更してください)
      display: "text",
      placeholder: "e.g. ScMzIvxBSi4",
      section: "Video"
    },
    // --- デザイン設定 ---
    overlay_color: {
      type: "string",
      label: "Overlay Color",
      default: "#ffffff",
      display: "color",
      section: "Style"
    },
    overlay_opacity: {
      type: "number",
      label: "Overlay Opacity (0-1)",
      default: 0.85, // 動画をうっすら見せる
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Style"
    },
    active_tab: {
      type: "string",
      label: "Active Tab Name",
      default: "Dashboard",
      display: "text",
      section: "Menu"
    }
  },

  create: function(element, config) {
    // スタイルと構造の定義
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');

        .hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* 背景動画エリア */
        .video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none; /* 動画への操作を無効化 */
          overflow: hidden;
        }

        .video-wrapper iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 56.25vw; /* 16:9 Aspect Ratio */
          min-height: 100vh;
          min-width: 177.77vh;
          transform: translate(-50%, -50%);
          opacity: 0.6; /* 動画自体の透明度 */
        }

        /* オーバーレイ（色を重ねて文字を見やすくする） */
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* メニューコンテンツエリア */
        .menu-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center; /* 垂直中央揃え */
          justify-content: space-between;
          padding: 0 20px;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(0,0,0,0.1); /* 薄い境界線 */
        }

        /* ロゴスタイル */
        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: #333;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        /* ナビゲーション */
        .nav-links {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .nav-item {
          font-size: 14px;
          font-weight: 500;
          color: #666;
          padding: 0 4px;
          margin-left: 60px; /* 指定の間隔 */
          height: 100%;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: color 0.2s;
          position: relative;
          text-decoration: none;
        }

        .nav-item:hover {
          color: #333;
        }

        /* アクティブ状態 */
        .nav-item.active {
          font-weight: 700;
          color: #AA7777;
          cursor: default;
        }

        /* アクティブ時の下線（ボーダーではなく疑似要素で位置調整） */
        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #AA7777;
        }

      </style>
      <div id="viz-root" class="hero-container">
        <div class="video-wrapper" id="video-wrapper"></div>

        <div class="overlay" id="color-overlay"></div>

        <div class="menu-content">
          <div class="brand-logo">
            FASHION <span style="color: #AA7777; font-weight: 700;">NOVA</span>
          </div>

          <div class="nav-links" id="nav-links">
            </div>
        </div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const navLinksContainer = element.querySelector("#nav-links");

    this.clearErrors();

    // 1. YouTube動画の埋め込み (iframe更新)
    const videoId = config.youtube_video_id || "ScMzIvxBSi4";
    // パラメータ: autoplay, mute(必須), controls=0(UIなし), loop=1, playlist(ループに必須)
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&disablekb=1&modestbranding=1`;

    // 既存のiframeとIDが違う場合のみ再描画（チラつき防止）
    const currentIframe = videoWrapper.querySelector("iframe");
    if (!currentIframe || currentIframe.src !== embedUrl) {
      videoWrapper.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }

    // 2. オーバーレイのスタイル適用
    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    // 3. メニュー項目の生成
    const activeTab = config.active_tab || "Dashboard";

    // メニュー定義
    const menuItems = [
      { name: "Dashboard", link: "/dashboards/1" }, // IDは環境に合わせて変更可
      { name: "Products", link: "/dashboards/2" },
      { name: "Campaigns", link: "/dashboards/3" },
      { name: "Settings", link: "/dashboards/settings" }
    ];

    navLinksContainer.innerHTML = "";

    menuItems.forEach(item => {
      const isContentActive = (item.name === "Products"); // 今回はProducts固定ならここを変更
      // もしくはオプションの active_tab と比較: (item.name === activeTab)

      if (item.name === "Products") { // ご要望に合わせてProductsをアクティブに
        const div = document.createElement("div");
        div.className = "nav-item active";
        div.innerText = item.name;
        navLinksContainer.appendChild(div);
      } else {
        const a = document.createElement("a");
        a.className = "nav-item";
        a.href = item.link;
        a.innerText = item.name;
        navLinksContainer.appendChild(a);
      }
    });

    done();
  }
});
