'use strict';

function notify(message) {
  chrome.notifications.create({
    title: 'Edit with Adobe Photoshop',
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
                  reject('cannot find the downloaded IMAGE file!');
                }
              });
            }
            else {
              reject('download was interrupted');
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
    path: ''
  }, prefs => {
    chrome.runtime.sendNativeMessage('com.add0n.node', {
      permissions: ['child_process', 'os'],
      args: [d.filename, prefs.path],
      script: `
        const os = require('os').platform();
        let cmd = 'start Photoshop "' + args[0] +'"';
        if (os === 'darwin') {
          cmd = 'open -a "Adobe Photoshop CC" "' + args[0] +'"';
        }
        if (os.startsWith('win')) {
          cmd = 'start "" Photoshop "' + args[0] +'"';
        }
        if (args[1]) {
          cmd = args[1] + ' "' + args[0] + '"';
        }
        require('child_process').exec(cmd, (error, stdout, stderr) => {
          push({error, stdout, stderr});
          done();
        });
      `
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
    title: 'Edit with Adobe Photoshop',
    contexts: ['image']
  });
  // FAQs & Feedback
  chrome.storage.local.get('version', prefs => {
    const version = chrome.runtime.getManifest().version;
    const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
    if (isFirefox ? !prefs.version : prefs.version !== version) {
      chrome.storage.local.set({version}, () => {
        chrome.tabs.create({
          url: 'http://add0n.com/edit-with.html?from=photoshop&version=' + version +
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
