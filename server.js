const http = require('http');
const url = require('url');

// ============ 配置 ============
const CONFIG = {
    appid: "wxddf8924d11d83b6c",
    appsecret: "9624b08986abc10d1cb30a25b6dc64e2",
    port: 3000,
    host: "localhost"
};
// ==============================

const PORT = CONFIG.port;
const HOST = CONFIG.host;

const indexHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>获取微信 OpenID</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        h1 { color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
        .btn {
            display: inline-block;
            background: #07c160;
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #06b356;
            transform: translateY(-2px);
        }
        .note { margin-top: 20px; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>微信 OpenID 获取工具</h1>
        <p class="subtitle">点击下方按钮获取您的 OpenID</p>
        <a href="/auth" class="btn">获取 OpenID</a>
        <p class="note">请确保已关注公众号后再点击</p>
    </div>
</body>
</html>
`;

const resultHTML = (data, error = null) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenID 获取结果</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 { color: ${error ? '#ff4d4f' : '#07c160'}; margin-bottom: 20px; }
        .openid-box {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 14px;
        }
        .copy-btn {
            background: #1890ff;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
        }
        .back-link { display: block; margin-top: 20px; color: #999; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${error ? '获取失败' : '获取成功!'}</h1>
        ${error ? `<p style="color: #ff4d4f;">${error}</p>` : `
            <p>您的 OpenID 是：</p>
            <div class="openid-box" id="openid">${data.openid}</div>
            <button class="copy-btn" onclick="copyOpenid()">复制 OpenID</button>
            <p style="margin-top: 15px; color: #666; font-size: 14px;">昵称: ${data.nickname || '未知'}</p>
        `}
        <a href="/" class="back-link">返回首页</a>
    </div>
    <script>
        function copyOpenid() {
            navigator.clipboard.writeText(document.getElementById('openid').innerText).then(() => alert('已复制!'));
        }
    </script>
</body>
</html>
`;

function getAuthUrl() {
    const redirectUri = encodeURIComponent(`http://${HOST}:${PORT}/callback`);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${CONFIG.appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect`;
}

async function getOpenidByCode(code) {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${CONFIG.appid}&secret=${CONFIG.appsecret}&code=${code}&grant_type=authorization_code`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errcode) reject(new Error(`${result.errmsg} (${result.errcode})`));
                    else resolve(result);
                } catch (e) { reject(new Error('解析响应失败')); }
            });
        }).on('error', reject);
    });
}

async function getUserInfo(accessToken, openid) {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errcode) reject(new Error(`${result.errmsg} (${result.errcode})`));
                    else resolve(result);
                } catch (e) { reject(new Error('解析用户信息失败')); }
            });
        }).on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexHTML);
        return;
    }

    if (parsedUrl.pathname === '/auth') {
        res.writeHead(302, { Location: getAuthUrl() });
        res.end();
        return;
    }

    if (parsedUrl.pathname === '/callback') {
        const { code, errcode, errmsg } = parsedUrl.query;

        if (errcode) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(resultHTML(null, `授权失败: ${errmsg} (${errcode})`));
            return;
        }

        if (!code) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(resultHTML(null, '未获取到授权码'));
            return;
        }

        try {
            const tokenData = await getOpenidByCode(code);
            const userInfo = await getUserInfo(tokenData.access_token, tokenData.openid);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(resultHTML({ openid: userInfo.openid, nickname: userInfo.nickname }));
        } catch (error) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(resultHTML(null, error.message));
        }
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`
========================================
  微信 OpenID 获取工具已启动
========================================
  访问地址: http://localhost:${PORT}

  1. 确保已在微信公众平台配置网页授权域名
  2. 确保用户已关注公众号
  3. 点击"获取 OpenID"按钮授权

  按 Ctrl+C 停止服务
========================================
    `);
});
