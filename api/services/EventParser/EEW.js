module.exports = {
  parse: async (event, sendWeibo) => {
    const parseResult = [];
    if (event.data.content.match(/强烈摇晃的地区:\n(.+)\n/) === null) {
      return [{
        text: event.data.content
      }]
    }
    parseResult.push({
      text: '紧急地震速报（气象厅）\n'
        + event.data.content.match(/强烈摇晃的地区:\n(.+)\n/)[1].trim() + '\n'
        + '请注意强烈摇晃' + '\n'
        + `${event.data.content.match(/ 震度.+ (.+?) M/) ? ('震中：' + event.data.content.match(/ 震度.+ (.+?) M/)[1]) : ''}`
        + `${event.data.content.match(/M(.+?) /) ? (' 预估震级：M' + event.data.content.match(/M(.+?) /)[1]) : ''}`
        + `${event.data.content.match(/震度(.+?) /) ? (' 预估最大震度：' + event.data.content.match(/震度(.+?) /)[1]) : ''}`
    });
    parseResult.push({
      special: 'eew_notice'
    });
    return parseResult;
  }
};
