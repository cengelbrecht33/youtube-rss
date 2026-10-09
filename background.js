"use strict";

importScripts("page.js");

const TITLE = "Copy YouTube RSS feed";

const badgeTokens = new Map();

function isYouTubeUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  } catch (err) {
    return false;
  }
}

async function flash(tabId, text, color, title) {
  const token = (badgeTokens.get(tabId) || 0) + 1;
  badgeTokens.set(tabId, token);
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    await chrome.action.setBadgeTextColor({ tabId, color: "#ffffff" });
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setTitle({ tabId, title });
  } catch (err) {
    return;
  }
  setTimeout(() => {
    if (badgeTokens.get(tabId) !== token) return;
    chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
    chrome.action.setTitle({ tabId, title: TITLE }).catch(() => {});
  }, 2500);
}

async function onClick(tab) {
  if (tab.id == null) return;
  if (!tab.url || !isYouTubeUrl(tab.url)) {
    await flash(tab.id, "!", "#9a3412", "Open a YouTube channel or playlist");
    return;
  }
  try {
    const [injected] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: copyYouTubeFeed,
    });
    const result = injected && injected.result;
    if (!result || !result.url) {
      await flash(tab.id, "!", "#9a3412", "No YouTube RSS feed on this page");
      return;
    }
    if (!result.ok) {
      await flash(tab.id, "!", "#9a3412", "Could not copy " + result.url);
      return;
    }
    await flash(tab.id, "OK", "#166534", "Copied " + result.url);
  } catch (err) {
    await flash(tab.id, "!", "#9a3412", "Could not copy the YouTube RSS feed");
  }
}

chrome.action.onClicked.addListener((tab) => {
  void onClick(tab);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  badgeTokens.delete(tabId);
});
