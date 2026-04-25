const https = require('https');

// ============ 配置 ============
const CONFIG = {
    appid: "wxddf8924d11d83b6c",
    appsecret: "9624b08986abc10d1cb30a25b6dc64e2"
};
// ==============================

// 获取 Access Token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${CONFIG.appid}&secret=${CONFIG.appsecret}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        resolve(result.access_token);
                    } else {
                        reject(new Error(`获取 token 失败: ${result.errmsg}`));
                    }
                } catch (e) {
                    reject(new Error('解析 token 响应失败'));
                }
            });
        }).on('error', reject);
    });
}

// 获取用户列表（OpenID列表）
async function getUserList(accessToken) {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errcode && result.errcode !== 40003) {
                        // 48001 = 服务号权限问题，40003 = 可能是订阅号但尝试了
                        reject(new Error(`错误码 ${result.errcode}: ${result.errmsg}`));
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(new Error('解析失败'));
                }
            });
        }).on('error', reject);
    });
}

// 发送客服消息（触发事件获取 OpenID）
function sendKefuMessage(accessToken, openid, content) {
    const postData = JSON.stringify({
        touser: openid,
        msgtype: "text",
        text: { content: content }
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.weixin.qq.com',
            path: `/cgi-bin/message/custom/send?access_token=${accessToken}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errcode === 0) {
                        resolve('发送成功');
                    } else {
                        reject(new Error(`发送失败: ${result.errmsg} (${result.errcode})`));
                    }
                } catch (e) {
                    reject(new Error('解析响应失败'));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    try {
        console.log('正在获取 Access Token...\n');
        const accessToken = await getAccessToken();
        console.log('Access Token 获取成功!\n');

        console.log('正在获取用户 OpenID 列表...\n');
        const userList = await getUserList(accessToken);

        console.log('========================================');
        console.log(`总关注人数: ${userList.total}`);
        console.log(`本次获取: ${userList.count} 个`);
        console.log('========================================\n');

        if (userList.data && userList.data.openid && userList.data.openid.length > 0) {
            console.log('所有 OpenID:\n');
            userList.data.openid.forEach((openid, index) => {
                console.log(`${index + 1}. ${openid}`);
            });

            // 尝试发送消息测试
            console.log('\n----------------------------------------');
            console.log('尝试发送测试消息到第一个用户...\n');
            try {
                await sendKefuMessage(accessToken, userList.data.openid[0], '这是一条测试消息');
                console.log('消息发送成功!');
            } catch (e) {
                console.log('消息发送失败:', e.message);
                console.log('(订阅号可能不支持客服消息接口)');
            }
        } else {
            console.log('没有获取到用户数据');
        }

    } catch (error) {
        console.error('\n错误:', error.message);
        console.log('\n提示: 订阅号可能不支持此接口。如果需要获取所有用户 OpenID，');
        console.log('建议升级为服务号或联系微信客服确认权限。');
    }
}

main();
