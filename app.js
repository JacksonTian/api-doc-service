var connect = require('connect');
var wechat = require('wechat');
var config = require('./config');
var alpha = require('alpha');

var app = connect();
app.use(connect.query());
app.use(connect.static(__dirname + '/assets', { maxAge: 86400000 }));
app.use('/wechat', wechat(config.token, function (req, res, next) {
  var input = req.weixin.Content.trim();
  // 用户添加时候的消息
  if (input === 'Hello2BizUser') {
    return res.reply({msgType: 'text', content: '谢谢添加Node.js公共帐号:)\n回复Node.js API相关关键词，将会得到相关描述。如：module, setTimeout等'});
  }
  if (input === '大王') {
    return res.reply({msgType: 'text', content: "不要叫我大王，要叫我女王大人啊……"});
  }
  if (input.length < 2) {
    return res.reply({msgType: 'text', content: '内容太少，请多输入一点:)'});
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
        return item.path + '\n' + item.textRaw + ':\n' + replaced;
      }).join('\n');
      if (data.more && data.more.length) {
        content += '\n更多相关API：\n' + data.more.join(', ').substring(0, 200) + '...';
      }
      break;
    default:
      content = '没有找到“' + input + '”相关API。输入模块名，方法名，事件名等都能获取到相关内容。';
      break;
  }
  res.reply({msgType: 'text', content: content.substring(0, 2000)});
}));

app.use('/', function (req, res) {
  res.writeHead(200);
  res.end('hello node api');
});

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
