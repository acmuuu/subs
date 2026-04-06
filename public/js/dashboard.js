
    // 定义货币符号映射
    const currencySymbols = {
      'CNY': '¥', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
      'JPY': '¥', 'EUR': '€', 'GBP': '£', 'KRW': '₩', 'TRY': '₺'
    };
    function getSymbol(currency) {
      return currencySymbols[currency] || '¥';
    }

    // 前端统一本地时区显示
    async function showSystemTime() {
      try {
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        function formatTimezoneDisplay(tz) {
          try {
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
            const offsetStr = offset >= 0 ? '+' + offset : offset;
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
            const timezoneName = timezoneNames[tz] || tz;
            return `${timezoneName} (UTC${offsetStr})`;
          } catch (error) {
            console.error('格式化时区显示失败:', error);
            return tz;
          }
        }

        function update() {
          const now = new Date();
          const timeStr = now.toLocaleString('zh-CN', {
            timeZone: localTimezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const tzStr = formatTimezoneDisplay(localTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = `${timeStr}  ${tzStr}`;
          }
          const mobileEl = document.getElementById('mobileTimeDisplay');
          if (mobileEl) {
            mobileEl.textContent = `${timeStr} ${tzStr}`;
          }
        }

        update();
        setInterval(update, 1000);
      } catch (e) {
        console.error(e);
      }
    }

    async function loadDashboardData(){
      try {
        const r=await fetch('/api/dashboard/stats');
        const d=await r.json();
        if(!d.success) throw new Error(d.message||'加载失败');
        
        const data=d.data;

        const schedulerStatusEl = document.getElementById('schedulerStatus');
        if (schedulerStatusEl) {
          const status = data.schedulerStatus;
          if (!status) {
            schedulerStatusEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🕐</div><div class="empty-state-text">暂无定时任务执行记录（等待下一次 Cron）</div></div>';
          } else {
            const sendResult = status.sendResult || {};
            const runAt = status.lastRunAt ? new Date(status.lastRunAt).toLocaleString('zh-CN') : '未知';
            const configuredHours = Array.isArray(status.configuredHours) && status.configuredHours.length > 0
              ? status.configuredHours.join(', ')
              : '全部时段';
            const sentBadge = status.sent
              ? '<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">本次有发送</span>'
              : '<span class="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">本次未发送</span>';

            schedulerStatusEl.innerHTML = `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">最近执行时间</div>
                  <div class="text-gray-900 font-medium mt-1">${runAt}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">状态</div>
                  <div class="mt-1">${sentBadge}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">当前小时 / 配置时段（UTC）</div>
                  <div class="text-gray-900 font-medium mt-1">${status.currentHour || '--'} / ${configuredHours}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">检查与命中</div>
                  <div class="text-gray-900 font-medium mt-1">检查 ${status.checkedSubscriptions || 0} 条，命中 ${status.expiringMatched || 0} 条</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3 md:col-span-2">
                  <div class="text-gray-500">发送结果</div>
                  <div class="text-gray-900 font-medium mt-1">尝试 ${sendResult.attempted || 0} 个渠道，成功 ${sendResult.successCount || 0}，失败 ${sendResult.failedCount || 0}，去重跳过 ${status.dedupeSkipped || 0}</div>
                  <div class="text-xs text-gray-500 mt-1">${status.reason || '暂无详情'}</div>
                </div>
              </div>
            `;
          }
        }

        const schedulerHistory = Array.isArray(data.schedulerStatusHistory) ? data.schedulerStatusHistory : [];
        const schedulerHistoryEl = document.getElementById('schedulerStatusHistory');
        if (schedulerHistoryEl) {
          if (schedulerHistory.length === 0) {
            schedulerHistoryEl.innerHTML = '<div class="text-sm text-gray-500">暂无历史记录</div>';
          } else {
            schedulerHistoryEl.innerHTML = schedulerHistory.slice(0, 10).map(item => {
              const when = item.lastRunAt ? new Date(item.lastRunAt).toLocaleString('zh-CN') : '未知时间';
              const sent = item.sent ? '已发送' : '未发送';
              const reason = item.reason || '-';
              return `<div class="py-2 border-b border-gray-100 last:border-b-0 text-sm"><div class="font-medium text-gray-800">${when} · ${sent}</div><div class="text-xs text-gray-500 mt-1">${reason}</div></div>`;
            }).join('');
          }
        }

        document.getElementById('statsGrid').innerHTML=`
          <div class="stat-card">
            <div class="stat-card-header">月度支出 (CNY)</div>
            <div class="stat-card-value">¥${data.monthlyExpense.amount.toFixed(2)}</div>
            <div class="stat-card-subtitle">本月折合支出</div>
            <div class="stat-card-trend ${data.monthlyExpense.trendDirection}">
              <i class="fas fa-arrow-${data.monthlyExpense.trendDirection==='up'?'up':data.monthlyExpense.trendDirection==='down'?'down':'right'}"></i>
              ${data.monthlyExpense.trend}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">年度支出 (CNY)</div>
            <div class="stat-card-value">¥${data.yearlyExpense.amount.toFixed(2)}</div>
            <div class="stat-card-subtitle">月均支出: ¥${data.yearlyExpense.monthlyAverage.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">活跃订阅</div>
            <div class="stat-card-value">${data.activeSubscriptions.active}</div>
            <div class="stat-card-subtitle">总订阅数: ${data.activeSubscriptions.total}</div>
            ${data.activeSubscriptions.expiringSoon>0?`<div class="stat-card-trend down"><i class="fas fa-exclamation-circle"></i>${data.activeSubscriptions.expiringSoon} 即将到期</div>`:''}
          </div>
        `;
        
        const rp=document.getElementById('recentPayments');
        rp.innerHTML=data.recentPayments.length===0?'<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">过去7天内没有支付记录</div></div>':
        data.recentPayments.map(s=>`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-calendar"></i> ${new Date(s.paymentDate).toLocaleDateString('zh-CN')}</span>
                ${s.customType?`<span class="list-item-badge">${s.customType}</span>`:''}
              </div>
            </div>
            <div class="list-item-amount">${getSymbol(s.currency)}${(s.amount||0).toFixed(2)}</div>
          </div>
        `).join('');
        
        const ur=document.getElementById('upcomingRenewals');
        ur.innerHTML=data.upcomingRenewals.length===0?'<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">未来7天内没有即将续费的订阅</div></div>':
        data.upcomingRenewals.map(s=>`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-clock"></i> ${new Date(s.renewalDate).toLocaleDateString('zh-CN')}</span>
                <span style="color:#f59e0b;font-weight:600">${s.daysUntilRenewal} 天后</span>
                ${s.customType?`<span class="list-item-badge">${s.customType}</span>`:''}
              </div>
            </div>
            <div class="list-item-amount">${getSymbol(s.currency)}${(s.amount||0).toFixed(2)}</div>
          </div>
        `).join('');
        
        const et=document.getElementById('expenseByType');
        et.innerHTML=data.expenseByType.length===0?'<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无支出数据</div></div>':
        data.expenseByType.map((item,i)=>`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name">${item.type}</div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">¥${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-${(i%5)+1}" style="width:${item.percentage}%"></div>
            </div>
          </div>
        `).join('');
        
        const ec=document.getElementById('expenseByCategory');
        ec.innerHTML=data.expenseByCategory.length===0?'<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">暂无支出数据</div></div>':
        data.expenseByCategory.map((item,i)=>`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name">${item.category}</div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">¥${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-${(i%5)+1}" style="width:${item.percentage}%"></div>
            </div>
          </div>
        `).join('');
      } catch(e){
        console.error('加载仪表盘数据失败:',e);
        document.getElementById('statsGrid').innerHTML='<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败:'+e.message+'</div></div>';
      }
    }
    
    // 初始化时间显示和数据加载
    showSystemTime();
    loadDashboardData();
    setInterval(loadDashboardData, 60000);

    // --- 移动端菜单控制脚本 ---
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
