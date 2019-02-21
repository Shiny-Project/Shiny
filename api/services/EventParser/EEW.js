module.exports = {
  parse: async (event, sendWeibo) => {
    const parseResult = [];
    console.log(event);
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
      text: '【强震提示 1/2】\n紧急地震速报现正发表，请注意人身安全。\n'
        + '请远离容易倾倒和掉落的物品，移动时请不要使用电梯。\n'
        + '请到坚实的桌子下避难。\n'
        + '若震源位于海底，有发生海啸的可能性，请远离海岸河川。\n'
    });
    parseResult.push({
      text: '【强震提示 2/2】\n紧急电话 警察：110；消防、急救：119；中国驻日本大使馆：03-3403-3065\n'
        + '中国外交部服务应急呼叫中心：+86-10-12308'
    });
    return parseResult;
  }
};
