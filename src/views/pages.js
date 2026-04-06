// 页面模板 - 使用 text import 避免嵌套模板字面量问题
import themeAssetsHtml from './theme-assets.html';
import loginPageHtml from './loginPage.html';
import adminPageHtml from './adminPage.html';
import configPageHtml from './configPage.html';
import dashboardPageHtml from './dashboardPage.html';
import newSubscriptionPageHtml from './newSubscriptionPage.html';

// 全局主题（字体、Buffett 浅色、暗色、移动端表格等）来自 public/css|js/theme.*
function injectTheme(html) {
  return html.replace(/\$\{themeResources\}/g, themeAssetsHtml);
}

const loginPage = injectTheme(loginPageHtml);
const adminPage = injectTheme(adminPageHtml);
const configPage = injectTheme(configPageHtml);
const newSubscriptionPage = injectTheme(newSubscriptionPageHtml);

function dashboardPage() {
  return injectTheme(dashboardPageHtml);
}

export { loginPage, adminPage, configPage, dashboardPage, newSubscriptionPage };
