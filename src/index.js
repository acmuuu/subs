import { handleApiRequest } from './api/router.js';
import { handleAdminRequest, handleLoginPage } from './api/admin.js';
import { handleLogout, getUserFromRequest } from './api/handlers/auth.js';
import { handleDebug } from './api/debug.js';
import { getCurrentTimeInTimezone } from './core/time.js';
import { checkExpiringSubscriptions } from './services/scheduler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // public/ 静态资源：favicon、页面拆出的 /css/*、/js/*、主题等
    if (env.ASSETS && request.method === 'GET') {
      const p = url.pathname;
      if (p === '/favicon.ico') {
        const assetReq = new Request(new URL('/favicon.svg', url.origin), request);
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.status !== 404) return assetRes;
      } else if (p === '/favicon.svg' || p.startsWith('/css/') || p.startsWith('/js/')) {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status !== 404) return assetRes;
      }
    }

    const pathname = url.pathname;

    if (pathname === '/debug') {
      // 调试页必须登录后才能访问，避免泄露系统信息
      const { user } = await getUserFromRequest(request, env);
      if (!user) {
        return new Response('未授权访问', {
          status: 401,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      return handleDebug(request, env);
    }

    if (pathname === '/' || pathname === '') {
      return new Response('', {
        status: 302,
        headers: { Location: '/dashboard' + url.search }
      });
    }

    if (pathname === '/login' || pathname === '/login/') {
      const { user } = await getUserFromRequest(request, env);
      if (user) {
        return new Response('', {
          status: 302,
          headers: { Location: '/dashboard' + url.search }
        });
      }
      return handleLoginPage();
    }

    if (pathname === '/logout' || pathname === '/logout/') {
      if (request.method === 'GET' || request.method === 'POST') {
        return handleLogout();
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    const appPaths = new Set(['/dashboard', '/list', '/new', '/config']);
    const normalized =
      pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    if (appPaths.has(normalized)) {
      return handleAdminRequest(request, env, ctx);
    }

    if (pathname.startsWith('/api')) {
      return handleApiRequest(request, env);
    }

    return handleLoginPage();
  },

  async scheduled(event, env, ctx) {
    const currentTime = getCurrentTimeInTimezone('UTC');
    console.log('[Workers] 定时任务触发', 'cron:', event?.cron || '(unknown)', 'UTC:', new Date().toISOString(), 'runtime:', currentTime.toISOString());
    await checkExpiringSubscriptions(env);
  }
};
