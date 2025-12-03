/**
 * Fashion BI Hero Video Menu (Theme Font Version)
 * Font: Inter (Consistent with Looker Theme)
 */

looker.plugins.visualizations.add({
  // 設定オプション
  options: {
    // --- 動画設定 ---
    video_url: {
      type: "string",
      label: "Video URL (MP4)",
      default: "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4",
      display: "text",
      placeholder: "https://example.com/video.mp4",
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
      default: 0.85,
      display: "range",
      min: 0,
      max: 1,
      step: 0.05,
      section: "Style"
    },
    active_tab: {
      type: "string",
      label: "Active Tab Name",
      default: "Products",
      display: "text",
      section: "Menu"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        /* テーマに基づき Inter のみを読み込み */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .hero-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', sans-serif; /* 全体に適用 */
          background-color: #f0f0f0;
        }

        .video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .bg-video {
          position: absolute;
          top: 50%;
          left: 50%;
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .menu-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        /* ロゴもInterに変更し、太さで強調 */
        .brand-logo {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 300; /* 細めでモダンに */
          color: #333;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

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
          margin-left: 60px;
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

        .nav-item.active {
          font-weight: 600; /* 太字で強調 */
          color: #AA7777;
          cursor: default;
        }

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
          <div class="nav-links" id="nav-links"></div>
        </div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const videoWrapper = element.querySelector("#video-wrapper");
    const colorOverlay = element.querySelector("#color-overlay");
    const navLinksContainer = element.querySelector("#nav-links");

    this.clearErrors();

    const videoUrl = config.video_url || "https://videos.pexels.com/video-files/3205934/3205934-hd_1920_1080_25fps.mp4";

    const currentVideo = videoWrapper.querySelector("video");
    if (!currentVideo || currentVideo.src !== videoUrl) {
      videoWrapper.innerHTML = `
        <video class="bg-video" autoplay muted loop playsinline>
          <source src="${videoUrl}" type="video/mp4">
        </video>
      `;
    }

    colorOverlay.style.backgroundColor = config.overlay_color;
    colorOverlay.style.opacity = config.overlay_opacity;

    const activeTab = config.active_tab || "Products";
    const menuItems = [
      { name: "Dashboard", link: "/dashboards/1" },
      { name: "Products", link: "/dashboards/2" },
      { name: "Campaigns", link: "/dashboards/3" },
      { name: "Settings", link: "/dashboards/settings" }
    ];

    navLinksContainer.innerHTML = "";
    menuItems.forEach(item => {
      const isActive = (item.name === activeTab);

      if (isActive) {
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
