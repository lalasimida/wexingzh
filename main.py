#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI News WeChat Bot - 微信公众号模板消息推送
定时从多个AI/科技媒体获取资讯，通过微信公众号模板消息推送给用户
"""

import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import feedparser
import requests
import yaml
import time
import os
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger


class WeChatBot:
    def __init__(self, config_path="config.yaml"):
        if not os.path.isabs(config_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(script_dir, config_path)

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        self.appid = self.config['wechat']['appid']
        self.appsecret = self.config['wechat']['appsecret']
        self.template_id = self.config['wechat']['template_id']
        self.touser = self.config['wechat']['touser']
        self.sources = self.config['news']['sources']
        self.max_items = self.config['news'].get('max_items', 5)

        self.access_token = None
        self.token_expires_at = 0

    def get_access_token(self):
        """获取Access Token"""
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token

        url = "https://api.weixin.qq.com/cgi-bin/token"
        params = {
            "grant_type": "client_credential",
            "appid": self.appid,
            "secret": self.appsecret
        }

        try:
            print("[*] 获取 Access Token...")
            response = requests.get(url, params=params, timeout=10)
            result = response.json()

            if "access_token" in result:
                self.access_token = result["access_token"]
                self.token_expires_at = time.time() + result.get("expires_in", 7200) - 300
                print(f"    [OK] Token 获取成功")
                return self.access_token
            else:
                print(f"    [FAIL] 获取失败: {result.get('errmsg', result)}")
                return None

        except Exception as e:
            print(f"    [FAIL] 请求异常: {e}")
            return None

    def send_template_message(self, data):
        """发送模板消息"""
        token = self.get_access_token()
        if not token:
            return False

        url = f"https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={token}"

        try:
            print("[*] 发送模板消息...")
            response = requests.post(url, json=data, timeout=10)
            result = response.json()

            if result.get("errcode") == 0:
                print("    [OK] 发送成功")
                return True
            else:
                print(f"    [FAIL] 发送失败: {result.get('errmsg')}")
                return False

        except Exception as e:
            print(f"    [FAIL] 请求异常: {e}")
            return False

    def fetch_news(self):
        """抓取新闻"""
        all_news = []
        success_count = 0

        for source in self.sources:
            try:
                print(f"[*] 正在获取: {source['name']}...")
                feed = feedparser.parse(source['url'])

                for entry in feed.entries[:3]:
                    all_news.append({
                        'title': entry.get('title', '无标题'),
                        'url': entry.get('link', ''),
                        'source': source['name'],
                        'published': entry.get('published', '')
                    })

                success_count += 1
                print(f"    [OK] 获取 {len(feed.entries)} 条")

            except Exception as e:
                print(f"    [FAIL] 获取失败: {e}")

        all_news.sort(key=lambda x: x['published'], reverse=True)
        return all_news[:self.max_items]

    def format_news_message(self, news_items):
        """格式化微信公众号模板消息"""
        today = datetime.now().strftime('%Y年%m月%d日')

        # 构建详情链接文本
        details = []
        for i, news in enumerate(news_items, 1):
            title = news['title'].replace('\n', ' ').strip()[:40]
            details.append(f"{i}. {title}")

        detail_text = "\n".join(details)

        # 微信公众号模板消息格式
        data = {
            "touser": self.touser,
            "template_id": self.template_id,
            "url": news_items[0]['url'] if news_items else "",
            "data": {
                "first": {
                    "value": f"📰 今日AI资讯已更新（共{len(news_items)}条）",
                    "color": "#17375E"
                },
                "keyword1": {
                    "value": today,
                    "color": "#17375E"
                },
                "keyword2": {
                    "value": f"{len(news_items)}条",
                    "color": "#FF6600"
                },
                "remark": {
                    "value": detail_text,
                    "color": "#666666"
                }
            }
        }

        return data

    def run(self):
        """运行一次抓取和推送"""
        print("\n" + "="*50)
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始抓取新闻...")
        print("="*50)

        news = self.fetch_news()

        if not news:
            print("\n[WARN] 未获取到任何新闻，跳过推送")
            return

        print(f"\n[*] 共获取 {len(news)} 条新闻，开始推送...")

        message = self.format_news_message(news)
        self.send_template_message(message)

        print("[OK] 任务完成")

    def test_fetch_news(self):
        """测试新闻获取"""
        print("\n" + "="*50)
        print("[*] 测试新闻获取...")
        print("="*50 + "\n")

        news = self.fetch_news()

        print("\n" + "="*50)
        print(f"共获取 {len(news)} 条新闻")
        print("="*50)

        for i, item in enumerate(news, 1):
            print(f"\n【{i}】{item['title']}")
            print(f"   来源: {item['source']}")
            print(f"   链接: {item['url']}")

        return news

    def get_followers(self):
        """获取关注用户列表"""
        token = self.get_access_token()
        if not token:
            return []

        url = f"https://api.weixin.qq.com/cgi-bin/user/get?access_token={token}&next_openid="

        try:
            print("[*] 获取关注用户列表...")
            response = requests.get(url, timeout=10)
            result = response.json()

            if "data" in result:
                openids = result["data"].get("openid", [])
                total = result.get("total", 0)
                print(f"    [OK] 共 {total} 位关注用户")
                return openids
            else:
                print(f"    [FAIL] 获取失败: {result.get('errmsg', result)}")
                return []

        except Exception as e:
            print(f"    [FAIL] 请求异常: {e}")
            return []

    def get_user_info(self, openid):
        """获取用户基本信息"""
        token = self.get_access_token()
        if not token:
            return None

        url = f"https://api.weixin.qq.com/cgi-bin/user/info?access_token={token}&openid={openid}&lang=zh_CN"

        try:
            response = requests.get(url, timeout=10)
            return response.json()
        except Exception as e:
            print(f"    [FAIL] 获取用户信息失败: {e}")
            return None

    def test_send(self):
        """测试发送"""
        print("\n" + "="*50)
        print("[*] 测试发送...")
        print("="*50)

        if not self.appid or self.appid == "YOUR_APPID":
            print("\n[FAIL] 请先在 config.yaml 中配置微信公众号参数")
            print("   需要配置: appid, appsecret, template_id, touser")
            return

        news = self.fetch_news()
        message = self.format_news_message(news)

        print("\n" + "-"*50)
        print("开始发送测试消息...")
        print("-"*50)

        self.send_template_message(message)

        print("\n[OK] 测试发送完成！")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='AI News WeChat Bot')
    parser.add_argument('--test-news', action='store_true',
                        help='测试新闻获取')
    parser.add_argument('--test-send', action='store_true',
                        help='测试发送（需先配置微信公众号）')
    parser.add_argument('--get-openid', action='store_true',
                        help='获取已关注用户的 OpenID 列表')
    parser.add_argument('--config', default='config.yaml',
                        help='配置文件路径 (默认: config.yaml)')

    args = parser.parse_args()

    bot = WeChatBot(args.config)

    if args.get_openid:
        if not bot.appid or bot.appid == "YOUR_APPID":
            print("\n[FAIL] 请先在 config.yaml 中配置 AppID 和 AppSecret")
            return

        print("\n" + "="*50)
        print("[*] 获取关注用户 OpenID...")
        print("="*50)

        openids = bot.get_followers()

        if openids:
            print("\n" + "-"*50)
            print("关注用户 OpenID 列表：")
            print("-"*50)

            for i, oid in enumerate(openids, 1):
                info = bot.get_user_info(oid)
                if info and info.get("nickname"):
                    print(f"\n[{i}] {info.get('nickname')} ({info.get('sex', 0)}):")
                    print(f"    OpenID: {oid}")
                else:
                    print(f"\n[{i}] OpenID: {oid}")

            print("\n" + "="*50)
            print(f"共 {len(openids)} 位用户")
            print("="*50)
            print("\n将第一个 OpenID 填入 config.yaml 的 wechat.touser 即可")
        return

    if args.test_news:
        bot.test_fetch_news()
    elif args.test_send:
        bot.test_send()
    else:
        scheduler = BlockingScheduler(timezone='Asia/Shanghai')

        hour = bot.config.get('scheduler', {}).get('hour', 9)
        minute = bot.config.get('scheduler', {}).get('minute', 0)

        print("\n" + "="*50)
        print("[AI News Bot] 已启动")
        print("="*50)
        print(f"定时推送时间: {hour:02d}:{minute:02d}")
        print(f"新闻源数量: {len(bot.sources)}")
        print(f"配置文件: {args.config}")
        print("="*50)
        print("按 Ctrl+C 停止\n")

        scheduler.add_job(
            bot.run,
            CronTrigger(hour=hour, minute=minute, timezone='Asia/Shanghai')
        )

        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            print("\n[!] Bot 已停止")


if __name__ == '__main__':
    main()
