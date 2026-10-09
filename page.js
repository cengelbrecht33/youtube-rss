// Runs in the YouTube page. YouTube prints the feed in the document source as
// <link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=...">
// and again as channelMetadataRenderer.rssUrl. A soft navigation can leave the
// link pointing at the previous channel, so a different live rssUrl wins.
function copyYouTubeFeed() {
  function readYouTubeFeed() {
    const FEED = "https://www.youtube.com/feeds/videos.xml";

    function isYouTubeHost(hostname) {
      const host = String(hostname || "").replace(/^www\./, "");
      return host === "youtube.com" || host.endsWith(".youtube.com");
    }

    function channelIdOk(id) {
      return typeof id === "string" && id.length === 24 && id.indexOf("UC") === 0 && /^UC[\w-]+$/.test(id);
    }

    function playlistIdOk(id) {
      return typeof id === "string" && id.length >= 2 && id.length <= 80 && /^[\w-]+$/.test(id);
    }

    function channelFeed(id) {
      return channelIdOk(id) ? FEED + "?channel_id=" + id : "";
    }

    function playlistFeed(id) {
      return playlistIdOk(id) ? FEED + "?playlist_id=" + id : "";
    }

    function unescapeRss(value) {
      return String(value).replace(/\\\//g, "/").replace(/\\u0026/g, "&");
    }

    function fromHref(href) {
      if (!href) return "";
      let url;
      try {
        url = new URL(href, location.href);
      } catch (err) {
        return "";
      }
      if (!isYouTubeHost(url.hostname) || url.pathname !== "/feeds/videos.xml") return "";
      const channel = channelFeed(url.searchParams.get("channel_id"));
      if (channel) return channel;
      return playlistFeed(url.searchParams.get("playlist_id"));
    }

    function sliceAfter(html, marker, length) {
      const at = html.indexOf(marker);
      if (at < 0) return "";
      return html.slice(at, at + length);
    }

    const link = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    const fromLink = fromHref(link && (link.getAttribute("href") || link.href));

    let data = null;
    try {
      data = window.ytInitialData || null;
    } catch (err) {
      data = null;
    }
    const renderer = data && data.metadata && data.metadata.channelMetadataRenderer;
    const fromData = fromHref(renderer && renderer.rssUrl);
    if (fromData && fromLink && fromData !== fromLink) return fromData;
    if (fromLink) return fromLink;
    if (fromData) return fromData;

    const html = document.documentElement ? document.documentElement.innerHTML : "";
    const meta = sliceAfter(html, '"channelMetadataRenderer"', 8000).match(
      /"rssUrl":"(https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?[^"\\]+)"/
    );
    if (meta) {
      const found = fromHref(unescapeRss(meta[1]));
      if (found) return found;
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const href = canonical.getAttribute("href") || canonical.href || "";
      const id = String(href).match(/\/channel\/(UC[\w-]+)/);
      if (id) return channelFeed(id[1]);
    }

    const ident = document.querySelector('meta[itemprop="identifier"]');
    if (ident) {
      const feed = channelFeed(ident.content || ident.getAttribute("content"));
      if (feed) return feed;
    }

    const pathChannel = location.pathname.match(/^\/channel\/(UC[\w-]+)/);
    if (pathChannel) return channelFeed(pathChannel[1]);

    if (location.pathname === "/playlist" || location.pathname.indexOf("/playlist/") === 0) {
      let list = "";
      try {
        list = new URL(location.href).searchParams.get("list") || "";
      } catch (err) {
        list = "";
      }
      const feed = playlistFeed(list);
      if (feed) return feed;
    }

    const onWatch =
      location.pathname === "/watch" ||
      location.pathname.indexOf("/shorts/") === 0 ||
      location.pathname.indexOf("/live/") === 0;
    if (onWatch) {
      let player = null;
      try {
        player = window.ytInitialPlayerResponse || null;
      } catch (err) {
        player = null;
      }
      const watchId = player && player.videoDetails && player.videoDetails.channelId;
      const fromPlayer = channelFeed(watchId);
      if (fromPlayer) return fromPlayer;
      const embedded = sliceAfter(html, '"videoDetails"', 4000).match(
        /"channelId":"(UC[\w-]+)"/
      );
      if (embedded) return channelFeed(embedded[1]);
    }

    if (location.pathname.indexOf("/@") === 0 || location.pathname.indexOf("/c/") === 0 || location.pathname.indexOf("/user/") === 0) {
      const external = html.match(/"externalId":"(UC[\w-]+)"/);
      if (external) return channelFeed(external[1]);
    }

    return "";
  }

  const url = readYouTubeFeed();
  if (!url) return { ok: false, reason: "no-feed" };

  const area = document.createElement("textarea");
  area.value = url;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.documentElement.appendChild(area);
  area.focus();
  area.select();
  try {
    area.setSelectionRange(0, url.length);
  } catch (err) {
    // Some documents reject setSelectionRange on a detached field.
  }
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (err) {
    copied = false;
  }
  area.remove();
  if (copied) return { ok: true, url: url };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(url).then(
      function () {
        return { ok: true, url: url };
      },
      function () {
        return { ok: false, url: url };
      }
    );
  }
  return { ok: false, url: url };
}
