# 微信 OpenID 获取工具

一个简单的工具，用于获取用户的微信 OpenID。

## 使用步骤

### 1. 配置

编辑 `config.yaml`：

```yaml
appid: "你的AppID"
appsecret: "你的AppSecret"
port: 3000
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行

```bash
node server.js
```

### 4. 配置网页授权域名

1. 登录微信公众平台
2. 进入 **设置与开发 → 公众号设置 → 功能设置**
3. 在 **网页授权域名** 中添加你的服务器域名（或使用 ngrok 映射的域名）

### 5. 获取 OpenID

1. 确保用户已关注公众号
2. 用手机访问：`http://你的服务器地址/`
3. 点击"获取 OpenID"按钮
4. 授权后页面会显示 OpenID

## 目录结构

```
wechat-openid-tool/
├── server.js      # Node.js 服务器
├── index.html    # 入口页面
├── callback.html # 回调页面
└── config.yaml   # 配置文件
```

## 技术说明

- 使用微信 OAuth2.0 授权获取用户基本信息
- 采用 `snsapi_userinfo` 作用域（需要用户手动授权）
