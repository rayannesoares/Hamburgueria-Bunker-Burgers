window.BunkerAuth = (function () {
  const API_BASE = "/api/auth";
  const SESSION_KEY = "bunker_session_v1";
  const STAFF_KEY = "bunker_burgers_staff_v1";

  let onSessionReady = null;
  let lastPendingEmail = "";

  function setRouteHash(route) {
    if (window.location.hash !== `#${route}`) {
      window.history.replaceState(null, "", `#${route}`);
    }
  }

  function hideAllPortals() {
    const ids = [
      "publicMenuScreen",
      "portalGerenteLogin",
      "portalFuncionario",
      "appShell"
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function getSession() {
    const data = readStorage(SESSION_KEY, null);
    if (data && data.user) {
      return { authenticated: true, user: data.user };
    }
    return { authenticated: false };
  }

  function setSession(user) {
    writeStorage(SESSION_KEY, { user });
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function getStaff() {
    return readStorage(STAFF_KEY, []);
  }

  function saveStaff(list) {
    writeStorage(STAFF_KEY, list);
  }

  function upsertStaffMember(member) {
    const list = getStaff();
    const emailLower = String(member.email || "").toLowerCase();
    const index = list.findIndex((item) => String(item.email || "").toLowerCase() === emailLower);

    const record = {
      id: member.id || (index >= 0 ? list[index].id : `staff_${Date.now()}`),
      name: member.name || (index >= 0 ? list[index].name : "Funcionário"),
      phone: member.phone || (index >= 0 ? list[index].phone : ""),
      roleTitle: member.roleTitle || (index >= 0 ? list[index].roleTitle : "Atendente / Caixa"),
      email: member.email,
      status: member.status || "PENDENTE",
      createdAt: index >= 0 ? list[index].createdAt : new Date().toISOString()
    };

    if (index >= 0) {
      list[index] = { ...list[index], ...record };
    } else {
      list.push(record);
    }

    saveStaff(list);
    return record;
  }

  function setStaffStatus(email, status) {
    const emailLower = String(email || "").toLowerCase();
    const list = getStaff().map((item) =>
      String(item.email || "").toLowerCase() === emailLower
        ? { ...item, status, updatedAt: new Date().toISOString() }
        : item
    );
    saveStaff(list);
    return list;
  }

  function renderPublicMenu(category = "todos") {
    const grid = document.getElementById("publicMenuGrid");
    if (!grid) return;

    const items = (window.BUNKER_DATA?.menu || []).filter(
      (item) => item.available && (category === "todos" || item.category === category)
    );

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

  async function verifySession() {
    try {
      const resp = await fetch(`${API_BASE}/sessao`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.authenticated && data.user) {
          return data;
        }
      }
    } catch {}
    return getSession();
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

    verifySession().then((session) => {
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
      const email = (document.getElementById("gerenteEmail")?.value || "").trim() || "gerente@bunkerburgers.com.br";
      const password = document.getElementById("gerentePassword")?.value || "";
      const remember = Boolean(document.getElementById("rememberGerente")?.checked);

      if (msg) msg.textContent = "Validando acesso...";

      try {
        const resp = await fetch(`${API_BASE}/gerente/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, remember })
        });
        if (resp.ok) {
          if (msg) msg.textContent = "";
          showRoute("/gerente/dashboard");
          return;
        }
      } catch {}

      setSession({
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
      const email = (document.getElementById("funcLoginEmail")?.value || "").trim() || "equipe@bunkerburgers.com.br";
      const password = document.getElementById("funcLoginPassword")?.value || "";
      lastPendingEmail = email;

      if (msg) msg.textContent = "Verificando conta...";

      try {
        const resp = await fetch(`${API_BASE}/funcionario/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password })
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

      const existing = getStaff().find(
        (s) => String(s.email || "").toLowerCase() === email.toLowerCase()
      );

      if (existing && existing.status === "PENDENTE") {
        const desc = document.getElementById("pendenteDescricao");
        if (desc) {
          desc.textContent = `A conta ${email} ainda está pendente de aprovação pelo gerente.`;
        }
        showRoute("/funcionario/pendente");
        return;
      }

      setSession({
        name: existing?.name || "Equipe Bunker",
        email,
        role: "FUNCIONARIO",
        roleTitle: existing?.roleTitle || "Atendente / Caixa",
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
          body: JSON.stringify({ name, phone, roleTitle, inviteCode, email, password: senha })
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

      upsertStaffMember({
        name,
        phone,
        roleTitle,
        email,
        status: "PENDENTE"
      });

      if (msg) msg.textContent = "";
      e.target.reset();
      const desc = document.getElementById("pendenteDescricao");
      if (desc) {
        desc.textContent = `Cadastro de ${email} registrado para aprovação do gerente.`;
      }
      showRoute("/funcionario/pendente");
    });

    // Verificar Aprovação
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

      const member = getStaff().find(
        (s) => String(s.email || "").toLowerCase() === lastPendingEmail.toLowerCase()
      );
      const status = member?.status || "PENDENTE";

      if (status === "APROVADO") {
        showRoute("/funcionario/login");
        return;
      }

      if (desc) {
        desc.textContent = `Status atual de ${lastPendingEmail}: ${status}.`;
      }
    });
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
    } catch {}
    clearSession();
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

  return {
    init,
    showRoute,
    logout,
    getStaff,
    approveStaff: (email) => setStaffStatus(email, "APROVADO"),
    rejectStaff: (email) => setStaffStatus(email, "RECUSADO")
  };
})();
