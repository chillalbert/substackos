/**
 * Smart Quote Highlighter storage operations.
 */
window.QuoteHighlighterModule = (() => {
  async function saveQuote(quote, url, tags = []) {
    const { quoteVault = [] } = await StorageUtil.getLocal(['quoteVault']);
    quoteVault.push({ quote, url, tags, createdAt: new Date().toISOString() });
    await StorageUtil.setLocal({ quoteVault });
    return quoteVault;
  }

  return { saveQuote };
})();
