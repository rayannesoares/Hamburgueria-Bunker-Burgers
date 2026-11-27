window.BunkerAuth = (function () {
  const SESSION_KEY = "bunker_session_v1";
  const STAFF_KEY = "bunker_burgers_staff_v1";

  let onSessionReady = null;
  let lastPendingEmail = "";

  function setRouteHash(route) {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    if (window.location.hash !== `#${normalized}`) {
      window.history.replaceState(null, "", `#${normalized}`);
    }
  }

  function hideAllPortals() {
    ["publicMenuScreen", "portalGerenteLogin", "portalFuncionario", "appShell"].forEach((id) => {
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
    const list = readStorage(STAFF_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveStaff(list) {
    writeStorage(STAFF_KEY, Array.isArray(list) ? list : []);
  }

  function upsertStaffMember(member) {
    const list = getStaff();
    const emailLower = String(member.email || "").trim().toLowerCase();
    const idx = list.findIndex(
      (item) => String(item.email || "").trim().toLowerCase() === emailLower
    );

    const record = {
      id: member.id || (idx >= 0 ? list[idx].id : Date.now()),
      name: member.name || (idx >= 0 ? list[idx].name : "Funcionário"),
      phone: member.phone || (idx >= 0 ? list[idx].phone : ""),
      roleTitle: member.roleTitle || (idx >= 0 ? list[idx].roleTitle : "Atendente / Caixa"),
      email: (member.email || "").trim(),
      status: member.status || "PENDENTE",
      createdAt: idx >= 0 ? list[idx].createdAt : new Date().toISOString()
    };

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.unshift(record);
    }

    saveStaff(list);
    return record;
  }

  function setStaffStatus(emailOrId, status) {
    const target = String(emailOrId || "").trim().toLowerCase();
    const list = getStaff().map((item) => {
      const matchEmail = String(item.email || "").trim().toLowerCase() === target;
      const matchId = String(item.id || "").trim().toLowerCase() === target;
      if (matchEmail || matchId) {
        return { ...item, status, updatedAt: new Date().toISOString() };
      }
      return item;
    });
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

  function showRoute(route) {
    const targetRoute = route || "/gerente/login";
    setRouteHash(targetRoute);
    hideAllPortals();

    if (targetRoute === "/cardapio-publico") {
      const el = document.getElementById("publicMenuScreen");
      if (el) el.hidden = false;
      renderPublicMenu("todos");
      return;
    }

    if (targetRoute === "/gerente/login") {
      const el = document.getElementById("portalGerenteLogin");
      if (el) el.hidden = false;
      return;
    }

    if (
      targetRoute === "/funcionario/login" ||
      targetRoute === "/funcionario/cadastro" ||
      targetRoute === "/funcionario/pendente"
    ) {
      const portal = document.getElementById("portalFuncionario");
      const loginForm = document.getElementById("funcionarioLoginForm");
      const cadForm = document.getElementById("funcionarioCadastroForm");
      const pendBox = document.getElementById("funcionarioPendenteBox");

      if (portal) portal.hidden = false;
      if (loginForm) loginForm.hidden = targetRoute !== "/funcionario/login";
      if (cadForm) cadForm.hidden = targetRoute !== "/funcionario/cadastro";
      if (pendBox) pendBox.hidden = targetRoute !== "/funcionario/pendente";

      document.getElementById("tabFuncLogin")?.classList.toggle("active", targetRoute === "/funcionario/login");
      document.getElementById("tabFuncCadastro")?.classList.toggle("active", targetRoute === "/funcionario/cadastro");
      document.getElementById("tabFuncPendente")?.classList.toggle("active", targetRoute === "/funcionario/pendente");
      return;
    }

    const session = getSession();
    if (!session.authenticated) {
      showRoute(targetRoute.startsWith("/funcionario") ? "/funcionario/login" : "/gerente/login");
      return;
    }

    if (targetRoute === "/gerente/dashboard" && session.user.role !== "GERENTE") {
      showRoute("/funcionario/dashboard");
      return;
    }

    const shell = document.getElementById("appShell");
    if (shell) shell.hidden = false;

    if (typeof onSessionReady === "function") {
      onSessionReady(session.user, targetRoute);
    }
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

    document.getElementById("gerenteLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = document.getElementById("gerenteLoginMsg");
      const email =
        (document.getElementById("gerenteEmail")?.value || "").trim() || "gerente@bunkerburgers.com.br";

      setSession({
        name: "Gerente Bunker",
        email,
        role: "GERENTE",
        roleTitle: "Gerente",
        unit: "Nilópolis • RJ"
      });

      if (msg) msg.textContent = "";
      showRoute("/gerente/dashboard");
    });

    document.getElementById("funcionarioLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = document.getElementById("funcLoginMsg");
      const email =
        (document.getElementById("funcLoginEmail")?.value || "").trim() || "equipe@bunkerburgers.com.br";
      lastPendingEmail = email;

      const existing = getStaff().find(
        (s) => String(s.email || "").trim().toLowerCase() === email.toLowerCase()
      );

      if (existing && String(existing.status).toUpperCase() === "PENDENTE") {
        const desc = document.getElementById("pendenteDescricao");
        if (desc) {
          desc.textContent = `A conta ${email} ainda está pendente de aprovação pelo gerente.`;
        }
        showRoute("/funcionario/pendente");
        return;
      }

      if (existing && (String(existing.status).toUpperCase() === "RECUSADO" || String(existing.status).toUpperCase() === "BLOQUEADO")) {
        if (msg) msg.textContent = "Acesso recusado ou bloqueado pela gerência.";
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

    document.getElementById("funcionarioCadastroForm")?.addEventListener("submit", (e) => {
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
      const email = (document.getElementById("funcCadEmail")?.value || "").trim();
      lastPendingEmail = email;

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
        desc.textContent = `Cadastro de ${email} enviado. Aguarde a aprovação do gerente.`;
      }
      showRoute("/funcionario/pendente");
    });

    document.getElementById("recheckApprovalBtn")?.addEventListener("click", () => {
      const desc = document.getElementById("pendenteDescricao");
      if (!lastPendingEmail) {
        showRoute("/funcionario/login");
        return;
      }

      const member = getStaff().find(
        (s) => String(s.email || "").trim().toLowerCase() === lastPendingEmail.toLowerCase()
      );
      const status = String(member?.status || "PENDENTE").toUpperCase();

      if (status === "APROVADO") {
        showRoute("/funcionario/login");
        return;
      }

      if (desc) {
        desc.textContent = `Status atual de ${lastPendingEmail}: ${status}.`;
      }
    });
  }

  function logout() {
    clearSession();
    showRoute("/gerente/login");
  }

  function init(callback) {
    onSessionReady = callback;
    bindEvents();

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

    const initialRoute = knownRoutes.includes(hashRoute) ? hashRoute : "/gerente/login";
    showRoute(initialRoute);
  }

  return {
    init,
    showRoute,
    logout,
    getStaff,
    approveStaff: (emailOrId) => setStaffStatus(emailOrId, "APROVADO"),
    rejectStaff: (emailOrId) => setStaffStatus(emailOrId, "RECUSADO")
  };
})();s
