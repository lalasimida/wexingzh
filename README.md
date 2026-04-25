# AI News WeChat Bot

每日AI资讯自动推送工具，通过微信公众号模板消息推送给用户。

## 功能特性

- 使用微信公众号官方模板消息API
- 定时抓取多个AI/科技媒体资讯
- 每日自动推送到微信
- 支持自定义推送时间和新闻源

## 准备工作

### 1. 申请微信公众号

需要有已认证的**服务号**或**订阅号**（模板消息功能需服务号）

### 2. 获取AppID和AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **设置与开发** → **基本配置**
3. 获取 **AppID** 和 **AppSecret**

### 3. 获取模板消息ID

1. 进入 **功能** → **模板消息**
2. 点击 **添加模板**
3. 选择或申请模板，例如：
   - 标题：新闻通知
   - 关键词：日期、时间、数量、详情

### 4. 获取用户OpenID

用户需要关注公众号，然后通过接口获取用户的 OpenID

## 配置

编辑 `config.yaml`：

```yaml
wechat:
  appid: "你的AppID"
  appsecret: "你的AppSecret"
  template_id: "你的模板ID"
  touser: "用户的OpenID"
```

## 安装依赖

```bash
pip install feedparser requests pyyaml apscheduler
```

## 运行

```bash
# 测试新闻抓取
python main.py --test-news

# 测试推送（需先配置）
python main.py --test-send

# 启动定时任务
python main.py
```

## 微信公众号模板示例

模板内容格式：
```
{{first.DATA}}
日期：{{keyword1.DATA}}
数量：{{keyword2.DATA}}
{{remark.DATA}}
```

## 常见问题

### Q: 模板消息发送失败？

1. 确认 AppID、AppSecret 正确
2. 确认模板 ID 正确
3. 确认 OpenID 正确（必须是公众号的关注用户）
4. 服务号每月有模板消息配额限制

### Q: 如何获取用户OpenID？

用户关注公众号后，调用微信接口获取用户信息即可得到 OpenID

## License

MIT
