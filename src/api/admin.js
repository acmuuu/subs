import { getConfig } from '../data/config.js';
import { verifyJWT } from '../core/auth.js';
import { getCookieValue } from './utils.js';
import { loginPage, adminPage, configPage, dashboardPage, newSubscriptionPage } from '../views/pages.js';

async function handleAdminRequest(request, env) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    console.log('[管理页面] 访问路径:', pathname);

    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    console.log('[管理页面] Token存在:', !!token);

    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;

    console.log('[管理页面] 用户验证结果:', !!user);

    if (!user) {
      console.log('[管理页面] 用户未登录，重定向到登录页面');
      return new Response('', {
        status: 302,
        headers: { Location: '/login' + url.search }
      });
    }

    const normalized =
      pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    if (normalized === '/config') {
      return new Response(configPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (normalized === '/dashboard') {
      return new Response(dashboardPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (normalized === '/new') {
      return new Response(newSubscriptionPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (normalized === '/list') {
      return new Response(adminPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response('', {
      status: 302,
      headers: { Location: '/dashboard' + url.search }
    });
  } catch (error) {
    console.error('[管理页面] 处理请求时出错:', error);
    return new Response('服务器内部错误', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

function handleLoginPage() {
  return new Response(loginPage, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export { handleAdminRequest, handleLoginPage };
