window.BunkerAuth = (function () {
  const API_BASE = "/api/auth";
  let onSessionReady = null;
  let lastPendingEmail = "";

  function setRouteHash(route) {
    if (window.location.hash !== `#${route}`) {
      window.history.replaceState(null, "", `#${route}`);
    }
  }

  function hideAllPortals() {
    document.getElementById("publicMenuScreen").hidden = true;
    document.getElementById("portalGerenteLogin").hidden = true;
    document.getElementById("portalFuncionario").hidden = true;
    document.getElementById("appShell").hidden = true;
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
      document.getElementById("publicMenuScreen").hidden = false;
      renderPublicMenu("todos");
      return;
    }

    if (route === "/gerente/login") {
      document.getElementById("portalGerenteLogin").hidden = false;
      return;
    }

    if (
      route === "/funcionario/login" ||
      route === "/funcionario/cadastro" ||
      route === "/funcionario/pendente"
    ) {
      document.getElementById("portalFuncionario").hidden = false;
      document.getElementById("funcionarioLoginForm").hidden = route !== "/funcionario/login";
      document.getElementById("funcionarioCadastroForm").hidden = route !== "/funcionario/cadastro";
      document.getElementById("funcionarioPendenteBox").hidden = route !== "/funcionario/pendente";

      document.getElementById("tabFuncLogin").classList.toggle("active", route === "/funcionario/login");
      document.getElementById("tabFuncCadastro").classList.toggle("active", route === "/funcionario/cadastro");
      document.getElementById("tabFuncPendente").classList.toggle("active", route === "/funcionario/pendente");
      return;
    }

    // /gerente/dashboard ou /funcionario/dashboard só abrem após validação do backend
    verifyBackendSession().then((session) => {
      if (!session || !session.authenticated) {
        showRoute(route.startsWith("/funcionario") ? "/funcionario/login" : "/gerente/login");
        return;
      }

      if (route === "/gerente/dashboard" && session.user.role !== "GERENTE") {
        showRoute("/funcionario/dashboard");
        return;
      }

      document.getElementById("appShell").hidden = false;
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
      if (!resp.ok) return { authenticated: false };
      return await resp.json();
    } catch {
      return { authenticated: false };
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

    // Login Gerente
    document.getElementById("gerenteLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("gerenteLoginMsg");
      msg.textContent = "Validando credenciais no servidor...";

      try {
        const resp = await fetch(`${API_BASE}/gerente/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: document.getElementById("gerenteEmail").value.trim(),
            password: document.getElementById("gerentePassword").value,
            remember: document.getElementById("rememberGerente").checked
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          msg.textContent = data.message || "Falha na autenticação do gerente.";
          return;
        }
        msg.textContent = "";
        showRoute("/gerente/dashboard");
      } catch {
        msg.textContent = "Servidor backend indisponível. Inicie o backend conectado ao banco de dados.";
      }
    });

    // Login Funcionário
    document.getElementById("funcionarioLoginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("funcLoginMsg");
      const email = document.getElementById("funcLoginEmail").value.trim();
      lastPendingEmail = email;
      msg.textContent = "Verificando conta e aprovação...";

      try {
        const resp = await fetch(`${API_BASE}/funcionario/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password: document.getElementById("funcLoginPassword").value
          })
        });
        const data = await resp.json();

        if (resp.status === 403 && data.status === "PENDENTE") {
          document.getElementById("pendenteDescricao").textContent =
            `A conta ${email} ainda está pendente de aprovação pelo gerente.`;
          showRoute("/funcionario/pendente");
          return;
        }

        if (!resp.ok) {
          msg.textContent = data.message || "Acesso não autorizado.";
          return;
        }

        msg.textContent = "";
        showRoute("/funcionario/dashboard");
      } catch {
        msg.textContent = "Servidor backend indisponível. Inicie o backend conectado ao banco de dados.";
      }
    });

    // Cadastro Funcionário
    document.getElementById("funcionarioCadastroForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("funcCadMsg");
      const senha = document.getElementById("funcCadSenha").value;
      const confirmar = document.getElementById("funcCadConfirmarSenha").value;

      if (senha !== confirmar) {
        msg.textContent = "A senha e a confirmação de senha não coincidem.";
        return;
      }

      const email = document.getElementById("funcCadEmail").value.trim();
      lastPendingEmail = email;
      msg.textContent = "Enviando solicitação de cadastro...";

      try {
        const resp = await fetch(`${API_BASE}/funcionario/cadastro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: document.getElementById("funcCadNome").value.trim(),
            phone: document.getElementById("funcCadTelefone").value.trim(),
            roleTitle: document.getElementById("funcCadCargo").value,
            inviteCode: document.getElementById("funcCadConvite").value.trim(),
            email,
            password: senha
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          msg.textContent = data.message || "Não foi possível enviar o cadastro.";
          return;
        }

        msg.textContent = "";
        e.target.reset();
        document.getElementById("pendenteDescricao").textContent =
          `Cadastro de ${email} enviado com sucesso. Aguarde a aprovação do gerente.`;
        showRoute("/funcionario/pendente");
      } catch {
        msg.textContent = "Servidor backend indisponível. Inicie o backend conectado ao banco de dados.";
      }
    });

    document.getElementById("recheckApprovalBtn")?.addEventListener("click", async () => {
      if (!lastPendingEmail) {
        showRoute("/funcionario/login");
        return;
      }
      try {
        const resp = await fetch(
          `${API_BASE}/funcionario/status?email=${encodeURIComponent(lastPendingEmail)}`
        );
        const data = await resp.json();
        if (data.status === "APROVADO") {
          showRoute("/funcionario/login");
        } else {
          document.getElementById("pendenteDescricao").textContent =
            `Status atual de ${lastPendingEmail}: ${data.status || "PENDENTE"}.`;
        }
      } catch {
        document.getElementById("pendenteDescricao").textContent =
          "Não foi possível consultar o status agora.";
      }
    });
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
    } catch {}
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