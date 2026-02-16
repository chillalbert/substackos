/**
 * Promise-based wrapper around chrome.storage APIs to simplify usage across modules.
 */
window.StorageUtil = {
  /**
   * Reads one or many keys from sync storage.
   * @param {string|string[]|Object|null} keys
   * @returns {Promise<Object>}
   */
  async get(keys = null) {
    return chrome.storage.sync.get(keys);
  },

  /**
   * Saves object payload into sync storage.
   * @param {Object} payload
   * @returns {Promise<void>}
   */
  async set(payload) {
    await chrome.storage.sync.set(payload);
  },

  /**
   * Reads one or many keys from local storage.
   * @param {string|string[]|Object|null} keys
   * @returns {Promise<Object>}
   */
  async getLocal(keys = null) {
    return chrome.storage.local.get(keys);
  },

  /**
   * Saves object payload into local storage.
   * @param {Object} payload
   * @returns {Promise<void>}
   */
  async setLocal(payload) {
    await chrome.storage.local.set(payload);
  }
};
