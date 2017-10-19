'use strict';

function save() {
  chrome.storage.local.set({
    path: document.getElementById('path').value,
    quotes: document.getElementById('quotes').checked
  }, () => {
    const status = document.getElementById('status');
    status.textContent = chrome.i18n.getMessage('optionsSaveMSG');
    setTimeout(() => status.textContent = '', 750);
  });
}

function restore() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    path: '',
    quotes: true
  }, prefs => {
    document.getElementById('path').value = prefs.path;
    document.getElementById('quotes').checked = prefs.quotes;
  });
}
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  e[e.dataset.i18nvalue || 'textContent'] = chrome.i18n.getMessage(e.dataset.i18n);
});
