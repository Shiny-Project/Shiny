## 事件详细数据
<a id=事件详细数据> </a>
### 基本信息

**Path：** /Data/detail

**Method：** GET

**接口描述：**


### 请求参数
**Query**

| 参数名称  |  是否必须 | 示例  | 备注  |
| ------------ | ------------ | ------------ | ------------ |
| eventId | 是  |  38162 |  事件ID |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@id</span></p></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> jobs</span></td><td key=1><span>object []</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件关联任务</span></td><td key=5><p key=0><span style="font-weight: '700'">最小数量: </span><span>0</span></p><p key=2><span style="font-weight: '700'">最大数量: </span><span>10</span></p><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-1-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">推送任务ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@id</span></p></td></tr><tr key=0-1-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> channel</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">推送渠道</span></td><td key=5><p key=2><span style="font-weight: '700'">枚举: </span><span>twitter,weibo</span></p></td></tr><tr key=0-1-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> status</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">状态</span></td><td key=5><p key=2><span style="font-weight: '700'">枚举: </span><span>pending,success,failed</span></p></td></tr><tr key=0-1-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> text</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">推送正文</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@paragraph</span></p></td></tr><tr key=0-1-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> event_id</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@id</span></p></td></tr><tr key=0-1-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> image</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">图片信息</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>[]</span></p></td></tr><tr key=0-1-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> info</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">响应内容</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>{}</span></p></td></tr><tr key=0-1-7><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> logs</span></td><td key=1><span>object []</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">推送任务日志</span></td><td key=5><p key=0><span style="font-weight: '700'">最小数量: </span><span>0</span></p><p key=2><span style="font-weight: '700'">最大数量: </span><span>3</span></p><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-1-7-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> channel</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=2><span style="font-weight: '700'">枚举: </span><span>weibo,twitter</span></p></td></tr><tr key=0-1-7-1><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> status</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=2><span style="font-weight: '700'">枚举: </span><span>job_created,finished</span></p></td></tr><tr key=0-1-7-2><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> job_id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@id</span></p></td></tr><tr key=0-1-7-3><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> info</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">响应内容</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>{}</span></p></td></tr><tr key=0-1-7-4><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> createdAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr><tr key=0-1-7-5><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> updatedAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr><tr key=0-1-8><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> createdAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr><tr key=0-1-9><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updatedAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr>
               </tbody>
              </table>
            
## 获取最近事件
<a id=获取最近事件> </a>
### 基本信息

**Path：** /Data/recent

**Method：** GET

**接口描述：**


### 请求参数
**Query**

| 参数名称  |  是否必须 | 示例  | 备注  |
| ------------ | ------------ | ------------ | ------------ |
| page | 否  |  1 |  页数 |

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0-0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> total</span></td><td key=1><span>integer</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">总事件数量</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer(30000,40000)</span></p></td></tr><tr key=0-1><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> events</span></td><td key=1><span>object []</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件</span></td><td key=5><p key=0><span style="font-weight: '700'">最小数量: </span><span>20</span></p><p key=2><span style="font-weight: '700'">最大数量: </span><span>20</span></p><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-1-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> id</span></td><td key=1><span>number</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件ID</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@id</span></p></td></tr><tr key=0-1-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> data</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件详细数据</span></td><td key=5></td></tr><tr key=0-1-1-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> title</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">标题</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@title</span></p></td></tr><tr key=0-1-1-1><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> cover</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">封面</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@url</span></p></td></tr><tr key=0-1-1-2><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> link</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">链接</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@url</span></p></td></tr><tr key=0-1-1-3><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> content</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">内容</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@paragraph</span></p></td></tr><tr key=0-1-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> publisher</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">发布者</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@word</span></p></td></tr><tr key=0-1-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> level</span></td><td key=1><span>integer</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">事件等级</span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@integer(1,5)</span></p></td></tr><tr key=0-1-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> createdAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr><tr key=0-1-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> updatedAt</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@datetime</span></p></td></tr><tr key=0-1-6><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> hash</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=5><span style="font-weight: '700'">mock: </span><span>@string(32)</span></p></td></tr>
               </tbody>
              </table>
            
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
    type: "warning" | "notice" | "alert"
}
```
其中键名为观测点名称。

示例：
```JSON
[{
    "height": "10米以上",
    "time": "立即到达",
    "name": "东京湾内湾",
    "type": "alert"
}, {
    "height": "3米",
    "time": "立即到达",
    "name": "福岛县",
    "type": "warning"
}]
```

注意，中控不会对此列表排序。

