var fs = require('fs');
var path = require('path');
var connect = require('connect');
var wechat = require('wechat');
var config = require('./config');
var alpha = require('alpha');
var ejs = require('ejs');

var app = connect();
app.use(connect.query());
app.use(connect.static(__dirname + '/assets', { maxAge: 86400000 }));
app.use('/wechat', wechat(config.token, wechat.text(function (message, req, res, next) {
  console.log(message);
  var input = (message.Content || '').trim();
  // 用户添加时候的消息
  if (input === 'Hello2BizUser') {
    return res.reply('谢谢添加Node.js公共帐号:)\n回复Node.js API相关关键词，将会得到相关描述。如：module, setTimeout等');
  }

  if (input === '大王') {
    return res.reply("不要叫我大王，要叫我女王大人啊……");
  }
  if (input.length < 2) {
    return res.reply('内容太少，请多输入一点:)');
  }
  var data = alpha.search(input);
  var content = '';
  switch (data.status) {
    case 'TOO_MATCHED':
      content = '找到API过多，请精确一点：\n' + data.result.join(', ').substring(0, 100) + '...';
      break;
    case 'MATCHED':
      content = data.result.map(function (item) {
        var replaced = (item.desc || '')
          .replace(/<p>/ig, '').replace(/<\/p>/ig, '')
          .replace(/<code>/ig, '').replace(/<\/code>/ig, '')
          .replace(/<pre>/ig, '').replace(/<\/pre>/ig, '')
          .replace(/<strong>/ig, '').replace(/<\/strong>/ig, '')
          .replace(/<ul>/ig, '').replace(/<\/ul>/ig, '')
          .replace(/<li>/ig, '').replace(/<\/li>/ig, '')
          .replace(/<em>/ig, '').replace(/<\/em>/ig, '')
          .replace(/&#39;/ig, "'");

        return {
          title: item.path,
          description: item.textRaw + ':\n' + replaced,
          picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
          url: 'http://nodeapi.cloudfoundry.com/detail?id=' + item.hash
        };
      });
      if (data.more && data.more.length) {
        content.push({
          title: '更多：' + data.more.join(', ').substring(0, 200) + '...',
          description: data.more.join(', ').substring(0, 200) + '...',
          picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg'
        });
      }
      break;
    default:
      content = '没有找到“' + input + '”相关API。输入模块名，方法名，事件名等都能获取到相关内容。';
      break;
  }
  var from = message.FromUserName;
  if (!Array.isArray(content)) {
    if (from === 'oPKu7jgOibOA-De4u8J2RuNKpZRw') {
      content = '主人你好：\n' + content;
    }
    if (from === 'oPKu7jpSY1tD1xoyXtECiM3VXzdU') {
      content = '女王大人:\n' + content;
    }
  }
  res.reply(content);
}).image(function (message, req, res, next) {
  console.log(message);
  res.reply('还没想好图片怎么处理啦。');
}).location(function (message, req, res, next) {
  console.log(message);
  res.reply('想和我约会吗，不要的啦。');
}).voice(function (message, req, res, next) {
  console.log(message);
  res.reply('心情不好，不想搭理你。');
})));

var tpl = ejs.compile(fs.readFileSync(path.join(__dirname, 'views/detail.html'), 'utf-8'));
app.use('/detail', function (req, res) {
  var id = req.query.id || '';
  var info = alpha.access(alpha.getKey(id));
  if (info) {
    res.writeHead(200);
    res.end(tpl(info));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

app.use('/', function (req, res) {
  res.writeHead(200);
  res.end('hello node api');
});

var port = process.env.VCAP_APP_PORT || config.port || 3000;
app.listen(port);
