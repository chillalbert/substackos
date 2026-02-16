/**
 * Background service worker for Substack Growth OS.
 * Handles context menu actions and async module requests.
 */
const ADD_DATA_MENU_ID = 'substack-growth-os-add-data';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ADD_DATA_MENU_ID,
    title: 'Add Data (Substack Growth OS)',
    contexts: ['selection']
  });
});

/**
 * Lightweight in-memory research corpus used to seed suggestions.
 */
const RESEARCH_SNIPPETS = [
  { type: 'stat', text: 'People remember stories up to 22x more than facts alone (Stanford research).' },
  { type: 'quote', text: '“The scarcest resource is attention.” — Herbert A. Simon' },
  { type: 'angle', text: 'Compare “what everyone does” vs “what works now” to create contrast.' },
  { type: 'citation', text: 'Suggested format: (Source, Year) with a direct link.' }
];

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== ADD_DATA_MENU_ID || !tab?.id) return;

  const suggestions = buildResearchSuggestions(info.selectionText || '');
  await chrome.tabs.sendMessage(tab.id, {
    type: 'SHOW_RESEARCH_SUGGESTIONS',
    payload: {
      selectedText: info.selectionText,
      suggestions
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_RESEARCH_SUGGESTIONS') {
    sendResponse({
      suggestions: buildResearchSuggestions(message.payload?.text || '')
    });
    return true;
  }

  if (message?.type === 'PING') {
    sendResponse({ ok: true, from: 'background' });
    return true;
  }

  return false;
});

/**
 * Creates deterministic research prompts from selected text.
 * @param {string} selectedText
 * @returns {Array<{type: string, text: string}>}
 */
function buildResearchSuggestions(selectedText) {
  const normalized = selectedText.trim();
  if (!normalized) return RESEARCH_SNIPPETS;

  return [
    {
      type: 'stat',
      text: `Find a benchmark metric related to “${normalized.slice(0, 60)}” from Pew, Gallup, or Statista.`
    },
    {
      type: 'quote',
      text: `Add an expert quote that validates the claim around “${normalized.slice(0, 50)}”.`
    },
    {
      type: 'angle',
      text: 'Support with one contrarian interpretation and one mainstream interpretation.'
    },
    {
      type: 'citation',
      text: 'Citation format: [Claim] — [Author/Org], [Year], [URL].'
    }
  ];
}
