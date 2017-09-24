'use strict';

if (document.contentType && document.contentType.startsWith('image/')) {
  chrome.runtime.sendMessage({
    method: 'activate'
  });
}
