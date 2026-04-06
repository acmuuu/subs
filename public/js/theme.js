
  (function() {
    function applyTheme(mode) {
      const html = document.documentElement;
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (mode === 'dark' || (mode === 'system' && isSystemDark)) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }

    const savedTheme = localStorage.getItem('themeMode') || 'light';
    applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const currentMode = localStorage.getItem('themeMode') || 'system';
      if (currentMode === 'system') {
        applyTheme('system');
      }
    });

    window.addEventListener('load', async () => {
      if (window.location.pathname.startsWith('/admin')) {
        try {
          const res = await fetch('/api/config');
          const config = await res.json();
          if (config.THEME_MODE && config.THEME_MODE !== localStorage.getItem('themeMode')) {
            localStorage.setItem('themeMode', config.THEME_MODE);
            applyTheme(config.THEME_MODE);
            const select = document.getElementById('themeModeSelect');
            if (select) select.value = config.THEME_MODE;
          }
        } catch(e) {}
      }
    });
    
    window.updateAppTheme = function(mode) {
      localStorage.setItem('themeMode', mode);
      applyTheme(mode);
    };
  })();
