// app/api/weather/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.QWEATHER_KEY;
  const locationId = "101010100"; // 北京

  if (!token) {
    console.error("❌ 环境变量 QWEATHER_KEY (Token) 未找到");
    return NextResponse.json({ code: "500", message: "Token missing" }, { status: 500 });
  }

  // 🌟 核心：按照你提供的文档，尝试两个可能的 Host
  // 如果你有特定的 API Host（例如 xxx.qweather.com），请把第一个换成它
  const apiHosts = [
    'https://api.qweather.com/v7/weather/now',
    'https://devapi.qweather.com/v7/weather/now'
  ];

  for (const host of apiHosts) {
    try {
      const url = `${host}?location=${locationId}`;
      console.log(`📡 尝试使用 Bearer 认证请求: ${host}`);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          // 🌟 按照文档要求的 Header 认证格式
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip',
          'User-Agent': 'Vercel-Weather-Proxy/1.0'
        },
        cache: 'no-store'
      });

      const data = await res.json();

      // 如果返回 200，说明这套 Bearer 认证终于对上暗号了！
      if (data.code === "200" || res.status === 200) {
        console.log(`✅ 认证通过! 来源: ${host}`);
        return NextResponse.json(data);
      }

      console.warn(`⚠️ ${host} 认证未通过:`, data);

    } catch (err: any) {
      console.error(`🔥 请求 ${host} 出错:`, err.message);
      continue;
    }
  }

  return NextResponse.json({
    code: "500",
    message: "认证协议对接失败，请检查是否在 Vercel 填写了正确的 Token"
  }, { status: 500 });
}