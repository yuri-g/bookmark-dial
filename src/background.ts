browser.tabs.onUpdated.addListener(async (tabId, _, tabState) => {
  if (tabState.status !== 'complete') {
    return;
  }

  setTimeout(async () => {
    const tab = await browser.tabs.get(tabId);
    console.info(`got the tab!: ${tab.title}`, tab);
    if (typeof tab.favIconUrl !== 'undefined' && typeof tab.url !== 'undefined') {
      const host = new URL(tab.url).hostname;

      browser.storage.local.set({
        [`favicon:${host}`]: tab.favIconUrl
      });
    }
  }, 1000);
}, { "properties": ["status", "favIconUrl"] });

browser.tabs.onActivated.addListener(async (activateInfo) => {
  const tab = await browser.tabs.get(activateInfo.tabId);

  if (typeof tab.favIconUrl !== 'undefined' && typeof tab.url !== 'undefined') {
    const host = new URL(tab.url).hostname;

    browser.storage.local.set({
      [`favicon:${host}`]: tab.favIconUrl
    });
  }
  console.info(`got the favicon in active!: ${tab.title}`, tab.favIconUrl);
});
