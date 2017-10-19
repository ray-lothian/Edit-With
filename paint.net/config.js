'use strict';

var config = {};
config.script = `
  const os = require('os').platform();
  let cmd = 'start Paint.Net "' + args[0] + '"';
  if (os === 'darwin') {
    cmd = 'open -a "Paint.Net" "' + args[0] + '"';
  }
  if (os.startsWith('win')) {
    cmd = 'start "" "%ProgramFiles%\\\\paint.net\\\\PaintDotNet.exe" "' + args[0] + '"';
  }
  if (args[1]) {
    cmd = args[1] + ' "' + args[0] + '"';
  }
  require('child_process').exec(cmd, (error, stdout, stderr) => {
    push({error, stdout, stderr});
    done();
  });
`;

config.name = 'paint.net';
