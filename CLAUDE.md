# AI News WeChat Bot

## 简介

这是一个新闻订阅和推送的 AI Agent，使用微信公众号官方模板消息API推送资讯。

## 当用户启动此 Agent 时

1. 切换到 `c:\cc\wechat-serverchan-agent` 目录
2. 读取 `commands/wechat-agent.txt` 了解职责
3. 等待用户指令

## 可执行的操作

- `python main.py --test-news` - 测试新闻抓取
- `python main.py --test-send` - 测试微信推送（需先配置微信公众号）
- `python main.py` - 运行定时任务

## 配置文件

- `config.yaml` - 微信公众号配置
- `main.py` - 主程序

## 首次使用

1. 登录微信公众平台获取 AppID、AppSecret
2. 添加模板消息获取 TemplateID
3. 获取接收消息用户的 OpenID
4. 编辑 `config.yaml` 填入以上信息
5. 运行 `python main.py --test-send` 测试推送
