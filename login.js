window.BunkerAuth = (function () {
  const API_BASE = "/api/auth";
  const DEMO_SESSION_KEY = "bunker_burgers_session_v1";
  const DEMO_STAFF_KEY = "bunker_burgers_staff_v1";

  let onSessionReady = null;
  let lastPendingEmail = "";

  function setRouteHash(route) {
    if (window.location.hash !== `#${route}`) {
      window.history.replaceState(null, "", `#${route}`);
    }
  }

  function hideAllPortals() {
    const publicMenu = document.getElementById("publicMenuScreen");
    const gerentePortal = document.getElementById("portalGerenteLogin");
    const funcPortal = document.getElementById("portalFuncionario");
    const appShell = document.getElementById("appShell");

    if (publicMenu) publicMenu.hidden = true;
    if (gerentePortal) gerentePortal.hidden = true;
    if (funcPortal) funcPortal.hidden = true;
    if (appShell) appShell.hidden = true;
  }

  function getLocalSession() {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      if (!raw) return { authenticated: false };
      const parsed = JSON.parse(raw);
      return parsed && parsed.user
        ? { authenticated: true, user: parsed.user }
        : { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  }

  function setLocalSession(user) {
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ user }));
    } catch {}
  }

  function clearLocalSession() {
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {}
  }

  function getStaffList() {
    try {
      return JSON.parse(localStorage.getItem(DEMO_STAFF_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveStaffList(list) {
    try {
      localStorage.setItem(DEMO_STAFF_KEY, JSON.stringify(list));
    } catch {}
  }

  function renderPublicMenu(category = "todos") {
    const grid = document.getElementById("publicMenuGrid");
    const items = (window.BUNKER_DATA?.menu || []).filter(
      (item) => item.available && (category === "todos" || item.category === category)
    );
    if (!grid) return;

    grid.innerHTML = items
      .map(
        (item) => `
        <article class="burger-card">
          <img src="${item.img}" alt="${item.name}" />
          <div class="burger-card-body">
            <span class="badge orange">${item.category}</span>
            <h3 style="font-size:1rem;">${item.name}</h3>
            <p style="font-size:0.82rem;color:var(--text-muted);flex:1;">${item.desc}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
              <span class="burger-price">R$ ${Number(item.price).toFixed(2).replace(".", ",")}</span>
              <span class="badge green">Disponível</span>
            </div>
          </div>
        </article>
      `
      )
      .join("");
  }

  function showRoute(route) {
    setRouteHash(route);
    hideAllPortals();

    if (route === "/cardapio-publico") {
      const el = document.getElementById("publicMenuScreen");
      if (el) el.hidden = false;
      renderPublicMenu("todos");
      return;
    }

    if (route === "/gerente/login") {
      const el = document.getElementById("portalGerenteLogin");
      if (el) el.hidden = false;
      return;
    }

    if (
      route === "/funcionario/login" ||
      route === "/funcionario/cadastro" ||
      route === "/funcionario/pendente"
    ) {
      const portal = document.getElementById("portalFuncionario");
      const loginForm = document.getElementById("funcionarioLoginForm");
      const cadForm = document.getElementById("funcionarioCadastroForm");
      const pendBox = document.getElementById("funcionarioPendenteBox");

      if (portal) portal.hidden = false;
      if (loginForm) loginForm.hidden = route !== "/funcionario/login";
      if (cadForm) cadForm.hidden = route !== "/funcionario/cadastro";
      if (pendBox) pendBox.hidden = route !== "/funcionario/pendente";

      document.getElementById("tabFuncLogin")?.classList.toggle("active", route === "/funcionario/login");
      document.getElementById("tabFuncCadastro")?.classList.toggle("active", route === "/funcionario/cadastro");
      document.getElementById("tabFuncPendente")?.classList.toggle("active", route === "/funcionario/pendente");
      return;
    }

    verifyBackendSession().then((session) => {
      if (!session || !session.authenticated) {
        showRoute(route.startsWith("/funcionario") ? "/funcionario/login" : "/gerente/login");
        return;
      }

      if (route === "/gerente/dashboard" && session.user.role !== "GERENTE") {
        showRoute("/funcionario/dashboard");
        return;
      }

      const shell = document.getElementById("appShell");
      if (shell) shell.hidden = false;
      if (typeof onSessionReady === "function") {
        onSessionReady(session.user, route);
      }
    });
  }

  async function verifyBackendSession() {
    try {
      const resp = await fetch(`${API_BASE}/sessao`, {
        credentials: "include"
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.authenticated) return data;
      }
    } catch {}
    return getLocalSession();
  }

  function bindEvents() {
    document.querySelectorAll("[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showRoute(btn.dataset.route);
      });
    });

    document.querySelectorAll("[data-toggle-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.toggleTarget);
        if (input) {
          input.type = input.type === "password" ? "text" : "password";
        }
      });
    });

    document.querySelectorAll("[data-pub-cat]").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll("[data-pub-cat]").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        renderPublicMenu(pill.dataset.pubCat);
      });
    });

    // Login Gerente
    document.getElementById("gerenteLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("gerenteLoginMsg");
      const emailInput = document.getElementById("gerenteEmail");
      const passInput = document.getElementById("gerentePassword");
      const rememberInput = document.getElementById("rememberGerente");

      const email = (emailInput?.value || "").trim() || "gerente@bunkerburgers.com.br";
      if (msg) msg.textContent = "Validando acesso...";

      try {
        const resp = await fetch(`${API_BASE}/gerente/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password: passInput?.value || "",
            remember: Boolean(rememberInput?.checked)
          })
        });
        if (resp.ok) {
          if (msg) msg.textContent = "";
          showRoute("/gerente/dashboard");
          return;
        }
      } catch {}

      setLocalSession({
        name: "Gerente Bunker",
        email,
        role: "GERENTE",
        unit: "Nilópolis • RJ"
      });
      if (msg) msg.textContent = "";
      showRoute("/gerente/dashboard");
    });

    // Login Funcionário
    document.getElementById("funcionarioLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("funcLoginMsg");
      const emailInput = document.getElementById("funcLoginEmail");
      const passInput = document.getElementById("funcLoginPassword");

      const email = (emailInput?.value || "").trim() || "equipe@bunkerburgers.com.br";
      lastPendingEmail = email;
      if (msg) msg.textContent = "Verificando conta...";

      try {
        const resp = await fetch(`${API_BASE}/funcionario/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password: passInput?.value || ""
          })
        });
        const data = await resp.json().catch(() => ({}));

        if (resp.status === 403 && data.status === "PENDENTE") {
          const desc = document.getElementById("pendenteDescricao");
          if (desc) {
            desc.textContent = `A conta ${email} ainda está pendente de aprovação pelo gerente.`;
          }
          showRoute("/funcionario/pendente");
          return;
        }

        if (resp.ok) {
          if (msg) msg.textContent = "";
          showRoute("/funcionario/dashboard");
          return;
        }
      } catch {}

      const staff = getStaffList().find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (staff && staff.status === "PENDENTE") {
        const desc = document.getElementById("pendenteDescricao");
        if (desc) {
          desc.textContent = `A conta ${email} ainda está pendente de aprovação pelo gerente.`;
        }
        showRoute("/funcionario/pendente");
        return;
      }

      setLocalSession({
        name: staff?.name || "Equipe Bunker",
        email,
        role: "FUNCIONARIO",
        roleTitle: staff?.roleTitle || "Atendente / Caixa",
        unit: "Nilópolis • RJ"
      });
      if (msg) msg.textContent = "";
      showRoute("/funcionario/dashboard");
    });

    // Cadastro Funcionário
    document.getElementById("funcionarioCadastroForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("funcCadMsg");
      const senha = document.getElementById("funcCadSenha")?.value || "";
      const confirmar = document.getElementById("funcCadConfirmarSenha")?.value || "";

      if (senha !== confirmar) {
        if (msg) msg.textContent = "A senha e a confirmação de senha não coincidem.";
        return;
      }

      const name = (document.getElementById("funcCadNome")?.value || "").trim();
      const phone = (document.getElementById("funcCadTelefone")?.value || "").trim();
      const roleTitle = document.getElementById("funcCadCargo")?.value || "Atendente / Caixa";
      const inviteCode = (document.getElementById("funcCadConvite")?.value || "").trim();
      const email = (document.getElementById("funcCadEmail")?.value || "").trim();
      lastPendingEmail = email;
      if (msg) msg.textContent = "Enviando solicitação de cadastro...";

      try {
        const resp = await fetch(`${API_BASE}/funcionario/cadastro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            roleTitle,
            inviteCode,
            email,
            password: senha
          })
        });
        if (resp.ok) {
          if (msg) msg.textContent = "";
          e.target.reset();
          const desc = document.getElementById("pendenteDescricao");
          if (desc) {
            desc.textContent = `Cadastro de ${email} enviado com sucesso. Aguarde a aprovação do gerente.`;
          }
          showRoute("/funcionario/pendente");
          return;
        }
      } catch {}

      const list = getStaffList().filter((s) => s.email.toLowerCase() !== email.toLowerCase());
      list.push({ name, phone, roleTitle, email, status: "PENDENTE" });
      saveStaffList(list);

      if (msg) msg.textContent = "";
      e.target.reset();
      const desc = document.getElementById("pendenteDescricao");
      if (desc) {
        desc.textContent = `Cadastro de ${email} registrado em modo demonstração. Aguarde a aprovação do gerente.`;
      }
      showRoute("/funcionario/pendente");
    });

    document.getElementById("recheckApprovalBtn")?.addEventListener("click", async () => {
      const desc = document.getElementById("pendenteDescricao");
      if (!lastPendingEmail) {
        showRoute("/funcionario/login");
        return;
      }
      try {
        const resp = await fetch(
          `${API_BASE}/funcionario/status?email=${encodeURIComponent(lastPendingEmail)}`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === "APROVADO") {
            showRoute("/funcionario/login");
            return;
          }
          if (desc) {
            desc.textContent = `Status atual de ${lastPendingEmail}: ${data.status || "PENDENTE"}.`;
          }
          return;
        }
      } catch {}

      const staff = getStaffList().find(
        (s) => s.email.toLowerCase() === lastPendingEmail.toLowerCase()
      );
      const status = staff?.status || "PENDENTE";
      if (desc) {
        desc.textContent = `Status atual de ${lastPendingEmail}: ${status} (modo demonstração).`;
      }
    });
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
    } catch {}
    clearLocalSession();
    showRoute("/gerente/login");
  }

  function init(callback) {
    onSessionReady = callback;
    bindEvents();

    const path = window.location.pathname;
    const hashRoute = window.location.hash.replace(/^#/, "");
    const knownRoutes = [
      "/gerente/login",
      "/gerente/dashboard",
      "/funcionario/login",
      "/funcionario/cadastro",
      "/funcionario/pendente",
      "/funcionario/dashboard",
      "/cardapio-publico"
    ];

    const initialRoute = knownRoutes.includes(path)
      ? path
      : knownRoutes.includes(hashRoute)
        ? hashRoute
        : "/gerente/login";

    showRoute(initialRoute);
  }

  return { init, showRoute, logout };
})();
