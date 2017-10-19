/* globals config */
'use strict';

var _ = id => chrome.i18n.getMessage(id);

function notify(message) {
  chrome.notifications.create({
    title: _('appTitle'),
    type: 'basic',
    iconUrl: 'data/icons/48.png',
    message
  });
}

function download(url) {
  if (/google\.[^./]+\/url?/.test(url)) {
    const tmp = /url=([^&]+)/.exec(url);
    if (tmp && tmp.length) {
      url = decodeURIComponent(tmp[1]);
    }
  }
  return new Promise((resolve, reject) => {
    chrome.downloads.download({url}, id => {
      function observe(d) {
        if (d.id === id && d.state) {
          if (d.state.current === 'complete' || d.state.current === 'interrupted') {
            chrome.downloads.onChanged.removeListener(observe);
            if (d.state.current === 'complete') {
              chrome.downloads.search({id}, ([d]) => {
                if (d) {
                  resolve(d);
                }
                else {
                  reject(_('bgError1'));
                }
              });
            }
            else {
              reject(_('bgError2'));
            }
          }
        }
      }
      chrome.downloads.onChanged.addListener(observe);
    });
  });
}

function open(d) {
  chrome.storage.local.get({
    path: '',
    quotes: true
  }, prefs => {
    chrome.runtime.sendNativeMessage('com.add0n.node', {
      permissions: ['child_process', 'os'],
      args: [d.filename, prefs.path ? (prefs.quotes ? `"${prefs.path}"` : prefs.path) : ''],
      script: config.script
    }, resp => {
      if (resp) {
        const msg = resp.stderr || resp.error || resp.stdout;
        if (msg) {
          console.error(resp);
          notify(msg);
        }
      }
      else {
        chrome.tabs.create({
          url: '/data/helper/index.html'
        });
      }
    });
  });
}

chrome.contextMenus.onClicked.addListener(info => {
  download(info.srcUrl || info.linkUrl).then(open, notify);
});
chrome.pageAction.onClicked.addListener(tab => {
  download(tab.url).then(open, notify);
});
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'activate') {
    chrome.pageAction.show(sender.tab.id);
  }
});

// one time
(callback => {
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
})(() => {
  // add the context-menu
  chrome.contextMenus.create({
    id: 'open-in',
    title: _('appTitle'),
    contexts: ['image']
  });
  // FAQs & Feedback
  chrome.storage.local.get('version', prefs => {
    const version = chrome.runtime.getManifest().version;
    const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
    if (isFirefox ? !prefs.version : prefs.version !== version) {
      chrome.storage.local.set({version}, () => {
        chrome.tabs.create({
          url: 'http://add0n.com/edit-with.html?from=' + config.name + '&version=' + version +
            '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
        });
      });
    }
  });
  {
    const {name, version} = chrome.runtime.getManifest();
    chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
  }
});
