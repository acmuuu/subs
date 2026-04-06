import { handleApiRequest } from './api/router.js';
import { handleAdminRequest, handleLoginPage } from './api/admin.js';
import { handleDebug } from './api/debug.js';
import { getCurrentTimeInTimezone } from './core/time.js';
import { checkExpiringSubscriptions } from './services/scheduler.js';
import { getUserFromRequest } from './api/handlers/auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 浏览器常请求 /favicon.ico，统一走 public/favicon.svg
    if (env.ASSETS && request.method === 'GET') {
      const p = url.pathname;
      if (p === '/favicon.ico' || p === '/favicon.svg') {
        const assetPath = p === '/favicon.ico' ? '/favicon.svg' : p;
        const assetReq = new Request(new URL(assetPath, url.origin), request);
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.status !== 404) return assetRes;
      }
    }

    if (url.pathname === '/debug') {
      // 调试页必须登录后才能访问，避免泄露系统信息
      const { user } = await getUserFromRequest(request, env);
      if (!user) {
        return new Response('未授权访问', {
          status: 401,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      return handleDebug(request, env);
    } else if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env);
    } else if (url.pathname.startsWith('/admin')) {
      return handleAdminRequest(request, env, ctx);
    } else {
      return handleLoginPage();
    }
  },

  async scheduled(event, env, ctx) {
    const currentTime = getCurrentTimeInTimezone('UTC');
    console.log('[Workers] 定时任务触发', 'cron:', event?.cron || '(unknown)', 'UTC:', new Date().toISOString(), 'runtime:', currentTime.toISOString());
    await checkExpiringSubscriptions(env);
  }
};
