'use strict';

var config = {};
config.script = `
  const os = require('os').platform();
  let cmd = 'start Photoshop "' + args[0] + '"';
  if (os === 'darwin') {
    cmd = 'open -a "Adobe Photoshop CC" "' + args[0] + '"';
  }
  if (os.startsWith('win')) {
    cmd = 'start "" Photoshop "' + args[0] + '"';
  }
  if (args[1]) {
    cmd = args[1] + ' "' + args[0] + '"';
  }
  require('child_process').exec(cmd, (error, stdout, stderr) => {
    push({error, stdout, stderr});
    done();
  });
`;

config.name = 'photoshop';
