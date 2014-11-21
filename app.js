var fs = require('fs');
var http = require('http');
var connect = require('connect');
var config = require('./config');
var mp = require('./controllers/wechat_mp');
var corp = require('wechat-enterprise');

var app = connect();
connect.logger.format('home', ':remote-addr :response-time - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :res[content-length]');
app.use(connect.logger({
  format: 'home',
  stream: fs.createWriteStream(__dirname + '/logs/access.log')
}));
app.use(connect.query());
app.use('/assets', connect.static(__dirname + '/assets', { maxAge: 86400000 }));
app.use(connect.cookieParser());
app.use(connect.session({secret: config.secret}));

app.use('/wechat/callback', mp.callback);
app.use('/wechat', mp.reply);
app.use('/detail', mp.detail);
app.use('/login', mp.login);
app.use('/corp', corp(config.corp, function (req, res, next) {
  res.writeHead(200);
  res.end('hello node api');
}));

app.use('/', function (req, res) {
  res.writeHead(200);
  res.end('hello node api');
});

/**
 * Error handler
 */
app.use(function (err, req, res) {
  console.log(err.message);
  console.log(err.stack);
  res.statusCode = err.status || 500;
  res.end(err.message);
});

var server = http.createServer(app);
var worker = require('pm').createWorker();
worker.ready(function (socket) {
  server.emit('connection', socket);
});
