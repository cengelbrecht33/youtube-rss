# YouTube RSS

Chromium extension. On a YouTube channel, playlist, or video, click the toolbar button to copy the RSS feed URL YouTube publishes in the page source.

A channel page such as `https://www.youtube.com/@DavesAutoCenterCenterville` copies `https://www.youtube.com/feeds/videos.xml?channel_id=UCRMiFgN0EEIPrhJP58kRMyw`. A playlist page copies the playlist feed. A video copies that video's channel feed.

The button shows a green OK when the URL is on the clipboard.

## Install

```bash
git clone https://github.com/cengelbrecht33/youtube-rss.git
```

Open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select the cloned folder. Pin **YouTube RSS** from the puzzle-piece menu.
