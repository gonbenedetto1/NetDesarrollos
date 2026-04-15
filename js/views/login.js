// ═══════════════════════════════════════════════════════
//  VIEWS/LOGIN.JS
// ═══════════════════════════════════════════════════════

const LoginView = {
  render() {
    const screen = document.getElementById('login-screen');
    screen.classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');

    screen.innerHTML = `
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-mark"><span>NET</span></div>
          <div class="login-logo-text">
            <h2>Sistema NET</h2>
            <p>Gestion interna del equipo</p>
          </div>
        </div>

        <div id="login-error" class="login-error hidden"></div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="login-email" placeholder="tu@email.com" autocomplete="email">
        </div>

        <div class="form-group">
          <label class="form-label">Contrasena</label>
          <input class="form-input" type="password" id="login-pass" placeholder="Ingresa tu contrasena" autocomplete="current-password">
        </div>

        <button class="btn btn-primary w-full" id="login-btn" style="width:100%;justify-content:center;padding:12px;font-size:14px;border-radius:var(--r-lg);margin-top:8px">
          Ingresar
        </button>

        <p style="font-size:11.5px;color:var(--text-4);text-align:center;margin-top:14px">
          La contrasena es tu nombre en minusculas
        </p>
      </div>`;

    this.attachEvents();
  },

  attachEvents() {
    const doLogin = () => {
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');

      errEl.classList.add('hidden');

      if (!email) {
        errEl.textContent = 'Ingresa tu email.';
        errEl.classList.remove('hidden'); return;
      }
      if (!pass) {
        errEl.textContent = 'Ingresa tu contrasena.';
        errEl.classList.remove('hidden'); return;
      }

      const result = Store.login(email, pass);
      if (!result.ok) {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden'); return;
      }

      // Success — show app
      document.getElementById('login-screen').classList.add('hidden');
      App.init();
    };

    document.getElementById('login-btn').onclick = doLogin;
    document.getElementById('login-pass').onkeydown = (e) => {
      if (e.key === 'Enter') doLogin();
    };
    document.getElementById('login-email').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('login-pass').focus();
    };
  },
};
