
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    // 记录用户是否点击了“清空”某个密钥字段；保存时会提交给后端处理
    const CLEAR_SECRET_FIELDS = new Set();

    function setSecretStatus(key, text) {
      const el = document.getElementById(key + 'Status');
      if (!el) return;
      el.textContent = text;
    }

    function updateAllSecretStatus() {
      const cfg = window.SECRET_CONFIGURED || {};
      setSecretStatus('TG_BOT_TOKEN', cfg.TG_BOT_TOKEN ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('NOTIFYX_API_KEY', cfg.NOTIFYX_API_KEY ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('WEBHOOK_URL', cfg.WEBHOOK_URL ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('WEBHOOK_HEADERS', cfg.WEBHOOK_HEADERS ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('WECHATBOT_WEBHOOK', cfg.WECHATBOT_WEBHOOK ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('RESEND_API_KEY', cfg.RESEND_API_KEY ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('BARK_DEVICE_KEY', cfg.BARK_DEVICE_KEY ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('THIRD_PARTY_API_TOKEN', cfg.THIRD_PARTY_API_TOKEN ? '已配置（已隐藏）' : '未配置');
      setSecretStatus('GOTIFY_APP_TOKEN', cfg.GOTIFY_APP_TOKEN ? '已配置（已隐藏）' : '未配置');
    }

    function wireSecretInput(inputId, key) {
      const input = document.getElementById(inputId);
      if (!input) return;
      input.addEventListener('input', () => {
        const value = input.value.trim();
        if (value.length > 0) {
          // 用户输入了新值，视为将被更新
          CLEAR_SECRET_FIELDS.delete(key);
          setSecretStatus(key, '将更新（保存后生效）');
        } else {
          // 空表示“不修改”（默认）
          const cfg = window.SECRET_CONFIGURED || {};
          setSecretStatus(key, cfg[key] ? '已配置（已隐藏）' : '未配置');
        }
      });
    }

    function wireClearSecretButton(buttonId, inputId, key) {
      const btn = document.getElementById(buttonId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;
      btn.addEventListener('click', () => {
        input.value = '';
        CLEAR_SECRET_FIELDS.add(key);
        setSecretStatus(key, '将清空（保存后生效）');
        showToast('已标记清空：' + key + '（点击“保存配置”后生效）', 'warning', 4500);
      });
    }

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();

        // === 安全策略 ===
        // 1) 所有 token/密钥类字段，后端不会下发真实值；这里只显示“已配置(隐藏)”状态。
        // 2) 不填写 token/密钥字段并保存时，后端会保持原值不变。
        // 3) 如需清空，请点对应的“清空”按钮（会在保存时生效）。

        document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
        document.getElementById('themeModeSelect').value = config.THEME_MODE || 'system';  // 回显主题设置

        // 非敏感字段正常回显
        document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
        document.getElementById('webhookMethod').value = config.WEBHOOK_METHOD || 'POST';
        document.getElementById('webhookTemplate').value = config.WEBHOOK_TEMPLATE || '';
        document.getElementById('wechatbotMsgType').value = config.WECHATBOT_MSG_TYPE || 'text';
        document.getElementById('wechatbotAtMobiles').value = config.WECHATBOT_AT_MOBILES || '';
        document.getElementById('wechatbotAtAll').checked = config.WECHATBOT_AT_ALL === 'true';
        document.getElementById('emailFrom').value = config.EMAIL_FROM || '';
        document.getElementById('emailFromName').value = config.EMAIL_FROM_NAME || '订阅提醒系统';
        document.getElementById('emailTo').value = config.EMAIL_TO || '';
        document.getElementById('barkServer').value = config.BARK_SERVER || 'https://api.day.app';
        document.getElementById('barkIsArchive').checked = config.BARK_IS_ARCHIVE === 'true';
        document.getElementById('gotifyServerUrl').value = config.GOTIFY_SERVER_URL || '';

        // 敏感字段：清空输入框（不回显真实值）
        document.getElementById('tgBotToken').value = '';
        document.getElementById('notifyxApiKey').value = '';
        document.getElementById('webhookUrl').value = '';
        document.getElementById('webhookHeaders').value = '';
        document.getElementById('wechatbotWebhook').value = '';
        document.getElementById('resendApiKey').value = '';
        document.getElementById('barkDeviceKey').value = '';
        document.getElementById('thirdPartyToken').value = '';
        document.getElementById('gotifyAppToken').value = '';

        window.SECRET_CONFIGURED = {
          TG_BOT_TOKEN: config.TG_BOT_TOKEN_CONFIGURED === true,
          NOTIFYX_API_KEY: config.NOTIFYX_API_KEY_CONFIGURED === true,
          WEBHOOK_URL: config.WEBHOOK_URL_CONFIGURED === true,
          WEBHOOK_HEADERS: config.WEBHOOK_HEADERS_CONFIGURED === true,
          WECHATBOT_WEBHOOK: config.WECHATBOT_WEBHOOK_CONFIGURED === true,
          RESEND_API_KEY: config.RESEND_API_KEY_CONFIGURED === true,
          BARK_DEVICE_KEY: config.BARK_DEVICE_KEY_CONFIGURED === true,
          THIRD_PARTY_API_TOKEN: config.THIRD_PARTY_API_TOKEN_CONFIGURED === true,
          GOTIFY_APP_TOKEN: config.GOTIFY_APP_TOKEN_CONFIGURED === true
        };

        updateAllSecretStatus();
        document.getElementById('debugLogs').checked = config.DEBUG_LOGS === true;
        document.getElementById('paymentHistoryLimit').value = Number(config.PAYMENT_HISTORY_LIMIT) || 100;
        const notificationHoursInput = document.getElementById('notificationHours');
        if (notificationHoursInput) {
          // 将通知小时数组格式化为逗号分隔的字符串，便于管理员查看与编辑
          const hours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS : [];
          notificationHoursInput.value = hours.join(', ');
        }
        
        // 加载农历显示设置
        document.getElementById('showLunarGlobal').checked = config.SHOW_LUNAR === true;

        // 动态生成时区选项，并设置保存的值
        generateTimezoneOptions(config.TIMEZONE || 'UTC');

        // 处理多选通知渠道
        const enabledNotifiers = config.ENABLED_NOTIFIERS || ['notifyx'];
        document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
          checkbox.checked = enabledNotifiers.includes(checkbox.value);
        });

        toggleNotificationConfigs(enabledNotifiers);
      } catch (error) {
        console.error('加载配置失败:', error);
        showToast('加载配置失败，请刷新页面重试', 'error');
      }
    }
    
    // 动态生成时区选项
    function generateTimezoneOptions(selectedTimezone = 'UTC') {
      const timezoneSelect = document.getElementById('timezone');
      const fallbackTimezone = 'UTC';
      
      const timezones = [
        { value: 'UTC', name: '世界标准时间', offset: '+0' },
        { value: 'Asia/Shanghai', name: '中国标准时间', offset: '+8' },
        { value: 'Asia/Hong_Kong', name: '香港时间', offset: '+8' },
        { value: 'Asia/Taipei', name: '台北时间', offset: '+8' },
        { value: 'Asia/Singapore', name: '新加坡时间', offset: '+8' },
        { value: 'Asia/Tokyo', name: '日本时间', offset: '+9' },
        { value: 'Asia/Seoul', name: '韩国时间', offset: '+9' },
        { value: 'America/New_York', name: '美国东部时间', offset: '-5' },
        { value: 'America/Chicago', name: '美国中部时间', offset: '-6' },
        { value: 'America/Denver', name: '美国山地时间', offset: '-7' },
        { value: 'America/Los_Angeles', name: '美国太平洋时间', offset: '-8' },
        { value: 'Europe/London', name: '英国时间', offset: '+0' },
        { value: 'Europe/Paris', name: '巴黎时间', offset: '+1' },
        { value: 'Europe/Berlin', name: '柏林时间', offset: '+1' },
        { value: 'Europe/Moscow', name: '莫斯科时间', offset: '+3' },
        { value: 'Australia/Sydney', name: '悉尼时间', offset: '+10' },
        { value: 'Australia/Melbourne', name: '墨尔本时间', offset: '+10' },
        { value: 'Pacific/Auckland', name: '奥克兰时间', offset: '+12' }
      ];
      
      // 清空现有选项
      timezoneSelect.innerHTML = '';
      
      // 添加新选项
      timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.value;
        option.textContent = tz.name + '（UTC' + tz.offset + '）';
        timezoneSelect.appendChild(option);
      });

      const timezoneExists = timezones.some(tz => tz.value === selectedTimezone);
      timezoneSelect.value = timezoneExists ? selectedTimezone : fallbackTimezone;

      if (!timezoneExists) {
        showToast('检测到未知时区配置，已回退为 UTC，请重新确认后保存', 'warning', 4500);
      }
    }
    
    function toggleNotificationConfigs(enabledNotifiers) {
      const telegramConfig = document.getElementById('telegramConfig');
      const notifyxConfig = document.getElementById('notifyxConfig');
      const webhookConfig = document.getElementById('webhookConfig');
      const wechatbotConfig = document.getElementById('wechatbotConfig');
      const emailConfig = document.getElementById('emailConfig');
      const barkConfig = document.getElementById('barkConfig');
      const gotifyConfig = document.getElementById('gotifyConfig');

      // 重置所有配置区域
      [telegramConfig, notifyxConfig, webhookConfig, wechatbotConfig, emailConfig, barkConfig, gotifyConfig].forEach(config => {
        config.classList.remove('active', 'inactive');
        config.classList.add('inactive');
      });

      // 激活选中的配置区域
      enabledNotifiers.forEach(type => {
        if (type === 'telegram') {
          telegramConfig.classList.remove('inactive');
          telegramConfig.classList.add('active');
        } else if (type === 'notifyx') {
          notifyxConfig.classList.remove('inactive');
          notifyxConfig.classList.add('active');
        } else if (type === 'webhook') {
          webhookConfig.classList.remove('inactive');
          webhookConfig.classList.add('active');
        } else if (type === 'wechatbot') {
          wechatbotConfig.classList.remove('inactive');
          wechatbotConfig.classList.add('active');
        } else if (type === 'email') {
          emailConfig.classList.remove('inactive');
          emailConfig.classList.add('active');
        } else if (type === 'bark') {
          barkConfig.classList.remove('inactive');
          barkConfig.classList.add('active');
        } else if (type === 'gotify') {
          gotifyConfig.classList.remove('inactive');
          gotifyConfig.classList.add('active');
        }
      });
    }

    document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
          .map(cb => cb.value);
        toggleNotificationConfigs(enabledNotifiers);
      });
    });
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
        .map(cb => cb.value);

      if (enabledNotifiers.length === 0) {
        showToast('请至少选择一种通知方式', 'warning');
        return;
      }

      const config = {
        ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
        THEME_MODE: document.getElementById('themeModeSelect').value,      // 保存主题设置

        // token/密钥类字段：默认留空=不修改；要清空则走 CLEAR_SECRET_FIELDS
        TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
        NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
        WEBHOOK_URL: document.getElementById('webhookUrl').value.trim(),
        WEBHOOK_HEADERS: document.getElementById('webhookHeaders').value.trim(),
        WECHATBOT_WEBHOOK: document.getElementById('wechatbotWebhook').value.trim(),
        RESEND_API_KEY: document.getElementById('resendApiKey').value.trim(),
        BARK_DEVICE_KEY: document.getElementById('barkDeviceKey').value.trim(),
        THIRD_PARTY_API_TOKEN: document.getElementById('thirdPartyToken').value.trim(),
        GOTIFY_APP_TOKEN: document.getElementById('gotifyAppToken').value.trim(),

        // 非敏感字段正常提交
        TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
        WEBHOOK_METHOD: document.getElementById('webhookMethod').value,
        WEBHOOK_TEMPLATE: document.getElementById('webhookTemplate').value.trim(),
        SHOW_LUNAR: document.getElementById('showLunarGlobal').checked,
        WECHATBOT_MSG_TYPE: document.getElementById('wechatbotMsgType').value,
        WECHATBOT_AT_MOBILES: document.getElementById('wechatbotAtMobiles').value.trim(),
        WECHATBOT_AT_ALL: document.getElementById('wechatbotAtAll').checked.toString(),
        EMAIL_FROM: document.getElementById('emailFrom').value.trim(),
        EMAIL_FROM_NAME: document.getElementById('emailFromName').value.trim(),
        EMAIL_TO: document.getElementById('emailTo').value.trim(),
        BARK_SERVER: document.getElementById('barkServer').value.trim() || 'https://api.day.app',
        BARK_IS_ARCHIVE: document.getElementById('barkIsArchive').checked.toString(),
        GOTIFY_SERVER_URL: document.getElementById('gotifyServerUrl').value.trim(),
        ENABLED_NOTIFIERS: enabledNotifiers,
        TIMEZONE: document.getElementById('timezone').value.trim(),

        // 标记“清空哪些密钥字段”
        CLEAR_SECRET_FIELDS: Array.from(CLEAR_SECRET_FIELDS),

        DEBUG_LOGS: document.getElementById('debugLogs').checked === true,
        PAYMENT_HISTORY_LIMIT: (() => {
          const raw = Number(document.getElementById('paymentHistoryLimit').value);
          if (!Number.isFinite(raw)) return 100;
          return Math.min(1000, Math.max(10, Math.floor(raw)));
        })(),
        // 前端先行整理通知小时列表，后端仍会再次校验
        NOTIFICATION_HOURS: (() => {
          const raw = document.getElementById('notificationHours').value.trim();
          if (!raw) {
            return [];
          }
          return raw
            .split(/[,，\s]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        })()
      };

      const passwordField = document.getElementById('adminPassword');
      if (passwordField.value.trim()) {
        config.ADMIN_PASSWORD = passwordField.value.trim();
      }

      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
      submitButton.disabled = true;

      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
          showToast('配置保存成功', 'success');
          if (window.updateAppTheme) {    // 保存成功后立即应用主题，无需刷新
            window.updateAppTheme(config.THEME_MODE);
          }
          passwordField.value = '';
          
          // 前端始终显示浏览器本地时区
          globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          showSystemTime();
          
          // 标记时区已更新，供其他页面检测
          localStorage.setItem('timezoneUpdated', Date.now().toString());
          
          // 如果当前在订阅列表页面，则自动刷新页面以更新时区显示
          if (window.location.pathname === '/admin') {
            window.location.reload();
          }
        } else {
          showToast('配置保存失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('保存配置失败:', error);
        showToast('保存配置失败，请稍后再试', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function testNotification(type) {
      const buttonId = type === 'telegram' ? 'testTelegramBtn' :
                      type === 'notifyx' ? 'testNotifyXBtn' :
                      type === 'wechatbot' ? 'testWechatBotBtn' :
                      type === 'email' ? 'testEmailBtn' :
                      type === 'bark' ? 'testBarkBtn' :
                      type === 'gotify' ? 'testGotifyBtn' : 'testWebhookBtn';
      const button = document.getElementById(buttonId);
      if (!button) {
        showToast('测试按钮不存在，请刷新页面后重试', 'error');
        return;
      }
      const originalContent = button.innerHTML;
      const serviceName = type === 'telegram' ? 'Telegram' :
                          type === 'notifyx' ? 'NotifyX' :
                          type === 'wechatbot' ? '企业微信机器人' :
                          type === 'email' ? '邮件通知' :
                          type === 'bark' ? 'Bark' :
                          type === 'gotify' ? 'Gotify' : 'Webhook 通知';

      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>测试中...';
      button.disabled = true;

      const config = {};
      // 方案 B：敏感字段不回显。测试通知时如果用户没填，就按“使用服务器已保存的配置”处理。
      if (type === 'telegram') {
        config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();
        const token = document.getElementById('tgBotToken').value.trim();
        if (token) config.TG_BOT_TOKEN = token;
      } else if (type === 'notifyx') {
        const key = document.getElementById('notifyxApiKey').value.trim();
        if (key) config.NOTIFYX_API_KEY = key;
      } else if (type === 'webhook') {
        config.WEBHOOK_METHOD = document.getElementById('webhookMethod').value;
        config.WEBHOOK_TEMPLATE = document.getElementById('webhookTemplate').value.trim();
        const url = document.getElementById('webhookUrl').value.trim();
        const headers = document.getElementById('webhookHeaders').value.trim();
        if (url) config.WEBHOOK_URL = url;
        if (headers) config.WEBHOOK_HEADERS = headers;
      } else if (type === 'wechatbot') {
        config.WECHATBOT_MSG_TYPE = document.getElementById('wechatbotMsgType').value;
        config.WECHATBOT_AT_MOBILES = document.getElementById('wechatbotAtMobiles').value.trim();
        config.WECHATBOT_AT_ALL = document.getElementById('wechatbotAtAll').checked.toString();
        const url = document.getElementById('wechatbotWebhook').value.trim();
        if (url) config.WECHATBOT_WEBHOOK = url;
      } else if (type === 'email') {
        const key = document.getElementById('resendApiKey').value.trim();
        if (key) config.RESEND_API_KEY = key;
        config.EMAIL_FROM = document.getElementById('emailFrom').value.trim();
        config.EMAIL_FROM_NAME = document.getElementById('emailFromName').value.trim();
        config.EMAIL_TO = document.getElementById('emailTo').value.trim();
      } else if (type === 'bark') {
        config.BARK_SERVER = document.getElementById('barkServer').value.trim() || 'https://api.day.app';
        const key = document.getElementById('barkDeviceKey').value.trim();
        if (key) config.BARK_DEVICE_KEY = key;
        config.BARK_IS_ARCHIVE = document.getElementById('barkIsArchive').checked.toString();
      } else if (type === 'gotify') {
        config.GOTIFY_SERVER_URL = document.getElementById('gotifyServerUrl').value.trim();
        const token = document.getElementById('gotifyAppToken').value.trim();
        if (token) config.GOTIFY_APP_TOKEN = token;

        if (!config.GOTIFY_SERVER_URL) {
          showToast('请先填写 Gotify Server URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      }

      try {
        const response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, ...config })
        });

        let result = null;
        try {
          result = await response.json();
        } catch (_) {
          result = { success: false, message: '服务返回了无法解析的响应' };
        }

        if (response.ok && result.success) {
          showToast(serviceName + ' 通知测试成功！', 'success');
        } else {
          const message = (result && result.message) ? result.message : ('HTTP ' + response.status);
          showToast(serviceName + ' 通知测试失败: ' + message, 'error', 4500);
        }
      } catch (error) {
        console.error('测试通知失败:', error);
        showToast(serviceName + ' 测试失败，请检查网络后重试', 'error');
      } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('testTelegramBtn').addEventListener('click', () => {
      testNotification('telegram');
    });
    
    document.getElementById('testNotifyXBtn').addEventListener('click', () => {
      testNotification('notifyx');
    });

    document.getElementById('testWebhookBtn').addEventListener('click', () => {
      testNotification('webhook');
    });

    document.getElementById('testWechatBotBtn').addEventListener('click', () => {
      testNotification('wechatbot');
    });

    document.getElementById('testEmailBtn').addEventListener('click', () => {
      testNotification('email');
    });

    document.getElementById('testBarkBtn').addEventListener('click', () => {
      testNotification('bark');
    });

    document.getElementById('testGotifyBtn').addEventListener('click', () => {
      testNotification('gotify');
    });

    document.getElementById('generateThirdPartyToken').addEventListener('click', () => {
      try {
        // 生成 32 位随机令牌，避免出现特殊字符，方便写入 URL
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const buffer = new Uint8Array(32);
        window.crypto.getRandomValues(buffer);
        const token = Array.from(buffer).map(v => charset[v % charset.length]).join('');
        const input = document.getElementById('thirdPartyToken');
        input.value = token;
        input.dispatchEvent(new Event('input'));
        showToast('已生成新的第三方 API 令牌，请保存配置后生效', 'info');
      } catch (error) {
        console.error('生成令牌失败:', error);
        showToast('生成令牌失败，请手动输入', 'error');
      }
    });

    window.addEventListener('load', () => {
      // 绑定敏感字段输入/清空按钮
      wireSecretInput('tgBotToken', 'TG_BOT_TOKEN');
      wireSecretInput('notifyxApiKey', 'NOTIFYX_API_KEY');
      wireSecretInput('webhookUrl', 'WEBHOOK_URL');
      wireSecretInput('webhookHeaders', 'WEBHOOK_HEADERS');
      wireSecretInput('wechatbotWebhook', 'WECHATBOT_WEBHOOK');
      wireSecretInput('resendApiKey', 'RESEND_API_KEY');
      wireSecretInput('barkDeviceKey', 'BARK_DEVICE_KEY');
      wireSecretInput('thirdPartyToken', 'THIRD_PARTY_API_TOKEN');
      wireSecretInput('gotifyAppToken', 'GOTIFY_APP_TOKEN');

      wireClearSecretButton('clearTgBotToken', 'tgBotToken', 'TG_BOT_TOKEN');
      wireClearSecretButton('clearNotifyxApiKey', 'notifyxApiKey', 'NOTIFYX_API_KEY');
      wireClearSecretButton('clearWebhookUrl', 'webhookUrl', 'WEBHOOK_URL');
      wireClearSecretButton('clearWebhookHeaders', 'webhookHeaders', 'WEBHOOK_HEADERS');
      wireClearSecretButton('clearWechatbotWebhook', 'wechatbotWebhook', 'WECHATBOT_WEBHOOK');
      wireClearSecretButton('clearResendApiKey', 'resendApiKey', 'RESEND_API_KEY');
      wireClearSecretButton('clearBarkDeviceKey', 'barkDeviceKey', 'BARK_DEVICE_KEY');
      wireClearSecretButton('clearThirdPartyToken', 'thirdPartyToken', 'THIRD_PARTY_API_TOKEN');
      wireClearSecretButton('clearGotifyAppToken', 'gotifyAppToken', 'GOTIFY_APP_TOKEN');

      loadConfig();
    });
    
    // 前端展示时区（固定使用浏览器本地时区）
    let globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    let systemTimeTimer = null;
    let timezoneCheckTimer = null;
    
    // 实时显示系统时间和时区
    async function showSystemTime() {
      try {
        // 获取后台配置的时区
        const response = await fetch('/api/config');
        const config = await response.json();
        globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // 格式化当前时间
        function formatTime(dt, tz) {
          return dt.toLocaleString('zh-CN', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        function formatTimezoneDisplay(tz) {
          try {
            // 使用更准确的时区偏移计算方法
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            
            // 时区中文名称映射
            const timezoneNames = {
              'UTC': '世界标准时间',
              'Asia/Shanghai': '中国标准时间',
              'Asia/Hong_Kong': '香港时间',
              'Asia/Taipei': '台北时间',
              'Asia/Singapore': '新加坡时间',
              'Asia/Tokyo': '日本时间',
              'Asia/Seoul': '韩国时间',
              'America/New_York': '美国东部时间',
              'America/Los_Angeles': '美国太平洋时间',
              'America/Chicago': '美国中部时间',
              'America/Denver': '美国山地时间',
              'Europe/London': '英国时间',
              'Europe/Paris': '巴黎时间',
              'Europe/Berlin': '柏林时间',
              'Europe/Moscow': '莫斯科时间',
              'Australia/Sydney': '悉尼时间',
              'Australia/Melbourne': '墨尔本时间',
              'Pacific/Auckland': '奥克兰时间'
            };
            
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            const timezoneName = timezoneNames[tz] || tz;
            return timezoneName + ' (UTC' + offsetStr + ')';
          } catch (error) {
            console.error('格式化时区显示失败:', error);
            return tz;
          }
        }
        function update() {
          const now = new Date();
          const timeStr = formatTime(now, globalTimezone);
          const tzStr = formatTimezoneDisplay(globalTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = timeStr + '  ' + tzStr;
          }
          // 更新移动端显示 (新增)
          const mobileEl = document.getElementById('mobileTimeDisplay');
          if (mobileEl) {
            mobileEl.textContent = timeStr + ' ' + tzStr;
          }
        }
        update();

        if (systemTimeTimer) {
          clearInterval(systemTimeTimer);
        }
        systemTimeTimer = setInterval(update, 1000);

        if (timezoneCheckTimer) {
          clearInterval(timezoneCheckTimer);
        }
        timezoneCheckTimer = setInterval(async () => {
          try {
            const response = await fetch('/api/config');
            await response.json();
            const newTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

            if (globalTimezone !== newTimezone) {
              globalTimezone = newTimezone;
              update();
            }
          } catch (error) {
            console.error('检查时区更新失败:', error);
          }
        }, 30000);
      } catch (e) {
        // 出错时显示本地时间
        const el = document.getElementById('systemTimeDisplay');
        if (el) {
          el.textContent = new Date().toLocaleString();
        }
      }
    }
    showSystemTime();
    // --- 新增：移动端菜单控制脚本 ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      const syncMobileMenuState = () => {
        const icon = mobileMenuBtn.querySelector('i');
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('fa-bars', isHidden);
          icon.classList.toggle('fa-times', !isHidden);
        }
      };

      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        syncMobileMenuState();
      });
      
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        });
      });

      document.addEventListener('click', (event) => {
        if (mobileMenu.classList.contains('hidden')) return;
        if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      syncMobileMenuState();
    }
