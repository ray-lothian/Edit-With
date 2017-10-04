'use strict';

function save() {
  chrome.storage.local.set({
    path: document.getElementById('path').value
  }, () => {
    const status = document.getElementById('status');
    status.textContent = chrome.i18n.getMessage('optionsSaveMSG');
    setTimeout(() => status.textContent = '', 750);
  });
}

function restore() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    path: ''
  }, prefs => {
    document.getElementById('path').value = prefs.path;
  });
}
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  e.textContent = chrome.i18n.getMessage(e.dataset.i18n);
});
