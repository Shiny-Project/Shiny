# API
## 添加数据
地址: `https://shiny.kotori.moe/Data/add`

方法：POST

参数：

| 参数名 | 参数类型 | 说明 | 
|----| -----| ------|
| api_key | string | API KEY|
| sign | string | 签名
| event| string | 事件内容|


签名格式：

将字符串做如下拼接：`api_key + api_secret_key + event`，然后做一次`SHA1`摘要。

其中事件内容按照以下格式发送。

```JSON
{
    "level": 1,
    "spiderName": "爬虫名", 
    "channel": "频道名 可选",
    "hash": "事件唯一标记", 
    "data": {
        "title": "标题",
        "content": "内容",
        "link": "链接",
        "cover": "用于桌面通知的图片"  
    }
}
```

多个事件则
```JSON
[{
    "level": 1,
    "spiderName": "爬虫名", 
    "channel": "频道名 可选",
    "hash": "事件唯一标记", 
    "data": {
        "title": "标题",
        "content": "内容",
        "link": "链接",
        "cover": "用于桌面通知的图片"  
    }
}]
```


字段说明

| 字段名 | 说明 |
|--------|---------|
| level | 事件等级 必须 大于3发送桌面通知 |
| spiderName | 爬虫名 必须 |
| channel | 频道名 可选 用于区分同一爬虫下多个不同来源 |
| hash | 事件唯一标记 必须|
| data | 事件内容 | 
| data.title | 标题 |
| data.content | 内容 |
| data.link | 链接 |
| data.cover | 桌面通知图片 |


正常返回示例

```JSON
{
    "status": "success",
    "data": [{
        "level": 1, 
        "spiderName": "爬虫名", 
        "channel": "频道名 可选",
        "hash": "事件唯一标记", 
        "data": {
            "title": "标题",
            "content": "内容",
            "link": "链接",
            "cover": "用于桌面通知的图片"  
        }
    }]
}
```

失败返回示例
```JSON
{
  "status": "fail",
  "error": {
    "code": "need_post",
    "info": "本方法需要POST提交"
  }
}
```


## 数据查询

### 获取最近事件

地址： `/Data/recent`

方法：GET

参数：无

成功返回实例：

```JSON
{
    "status" : "success",
    "data" : [
        {
            "id": 157,
            "data": {
                "content": "ニッポン放送「ミューコミ+プラス」にゲスト生出演決定！！<br />あの変態音響監督のコーナーに八木沼＆南條が挑む！？<br />お聞き逃しなく！<br /><br />放送日：2016年10月6日(木) 24:00-24:53<br />番組HP：<a href=\"http://www.allnightnippon.com/mcplus/\" target=\"_blank\">http://www.allnightnippon.com/mcplus/</a>",
                "link": "10/6（木）ニッポン放送「ミュ～コミプラス」ゲスト生出演情報！",
                "title": "10/6（木）ニッポン放送「ミュ～コミプラス」ゲスト生出演情報！"
            },
            "level": 3,
            "publisher": "fripSide",
            "hash": "eb1ab93dc11ce47af47b688615f201cf",
            "createdAt": null,
            "updatedAt": null
        }
    ]
}
```


## 特殊推送 API

将 `publisher` 字段设定为特定内容可以触发微博特殊推送。

特殊推送的图片渲染分为由中控渲染和由Shiny-Map渲染。对应关系按照下表。其中由Shiny-Map渲染的请参照Shiny-Map库的API说明，其他见下。

|  `publisher`  |  渲染机构 | 说明 |
| ---------------| --------| -----|
|  `eew#warning`   |  中控 |  紧急地震速报（警报） |
| `shindo_early_report` | Shiny-Map | 震度速报 |
| `shindo_report` | Shiny-Map | 各地区震度信息 |
| `tsunami_warning` | Shiny-Map | 海啸警报 |
| `ew`  | 中控 | （气象）特别警报 |
| `CMAAlert` | 中控 | CMA全国气象预警 |
| `Flood` | 中控 | 洪水警报 |
| `USGSEarthquake` | 中控 | USGS全球显著地震速报 |
| `tsunami_estimation` | 中控 | 海啸到达时间和高度预测 | 

### 紧急地震速报

字符串匹配解析。将转化为含有震中、最大预估震度、预估震级的字符串。

同时，延时发布强震提示。

无需额外参数（外部爬虫格式配合）。

### （气象）特别警报

在`data`中添加以下字段

| 字段名 | 类型 | 说明 |
| ------| ------| ---|
| isRelease | boolean | 是否为发布 |
| alertType | string | 警报类型 |
| areas | string[] | 警报区域 |


### CMA全国气象预警

无需额外参数

### USGS全球显著地震速报

无需额外参数

### 洪水警报

在`data`中添加以下字段

| 字段名 | 类型 | 说明 |
| ------| ------| ---|
| floodAlertTitle | string | 警报标题 |


### 海啸到达时间和高度预测

在`data`中添加以下字段

| 字段名 | 类型 | 说明 |
| ------| ------| ---|
| estimation | EstimationItem[] | 预测信息 |

对预测信息详细定义如下：

```TypeScript
interface EstimationItem {
    height: string;
    time: string;
    name: string;
}
```
其中键名为观测点名称。

示例：
```JSON
[{
    "height": "10米以上",
    "time": "立即到达",
    "name": "东京湾内湾"
}, {
    "height": "3米",
    "time": "立即到达",
    "name": "福岛县"
}]
```

注意，请按高度降序排列。

