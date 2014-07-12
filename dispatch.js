var pm = require('pm');
var config = require('./config');

var master = pm.createMaster({
  'pidfile' : '/tmp/api.pid'
});

var port = config.port || 3000;

master.register('api', __dirname + '/app.js', {
  'listen': [port],
  'children': 1
});

master.on('giveup', function (name, num, pause) {
  // YOU SHOULD ALERT HERE!
});

master.dispatch();
