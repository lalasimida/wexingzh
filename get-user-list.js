const https = require('https');
const http = require('http');

// ============ 在这里修改配置 ============
const CONFIG = {
    appid: "wxddf8924d11d83b6c",
    appsecret: "9624b08986abc10d1cb30a25b6dc64e2"
};
// ========================================

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

// 获取用户列表
function getUserList(accessToken) {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errcode) {
                        reject(new Error(`获取用户列表失败: ${result.errmsg} (${result.errcode})`));
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(new Error('解析用户列表响应失败'));
                }
            });
        }).on('error', reject);
    });
}

// 主函数
async function main() {
    try {
        console.log('正在获取 Access Token...');
        const accessToken = await getAccessToken();
        console.log('Access Token 获取成功!\n');

        console.log('正在获取用户列表...');
        const userList = await getUserList(accessToken);

        console.log('========== 用户列表 ==========');
        console.log(`总关注人数: ${userList.total}`);
        console.log(`本次获取: ${userList.count}`);
        console.log('\n所有 OpenID:');

        const openids = userList.data.openid;
        openids.forEach((openid, index) => {
            console.log(`${index + 1}. ${openid}`);
        });

        console.log('\n================================');
        console.log('提示: 关注了新用户需要 24-48 小时才会显示');
    } catch (error) {
        console.error('错误:', error.message);
    }
}

main();
