// ═══════════════════════════════════════════════════════
//  VIEWS/LOGIN.JS — Supabase Auth
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
      </div>`;

    this.attachEvents();
  },

  attachEvents() {
    const doLogin = async () => {
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');
      const btn   = document.getElementById('login-btn');

      errEl.classList.add('hidden');

      if (!email) { errEl.textContent = 'Ingresa tu email.'; errEl.classList.remove('hidden'); return; }
      if (!pass)  { errEl.textContent = 'Ingresa tu contrasena.'; errEl.classList.remove('hidden'); return; }

      btn.disabled = true;
      btn.textContent = 'Ingresando...';

      try {
        const result = await Store.login(email, pass);
        if (!result.ok) {
          errEl.textContent = result.error;
          errEl.classList.remove('hidden');
          btn.disabled = false;
          btn.textContent = 'Ingresar';
          return;
        }

        // Success — load data and show app
        document.getElementById('login-screen').classList.add('hidden');
        App.init();
      } catch (e) {
        errEl.textContent = 'Error de conexion. Intenta de nuevo.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    };

    document.getElementById('login-btn').onclick = doLogin;
    document.getElementById('login-pass').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
    document.getElementById('login-email').onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('login-pass').focus(); };
  },
};
