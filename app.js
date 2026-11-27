const STORAGE_STATE_KEY = "bunker_burgers_nilopolis_full_v1";

const SECTION_META = {
  "visao-geral": { title: "1. Visão geral", sub: "Resumo operacional e metas do dia" },
  "pedidos": { title: "2. Pedidos", sub: "Gestão completa de pedidos recebidos, preparo e entrega" },
  "cardapio": { title: "3. Cardápio digital", sub: "Produtos, fotos, preços e disponibilidade" },
  "clientes": { title: "4. Clientes", sub: "Base de clientes de Nilópolis e histórico de compras" },
  "funcionarios": { title: "5. Funcionários", sub: "Equipe, aprovação de cadastros, cargos e permissões" },
  "cozinha": { title: "6. Controle da cozinha", sub: "Painel KDS em tempo real para chapa e montagem" },
  "estoque": { title: "7. Controle de estoque", sub: "Insumos, alertas de reposição e entradas" },
  "financeiro": { title: "8. Financeiro", sub: "Receitas, despesas e saldo líquido" },
  "pdv": { title: "9. Frente de caixa (PDV)", sub: "Lançamento rápido de vendas de balcão, mesa e delivery" },
  "entregas": { title: "10. Entregas", sub: "Controle de motoboys e rotas em Nilópolis" },
  "promocoes": { title: "11. Promoções e cupons", sub: "Campanhas e cupons promocionais ativos" },
  "avaliacoes": { title: "12. Avaliações", sub: "Feedbacks dos clientes e respostas" },
  "relatorios": { title: "13. Relatórios de vendas", sub: "Indicadores por período, ticket médio e produtos" },
  "notificacoes": { title: "14. Notificações", sub: "Alertas de estoque, novos cadastros e pedidos" },
  "permissoes": { title: "15. Permissões de acesso", sub: "Controle de módulos liberados por cargo" },
  "configuracoes": { title: "16. Configurações", sub: "Dados da hamburgueria e código de convite" }
};

function loadInitialState() {
  const base = window.BUNKER_DATA || {};
  try {
    const raw = localStorage.getItem(STORAGE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        shopName: "Bunker Burgers Nilópolis",
        shopCode: "BUNKER2026",
        address: "Centro, Nilópolis - RJ",
        phone: "(21) 99999-0000",
        dailyGoal: 1500,
        cashRegisterOpen: true,
        cashOpeningAmount: 200,
        menu: [],
        orders: [],
        customers: [],
        staff: [],
        inventory: [],
        transactions: [],
        coupons: [],
        reviews: [],
        notifications: [],
        permissions: {},
        monthlyStats: [],
        ...base,
        ...parsed,
        activeSection: "visao-geral",
        menuCategory: parsed.menuCategory || "todos",
        searchQuery: "",
        pdvCart: Array.isArray(parsed.pdvCart) ? parsed.pdvCart : []
      };
    }
  } catch (err) {
    console.warn("Falha ao ler localStorage:", err);
  }

  return {
    shopName: "Bunker Burgers Nilópolis",
    shopCode: "BUNKER2026",
    address: "Centro, Nilópolis - RJ",
    phone: "(21) 99999-0000",
    dailyGoal: 1500,
    cashRegisterOpen: true,
    cashOpeningAmount: 200,
    menu: [],
    orders: [],
    customers: [],
    staff: [],
    inventory: [],
    transactions: [],
    coupons: [],
    reviews: [],
    notifications: [],
    permissions: {},
    monthlyStats: [],
    ...base,
    activeSection: "visao-geral",
    menuCategory: "todos",
    searchQuery: "",
    pdvCart: []
  };
}

const state = loadInitialState();
window.BUNKER_STATE = state;

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_STATE_KEY,
      JSON.stringify({
        shopName: state.shopName,
        shopCode: state.shopCode,
        address: state.address,
        phone: state.phone,
        dailyGoal: state.dailyGoal,
        cashRegisterOpen: state.cashRegisterOpen,
        cashOpeningAmount: state.cashOpeningAmount,
        currentUser: state.currentUser,
        menu: state.menu,
        orders: state.orders,
        customers: state.customers,
        staff: state.staff,
        inventory: state.inventory,
        transactions: state.transactions,
        coupons: state.coupons,
        reviews: state.reviews,
        notifications: state.notifications,
        permissions: state.permissions,
        monthlyStats: state.monthlyStats,
        menuCategory: state.menuCategory,
        pdvCart: state.pdvCart
      })
    );
  } catch (err) {
    console.warn("Falha ao salvar localStorage:", err);
  }
}

function brl(val) {
  return `R$ ${Number(val || 0).toFixed(2).replace(".", ",")}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("bunker_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("bunker_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getUserAvatarIcon(user) {
  const role = String(user?.role || "").toUpperCase();
  const title = String(user?.roleTitle || "").toLowerCase();

  if (role === "GERENTE" || title.includes("gerente")) {
    return "👔";
  }
  if (title.includes("chapeiro") || title.includes("cozinha")) {
    return "👨‍🍳";
  }
  if (title.includes("motoboy") || title.includes("entregador")) {
    return "🛵";
  }
  if (title.includes("atendente") || title.includes("caixa")) {
    return "🧑‍💼";
  }
  return "👤";
}

function openModal(title, html) {
  const modal = document.getElementById("appModal");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = html;
  modal.hidden = false;
}

function closeModal() {
  const modal = document.getElementById("appModal");
  if (modal) modal.hidden = true;
}

window.openModal = openModal;
window.closeModal = closeModal;

function addNotification(title, text) {
  if (!Array.isArray(state.notifications)) state.notifications = [];
  state.notifications.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    text,
    read: false
  });
  updateNotifyBadges();
  persistState();
}

function updateNotifyBadges() {
  const unread = (state.notifications || []).filter((n) => !n.read).length;
  const badge = document.getElementById("sidebarNotifyBadge");
  const dot = document.getElementById("topbarNotifyDot");

  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? "inline-block" : "none";
  }
  if (dot) {
    dot.style.display = unread > 0 ? "block" : "none";
  }
}

function getAllowedSectionsForCurrentUser() {
  const user = state.currentUser || { role: "GERENTE" };
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  const roleKey = user.role === "GERENTE" ? "Gerente" : user.role;
  return (state.permissions && state.permissions[roleKey]) || Object.keys(SECTION_META);
}

function applyRolePermissions() {
  const allowed = getAllowedSectionsForCurrentUser();
  const isManager =
    state.currentUser?.role === "Gerente" || state.currentUser?.role === "GERENTE";

  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    const sec = btn.dataset.section;
    const isAdminOnly = sec === "permissoes" || sec === "configuracoes";
    const isAllowed = allowed.includes(sec) && (!isAdminOnly || isManager);
    const parentGroup = btn.closest(".nav-group");

    if (parentGroup) {
      parentGroup.style.display = isAllowed ? "block" : "none";
    } else {
      btn.style.display = isAllowed ? "flex" : "none";
    }
  });

  const nameEl = document.getElementById("activeUserName");
  const roleEl = document.getElementById("activeUserRole");
  const avatarEl = document.querySelector(".profile-avatar");
  if (nameEl) nameEl.textContent = state.currentUser?.name || "Gerente Bunker";
  if (roleEl) {
    const cargoLabel = state.currentUser?.roleTitle || state.currentUser?.role || "Gerente";
    roleEl.textContent = `${cargoLabel} • Nilópolis`;
  }
  if (avatarEl) {
    avatarEl.textContent = getUserAvatarIcon(state.currentUser);
  }
}

function navigate(section) {
  const allowed = getAllowedSectionsForCurrentUser();
  const targetSection = allowed.includes(section) ? section : allowed[0] || "visao-geral";

  state.activeSection = targetSection;
  const meta = SECTION_META[targetSection] || SECTION_META["visao-geral"];

  const titleEl = document.getElementById("pageTitle");
  const subEl = document.getElementById("pageSub");
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = `${state.shopName || "Bunker Burgers Nilópolis"} • ${meta.sub}`;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === targetSection);
  });

  document.getElementById("appShell")?.classList.remove("mobile-open");
  renderWorkspace();
}

window.navigate = navigate;

function renderWorkspace() {
  const container = document.getElementById("workspace");
  if (!container) return;

  const handlers = {
    "visao-geral": renderVisaoGeral,
    "pedidos": renderPedidos,
    "cardapio": renderCardapio,
    "clientes": renderClientes,
    "funcionarios": renderFuncionarios,
    "cozinha": renderCozinha,
    "estoque": renderEstoque,
    "financeiro": renderFinanceiro,
    "pdv": renderPdv,
    "entregas": renderEntregas,
    "promocoes": renderPromocoes,
    "avaliacoes": renderAvaliacoes,
    "relatorios": renderRelatorios,
    "notificacoes": renderNotificacoes,
    "permissoes": renderPermissoes,
    "configuracoes": renderConfiguracoes
  };

  const renderFn = handlers[state.activeSection] || renderVisaoGeral;
  renderFn(container);
}

/* 1. VISÃO GERAL */
function renderVisaoGeral(el) {
  const ordersSum = (state.orders || []).reduce((acc, o) => acc + Number(o.total || 0), 0);
  const totalSales = ordersSum + 722.5;
  const goal = Number(state.dailyGoal || 1500);
  const pct = Math.min(100, Math.round((totalSales / goal) * 100));
  const totalOrdersCount = (state.orders || []).length + 24;
  const avgTicket = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;
  const availableMenuCount = (state.menu || []).filter((m) => m.available).length;
  const lowStockCount = (state.inventory || []).filter((i) => Number(i.qty) <= Number(i.min)).length;

  el.innerHTML = `
    <div class="grid-4">
      <div class="kpi-box">
        <div class="kpi-title">Faturamento Hoje</div>
        <div class="kpi-num">${brl(totalSales)}</div>
        <div class="kpi-trend">+12,4% vs ontem</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Pedidos no Turno</div>
        <div class="kpi-num">${totalOrdersCount}</div>
        <div class="kpi-trend">Ticket médio ${brl(avgTicket)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Itens no Cardápio</div>
        <div class="kpi-num">${(state.menu || []).length}</div>
        <div class="kpi-trend">${availableMenuCount} disponíveis agora</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Alertas de Estoque</div>
        <div class="kpi-num">${lowStockCount}</div>
        <div class="kpi-trend ${lowStockCount > 0 ? "neg" : ""}">
          ${lowStockCount > 0 ? "Reposição necessária" : "Estoque saudável"}
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card" style="text-align:center;">
        <h3 style="font-size:1rem;">Meta Diária de Faturamento</h3>
        <p style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(state.shopName)}</p>
        <div class="donut-wrap">
          <div class="donut-ring" style="--pct:${pct}%;">
            <div class="donut-hole">${pct}%</div>
          </div>
        </div>
        <div style="font-size:1.35rem;font-weight:700;">${brl(totalSales)}</div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px;">Meta: ${brl(goal)}</div>
        <button type="button" class="btn-primary" onclick="navigate('pdv')">Abrir Frente de Caixa (PDV)</button>
      </div>

      <div class="card">
        <div class="section-header" style="margin-bottom:8px;">
          <div>
            <h2>Desempenho Anual (Receitas x Despesas)</h2>
            <p>Comparativo mensal do ${escapeHtml(state.shopName)}</p>
          </div>
          <button type="button" class="btn-outline" onclick="navigate('relatorios')">Ver Relatórios</button>
        </div>
        <div class="bars-area">
          ${(state.monthlyStats || [])
            .map(
              (m) => `
              <div class="month-col">
                <div class="bars-pair">
                  <span class="bar-col income" style="height:${m.inc}%" title="${m.m} Receita: ${m.inc}%"></span>
                  <span class="bar-col expense" style="height:${m.exp}%" title="${m.m} Despesa: ${m.exp}%"></span>
                </div>
                <span class="month-label">${m.m}</span>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

/* 2. PEDIDOS */
function renderPedidos(el) {
  const q = state.searchQuery.trim().toLowerCase();
  const list = (state.orders || []).filter(
    (o) =>
      !q ||
      String(o.id).includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.items.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
  );

  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Pedidos em Andamento</h2>
          <p>Atualize o status do pedido ou atribua entregador</p>
        </div>
        <button type="button" class="btn-primary" onclick="navigate('pdv')">+ Novo Pedido no PDV</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#Pedido</th>
              <th>Cliente / Canal</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${
              list.length === 0
                ? `<tr><td colspan="6" style="color:var(--text-muted);">Nenhum pedido encontrado.</td></tr>`
                : list
                    .map(
                      (o) => `
                <tr>
                  <td><strong>#${o.id}</strong><br><small style="color:var(--text-muted)">${escapeHtml(o.createdAt)}</small></td>
                  <td>
                    <strong>${escapeHtml(o.customer)}</strong><br>
                    <small style="color:var(--text-muted)">${escapeHtml(o.type)} • ${escapeHtml(o.address)}</small>
                  </td>
                  <td>${escapeHtml(o.items)}</td>
                  <td><strong>${brl(o.total)}</strong><br><small>${escapeHtml(o.payment)}</small></td>
                  <td>
                    <span class="badge ${o.status === "Entregue" ? "green" : o.status === "Pronto" ? "blue" : "orange"}">
                      ${escapeHtml(o.status)}
                    </span>
                  </td>
                  <td style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn-sm" onclick="advanceOrderStatus(${o.id})">Avançar Status</button>
                    <button type="button" class="btn-sm danger" onclick="deleteOrder(${o.id})">Remover</button>
                  </td>
                </tr>
              `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.advanceOrderStatus = function (id) {
  const flow = ["Recebido", "Em preparo", "Pronto", "Saiu para entrega", "Entregue"];
  const order = state.orders.find((o) => o.id === id);
  if (!order) return;
  const idx = flow.indexOf(order.status);
  order.status = flow[(idx + 1) % flow.length];
  if (order.status === "Saiu para entrega" && (!order.courier || order.courier === "Aguardando")) {
    order.courier = "Carlos Motoboy";
  }
  persistState();
  renderWorkspace();
};

window.deleteOrder = function (id) {
  state.orders = state.orders.filter((o) => o.id !== id);
  persistState();
  renderWorkspace();
};

/* 3. CARDÁPIO DIGITAL */
function renderCardapio(el) {
  const q = state.searchQuery.trim().toLowerCase();
  const items = (state.menu || []).filter((m) => {
    const okCat = state.menuCategory === "todos" || m.category === state.menuCategory;
    const okSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q);
    return okCat && okSearch;
  });

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Cardápio Digital com Fotos</h2>
        <p>Gerencie burgers, combos, acompanhamentos e bebidas com preços e disponibilidade</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="menuCatSelect" class="btn-sm" style="padding:8px 12px;">
          <option value="todos" ${state.menuCategory === "todos" ? "selected" : ""}>Todas categorias</option>
          <option value="burgers" ${state.menuCategory === "burgers" ? "selected" : ""}>Burgers</option>
          <option value="combos" ${state.menuCategory === "combos" ? "selected" : ""}>Combos</option>
          <option value="acompanhamentos" ${state.menuCategory === "acompanhamentos" ? "selected" : ""}>Acompanhamentos</option>
          <option value="bebidas" ${state.menuCategory === "bebidas" ? "selected" : ""}>Bebidas</option>
        </select>
        <button type="button" class="btn-primary" onclick="openMenuModal()">+ Novo Produto</button>
      </div>
    </div>

    <div class="menu-grid">
      ${
        items.length === 0
          ? `<p style="color:var(--text-muted);">Nenhum produto encontrado para o filtro atual.</p>`
          : items
              .map(
                (item) => `
          <article class="burger-card" style="opacity:${item.available ? 1 : 0.62}">
            <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" />
            <div class="burger-card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge orange">${escapeHtml(item.category)}</span>
                <span class="badge ${item.available ? "green" : "red"}">${item.available ? "Disponível" : "Esgotado"}</span>
              </div>
              <h3 style="font-size:0.98rem;">${escapeHtml(item.name)}</h3>
              <p style="font-size:0.8rem;color:var(--text-muted);flex:1;">${escapeHtml(item.desc)}</p>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;gap:6px;flex-wrap:wrap;">
                <span class="burger-price">${brl(item.price)}</span>
                <div style="display:flex;gap:5px;">
                  <button type="button" class="btn-sm" onclick="toggleMenuAvail(${item.id})">${item.available ? "Pausar" : "Ativar"}</button>
                  <button type="button" class="btn-sm" onclick="openMenuModal(${item.id})">Editar</button>
                  <button type="button" class="btn-sm danger" onclick="deleteMenuItem(${item.id})">Excluir</button>
                </div>
              </div>
            </div>
          </article>
        `
              )
              .join("")
      }
    </div>
  `;

  document.getElementById("menuCatSelect")?.addEventListener("change", (e) => {
    state.menuCategory = e.target.value;
    persistState();
    renderWorkspace();
  });
}

window.toggleMenuAvail = function (id) {
  const item = state.menu.find((m) => m.id === id);
  if (!item) return;
  item.available = !item.available;
  persistState();
  renderWorkspace();
};

window.deleteMenuItem = function (id) {
  state.menu = state.menu.filter((m) => m.id !== id);
  persistState();
  renderWorkspace();
};

window.openMenuModal = function (itemId = null) {
  const existing = itemId !== null ? state.menu.find((m) => m.id === itemId) : null;

  openModal(
    existing ? "Editar Item do Cardápio" : "Cadastrar Item no Cardápio",
    `
      <form id="menuForm">
        <div class="form-group">
          <label>Nome do lanche / produto</label>
          <input type="text" id="mName" required value="${existing ? escapeHtml(existing.name) : ""}" placeholder="Ex.: Bunker Triplo Cheddar" />
        </div>
        <div class="form-group">
          <label>Categoria</label>
          <select id="mCat">
            <option value="burgers" ${existing?.category === "burgers" ? "selected" : ""}>Burgers</option>
            <option value="combos" ${existing?.category === "combos" ? "selected" : ""}>Combos</option>
            <option value="acompanhamentos" ${existing?.category === "acompanhamentos" ? "selected" : ""}>Acompanhamentos</option>
            <option value="bebidas" ${existing?.category === "bebidas" ? "selected" : ""}>Bebidas</option>
          </select>
        </div>
        <div class="form-group">
          <label>Preço (R$)</label>
          <input type="number" step="0.10" min="0.5" id="mPrice" required value="${existing ? existing.price : ""}" placeholder="38.90" />
        </div>
        <div class="form-group">
          <label>URL da Foto</label>
          <input type="url" id="mImg" required value="${existing ? escapeHtml(existing.img) : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=450&q=75"}" />
        </div>
        <div class="form-group">
          <label>Descrição / Ingredientes</label>
          <textarea id="mDesc" rows="2" placeholder="Ingredientes do produto...">${existing ? escapeHtml(existing.desc) : ""}</textarea>
        </div>
        <button type="submit" class="btn-primary full-btn">${existing ? "Salvar Alterações" : "Salvar no Cardápio"}</button>
      </form>
    `
  );

  document.getElementById("menuForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("mName").value.trim(),
      category: document.getElementById("mCat").value,
      price: Number(document.getElementById("mPrice").value),
      img: document.getElementById("mImg").value.trim(),
      desc: document.getElementById("mDesc").value.trim() || "Especialidade Bunker Burgers Nilópolis."
    };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      state.menu.unshift({
        id: Date.now(),
        ...payload,
        available: true
      });
    }

    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 4. CLIENTES */
function renderClientes(el) {
  const q = state.searchQuery.trim().toLowerCase();
  const rows = (state.customers || []).filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.neighborhood.toLowerCase().includes(q) ||
      c.favorite.toLowerCase().includes(q)
  );

  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Base de Clientes — Nilópolis</h2>
          <p>Histórico de pedidos, bairro e lanche favorito</p>
        </div>
        <button type="button" class="btn-primary" onclick="openCustomerModal()">+ Novo Cliente</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Bairro</th><th>Pedidos</th><th>Total Gasto</th><th>Favorito</th></tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (c) => `
                <tr>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>${escapeHtml(c.neighborhood)}</td>
                  <td>${c.orders}</td>
                  <td><strong>${brl(c.totalSpent)}</strong></td>
                  <td><span class="badge orange">${escapeHtml(c.favorite)}</span></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openCustomerModal = function () {
  openModal(
    "Cadastrar Cliente",
    `
      <form id="customerForm">
        <div class="form-group"><label>Nome</label><input type="text" id="cName" required /></div>
        <div class="form-group"><label>Bairro em Nilópolis</label><input type="text" id="cNeigh" value="Centro, Nilópolis" required /></div>
        <div class="form-group"><label>Burger favorito</label><input type="text" id="cFav" value="Bunker Smash Duplo Bacon" required /></div>
        <button type="submit" class="btn-primary full-btn">Adicionar Cliente</button>
      </form>
    `
  );

  document.getElementById("customerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.customers.unshift({
      id: Date.now(),
      name: document.getElementById("cName").value.trim(),
      neighborhood: document.getElementById("cNeigh").value.trim(),
      orders: 1,
      totalSpent: 34.9,
      favorite: document.getElementById("cFav").value.trim()
    });
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 5. FUNCIONÁRIOS (Sincronizado com PostgreSQL /api/users) */
async function syncStaffFromBackend() {
  try {
    const res = await fetch("/api/users", {
      headers: { ...getAuthHeaders() },
      credentials: "include"
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!Array.isArray(data.users)) return;

    const statusMap = {
      APROVADO: "Aprovado",
      PENDENTE: "Pendente",
      RECUSADO: "Recusado",
      BLOQUEADO: "Bloqueado"
    };

    state.staff = data.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role === "GERENTE" ? "Gerente" : u.role_title || "Atendente",
      shift: u.status === "PENDENTE" ? "Aguardando aprovação" : "18:00 - 00:00",
      status: statusMap[String(u.status || "").toUpperCase()] || "Pendente",
      permissions: Array.isArray(u.permissions) ? u.permissions : []
    }));

    persistState();
    if (state.activeSection === "funcionarios") {
      const container = document.getElementById("workspace");
      if (container) renderFuncionariosTable(container);
    }
  } catch (_err) {
    // Mantém lista local se o backend estiver indisponível
  }
}

function renderFuncionariosTable(el) {
  const pendingCount = (state.staff || []).filter((s) => s.status === "Pendente").length;

  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Equipe &amp; Solicitações de Cadastro</h2>
          <p>
            Código de convite: <strong>${escapeHtml(state.shopCode)}</strong> •
            Solicitações pendentes: <strong>${pendingCount}</strong>
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-sm" onclick="syncStaffFromBackend()">Atualizar Lista</button>
          <button type="button" class="btn-primary" onclick="openStaffModal()">+ Cadastrar Funcionário</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome / Contato</th>
              <th>Cargo</th>
              <th>Permissões</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${(state.staff || [])
              .map((s) => {
                const badgeClass =
                  s.status === "Aprovado"
                    ? "green"
                    : s.status === "Pendente"
                      ? "orange"
                      : "red";
                const perms = s.permissions || state.permissions?.[s.role] || [];
                const contactInfo = [s.email, s.phone, s.shift].filter(Boolean).join(" • ");
                return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(s.name)}</strong><br>
                      <small style="color:var(--text-muted)">${escapeHtml(contactInfo)}</small>
                    </td>
                    <td>${escapeHtml(s.role)}</td>
                    <td><small style="color:var(--text-muted)">${perms.length} módulos</small></td>
                    <td><span class="badge ${badgeClass}">${escapeHtml(s.status)}</span></td>
                    <td style="display:flex;gap:5px;flex-wrap:wrap;">
                      ${
                        s.status === "Pendente"
                          ? `<button type="button" class="btn-primary" style="padding:5px 9px;font-size:0.75rem;" onclick="setStaffStatus(${s.id}, 'Aprovado')">Aprovar</button>
                             <button type="button" class="btn-sm danger" onclick="setStaffStatus(${s.id}, 'Recusado')">Recusar</button>`
                          : ""
                      }
                      ${
                        s.role !== "Gerente" && s.status !== "Bloqueado"
                          ? `<button type="button" class="btn-sm danger" onclick="setStaffStatus(${s.id}, 'Bloqueado')">Bloquear</button>`
                          : s.role !== "Gerente"
                            ? `<button type="button" class="btn-sm" onclick="setStaffStatus(${s.id}, 'Aprovado')">Desbloquear</button>`
                            : ""
                      }
                      <button type="button" class="btn-sm" onclick="openEditStaffModal(${s.id})">Editar</button>
                      ${
                        s.role !== "Gerente"
                          ? `<button type="button" class="btn-sm danger" onclick="deleteStaffUser(${s.id})">Excluir</button>`
                          : ""
                      }
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderFuncionarios(el) {
  renderFuncionariosTable(el);
  syncStaffFromBackend();
}

window.syncStaffFromBackend = syncStaffFromBackend;

window.deleteStaffUser = async function (id) {
  const person = (state.staff || []).find((s) => s.id === id);
  if (!person) return;

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
      credentials: "include"
    });
    if (!res.ok) return;

    state.staff = (state.staff || []).filter((s) => s.id !== id);
    addNotification("Funcionário excluído", `${person.name} teve o acesso apagado do sistema.`);
    persistState();
    await syncStaffFromBackend();
    renderWorkspace();
  } catch {
    // Mantém estado atual em caso de falha de rede
  }
};

window.setStaffStatus = async function (id, nextStatus) {
  const person = state.staff.find((s) => s.id === id);
  if (!person) return;

  person.status = nextStatus;
  if (nextStatus === "Aprovado" && (!person.shift || person.shift === "Aguardando aprovação")) {
    person.shift = "18:00 - 00:00";
  }

  addNotification(
    `Funcionário ${nextStatus}`,
    `${person.name} (${person.role}) teve o status alterado para ${nextStatus}.`
  );

  try {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus.toUpperCase() })
    });
    await syncStaffFromBackend();
  } catch {
    // Mantém atualização local
  }

  persistState();
  renderWorkspace();
};

window.openEditStaffModal = function (id) {
  const person = state.staff.find((s) => s.id === id);
  if (!person) return;

  const allModules = Object.keys(SECTION_META);
  const currentPerms = person.permissions || state.permissions?.[person.role] || [];

  openModal(
    `Editar Funcionário — ${escapeHtml(person.name)}`,
    `
      <form id="editStaffForm">
        <div class="form-group">
          <label>Nome completo</label>
          <input type="text" id="esName" value="${escapeHtml(person.name)}" required />
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" id="esPhone" value="${escapeHtml(person.phone || "")}" placeholder="(21) 99999-9999" />
        </div>
        <div class="form-group">
          <label>Cargo</label>
          <select id="esRole">
            <option value="Atendente" ${person.role === "Atendente" ? "selected" : ""}>Atendente</option>
            <option value="Chapeiro" ${person.role === "Chapeiro" ? "selected" : ""}>Chapeiro</option>
            <option value="Motoboy" ${person.role === "Motoboy" ? "selected" : ""}>Motoboy</option>
            <option value="Gerente" ${person.role === "Gerente" ? "selected" : ""}>Gerente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="esStatus">
            <option value="Pendente" ${person.status === "Pendente" ? "selected" : ""}>Pendente</option>
            <option value="Aprovado" ${person.status === "Aprovado" ? "selected" : ""}>Aprovado</option>
            <option value="Recusado" ${person.status === "Recusado" ? "selected" : ""}>Recusado</option>
            <option value="Bloqueado" ${person.status === "Bloqueado" ? "selected" : ""}>Bloqueado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Permissões de acesso aos módulos</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:170px;overflow:auto;padding:8px;background:var(--bg-canvas);border-radius:8px;">
            ${allModules
              .map(
                (modKey) => `
                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;cursor:pointer;">
                  <input type="checkbox" name="esPerm" value="${modKey}" ${currentPerms.includes(modKey) ? "checked" : ""} />
                  <span>${SECTION_META[modKey].title}</span>
                </label>
              `
              )
              .join("")}
          </div>
        </div>
        <button type="submit" class="btn-primary full-btn">Salvar Cargo e Permissões</button>
      </form>
    `
  );

  document.getElementById("editStaffForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedPerms = Array.from(document.querySelectorAll('input[name="esPerm"]:checked')).map(
      (cb) => cb.value
    );

    const payload = {
      name: document.getElementById("esName").value.trim(),
      phone: document.getElementById("esPhone").value.trim(),
      role: document.getElementById("esRole").value,
      status: document.getElementById("esStatus").value,
      permissions: selectedPerms
    };

    Object.assign(person, payload);
    state.permissions[person.role] = selectedPerms;
    addNotification("Equipe atualizada", `${person.name} agora está como ${person.role} (${person.status}).`);

    try {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          status: payload.status.toUpperCase(),
          roleTitle: payload.role,
          permissions: selectedPerms
        })
      });
      await syncStaffFromBackend();
    } catch {
      // Mantém atualização local
    }

    persistState();
    closeModal();
    renderWorkspace();
  });
};

window.openStaffModal = function () {
  openModal(
    "Cadastrar Funcionário",
    `
      <form id="staffForm">
        <div class="form-group"><label>Nome completo</label><input type="text" id="sName" required /></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="sPhone" value="(21) 99999-0000" required /></div>
        <div class="form-group">
          <label>Cargo</label>
          <select id="sRole">
            <option value="Atendente">Atendente</option>
            <option value="Chapeiro">Chapeiro</option>
            <option value="Motoboy">Motoboy</option>
            <option value="Gerente">Gerente</option>
          </select>
        </div>
        <div class="form-group"><label>Turno</label><input type="text" id="sShift" value="18:00 - 00:00" required /></div>
        <button type="submit" class="btn-primary full-btn">Salvar Funcionário</button>
      </form>
    `
  );

  document.getElementById("staffForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("sName").value.trim();
    const role = document.getElementById("sRole").value;
    state.staff.push({
      id: Date.now(),
      name,
      phone: document.getElementById("sPhone").value.trim(),
      role,
      shift: document.getElementById("sShift").value.trim(),
      status: "Aprovado",
      permissions: [...(state.permissions?.[role] || [])]
    });
    addNotification("Novo funcionário na equipe", `${name} cadastrado como ${role}.`);
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 6. CONTROLE DA COZINHA (KDS) */
function renderCozinha(el) {
  const cols = [
    { title: "Recebidos", status: "Recebido", badge: "orange" },
    { title: "Na Chapa / Preparo", status: "Em preparo", badge: "blue" },
    { title: "Prontos para Saída", status: "Pronto", badge: "green" }
  ];

  el.innerHTML = `
    <div class="grid-3">
      ${cols
        .map((col) => {
          const items = (state.orders || []).filter((o) => o.status === col.status);
          return `
            <div class="card">
              <div class="section-header" style="margin-bottom:10px;">
                <h3 style="font-size:0.95rem;">${col.title}</h3>
                <span class="badge ${col.badge}">${items.length}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${
                  items.length === 0
                    ? `<p style="font-size:0.8rem;color:var(--text-muted);">Nenhum pedido nesta fila.</p>`
                    : items
                        .map(
                          (o) => `
                    <div style="padding:10px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-canvas);">
                      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <strong>#${o.id} • ${escapeHtml(o.customer)}</strong>
                        <small style="color:var(--text-muted)">${escapeHtml(o.createdAt)}</small>
                      </div>
                      <p style="font-size:0.82rem;margin-bottom:8px;">${escapeHtml(o.items)}</p>
                      <button type="button" class="btn-primary" style="padding:6px 10px;font-size:0.76rem;width:100%;" onclick="advanceOrderStatus(${o.id})">
                        Mover para Próxima Etapa →
                      </button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

/* 7. ESTOQUE */
function renderEstoque(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Controle de Estoque e Insumos</h2>
          <p>Monitore carnes, pães, queijos e embalagens</p>
        </div>
        <button type="button" class="btn-primary" onclick="openStockModal()">+ Novo Insumo</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Insumo</th><th>Quantidade</th><th>Mínimo</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            ${(state.inventory || [])
              .map((item) => {
                const low = Number(item.qty) <= Number(item.min);
                return `
                  <tr>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${item.qty} ${escapeHtml(item.unit)}</td>
                    <td>${item.min} ${escapeHtml(item.unit)}</td>
                    <td><span class="badge ${low ? "red" : "green"}">${low ? "Baixo" : "Normal"}</span></td>
                    <td style="display:flex;gap:6px;">
                      <button type="button" class="btn-sm" onclick="adjustStock(${item.id}, 5)">+5</button>
                      <button type="button" class="btn-sm" onclick="adjustStock(${item.id}, -1)">-1</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.adjustStock = function (id, delta) {
  const item = state.inventory.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(0, Number(item.qty) + delta);
  persistState();
  renderWorkspace();
};

window.openStockModal = function () {
  openModal(
    "Cadastrar Insumo no Estoque",
    `
      <form id="stockForm">
        <div class="form-group"><label>Nome do insumo</label><input type="text" id="stName" required /></div>
        <div class="form-group"><label>Quantidade atual</label><input type="number" id="stQty" value="20" required /></div>
        <div class="form-group"><label>Unidade (kg, un, pct)</label><input type="text" id="stUnit" value="un" required /></div>
        <div class="form-group"><label>Estoque mínimo</label><input type="number" id="stMin" value="5" required /></div>
        <button type="submit" class="btn-primary full-btn">Salvar Insumo</button>
      </form>
    `
  );

  document.getElementById("stockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.inventory.unshift({
      id: Date.now(),
      name: document.getElementById("stName").value.trim(),
      qty: Number(document.getElementById("stQty").value),
      unit: document.getElementById("stUnit").value.trim(),
      min: Number(document.getElementById("stMin").value)
    });
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 8. FINANCEIRO */
function renderFinanceiro(el) {
  const txs = state.transactions || [];
  const income = txs.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);

  el.innerHTML = `
    <div class="grid-3">
      <div class="kpi-box"><div class="kpi-title">Entradas</div><div class="kpi-num">${brl(income)}</div></div>
      <div class="kpi-box"><div class="kpi-title">Saídas</div><div class="kpi-num">${brl(expense)}</div></div>
      <div class="kpi-box"><div class="kpi-title">Saldo Líquido</div><div class="kpi-num">${brl(income - expense)}</div></div>
    </div>

    <div class="card">
      <div class="section-header">
        <div><h2>Movimentações Financeiras</h2><p>Lançamentos de receitas e despesas operacionais</p></div>
        <button type="button" class="btn-primary" onclick="openTxModal()">+ Novo Lançamento</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead>
          <tbody>
            ${txs
              .map(
                (t) => `
              <tr>
                <td>${escapeHtml(t.desc)}</td>
                <td>${escapeHtml(t.category || "Operacional")}</td>
                <td><span class="badge ${t.type === "entrada" ? "green" : "red"}">${t.type === "entrada" ? "Entrada" : "Saída"}</span></td>
                <td><strong>${brl(t.amount)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openTxModal = function () {
  openModal(
    "Novo Lançamento Financeiro",
    `
      <form id="txForm">
        <div class="form-group"><label>Descrição</label><input type="text" id="txDesc" required /></div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="txType">
            <option value="entrada">Entrada (Receita)</option>
            <option value="saida">Saída (Despesa)</option>
          </select>
        </div>
        <div class="form-group"><label>Valor (R$)</label><input type="number" step="0.01" id="txAmt" required /></div>
        <button type="submit" class="btn-primary full-btn">Registrar</button>
      </form>
    `
  );

  document.getElementById("txForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.transactions.unshift({
      id: Date.now(),
      desc: document.getElementById("txDesc").value.trim(),
      type: document.getElementById("txType").value,
      amount: Number(document.getElementById("txAmt").value),
      category: "Manual"
    });
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 9. PDV */
function renderPdv(el) {
  const totalCart = (state.pdvCart || []).reduce((sum, i) => sum + i.price * i.qty, 0);

  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="section-header">
          <div><h2>Cardápio Rápido PDV</h2><p>Clique para adicionar ao pedido</p></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;">
          ${(state.menu || [])
            .filter((m) => m.available)
            .map(
              (m) => `
              <button type="button" class="btn-sm" style="text-align:left;padding:10px;display:flex;flex-direction:column;gap:4px;" onclick="addToPdvCart(${m.id})">
                <strong>${escapeHtml(m.name)}</strong>
                <span style="color:var(--accent-orange);font-weight:700;">${brl(m.price)}</span>
              </button>
            `
            )
            .join("")}
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:10px;">Carrinho / Fechamento</h3>
        <div class="form-group"><label>Cliente</label><input type="text" id="pdvCustomer" value="Cliente Balcão" /></div>
        <div class="form-group">
          <label>Modalidade</label>
          <select id="pdvType">
            <option value="Balcão">Balcão</option>
            <option value="Delivery">Delivery Nilópolis</option>
            <option value="Mesa">Mesa</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pagamento</label>
          <select id="pdvPayment">
            <option value="Pix">Pix</option>
            <option value="Cartão">Cartão</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
        <div style="margin:12px 0;border-top:1px solid var(--border-color);padding-top:10px;">
          ${
            state.pdvCart.length === 0
              ? `<p style="color:var(--text-muted);font-size:0.84rem;">Nenhum item no carrinho.</p>`
              : state.pdvCart
                  .map(
                    (c, idx) => `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span>${c.qty}x ${escapeHtml(c.name)}</span>
                  <div>
                    <strong>${brl(c.price * c.qty)}</strong>
                    <button type="button" class="btn-sm danger" style="margin-left:6px;padding:2px 6px;" onclick="removeFromPdvCart(${idx})">✕</button>
                  </div>
                </div>
              `
                  )
                  .join("")
          }
        </div>
        <div style="font-size:1.15rem;font-weight:700;margin:12px 0;">Total: ${brl(totalCart)}</div>
        <button type="button" class="btn-primary full-btn" onclick="finalizePdvOrder()">Finalizar Pedido</button>
      </div>
    </div>
  `;
}

window.addToPdvCart = function (menuId) {
  const item = state.menu.find((m) => m.id === menuId);
  if (!item) return;
  const existing = state.pdvCart.find((c) => c.id === menuId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.pdvCart.push({ id: item.id, name: item.name, price: Number(item.price), qty: 1 });
  }
  persistState();
  renderWorkspace();
};

window.removeFromPdvCart = function (index) {
  state.pdvCart.splice(index, 1);
  persistState();
  renderWorkspace();
};

window.finalizePdvOrder = function () {
  if (state.pdvCart.length === 0) return;
  const total = state.pdvCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemsText = state.pdvCart.map((i) => `${i.qty}x ${i.name}`).join(", ");
  const customer = document.getElementById("pdvCustomer")?.value.trim() || "Cliente Balcão";
  const type = document.getElementById("pdvType")?.value || "Balcão";
  const payment = document.getElementById("pdvPayment")?.value || "Pix";

  const newOrder = {
    id: Math.floor(1000 + Math.random() * 9000),
    customer,
    type,
    address: type === "Delivery" ? "Nilópolis - RJ" : "Retirada no Balcão",
    items: itemsText,
    total,
    payment,
    status: "Recebido",
    courier: "Aguardando",
    createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };

  state.orders.unshift(newOrder);
  state.transactions.unshift({
    id: Date.now(),
    desc: `Pedido #${newOrder.id} (${customer})`,
    type: "entrada",
    amount: total,
    category: "Vendas PDV"
  });
  state.pdvCart = [];
  addNotification("Novo pedido lançado", `Pedido #${newOrder.id} de ${customer} no valor de ${brl(total)}.`);
  persistState();
  navigate("pedidos");
};

/* 10. ENTREGAS */
function renderEntregas(el) {
  const deliveries = (state.orders || []).filter((o) => o.type === "Delivery" || o.status === "Saiu para entrega");
  el.innerHTML = `
    <div class="card">
      <div class="section-header"><div><h2>Controle de Entregas — Nilópolis</h2><p>Acompanhamento de motoboys e pedidos em rota</p></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#Pedido</th><th>Cliente</th><th>Endereço</th><th>Entregador</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            ${
              deliveries.length === 0
                ? `<tr><td colspan="6" style="color:var(--text-muted);">Nenhuma entrega ativa no momento.</td></tr>`
                : deliveries
                    .map(
                      (d) => `
                  <tr>
                    <td><strong>#${d.id}</strong></td>
                    <td>${escapeHtml(d.customer)}</td>
                    <td>${escapeHtml(d.address)}</td>
                    <td>${escapeHtml(d.courier || "Carlos Motoboy")}</td>
                    <td><span class="badge blue">${escapeHtml(d.status)}</span></td>
                    <td><button type="button" class="btn-sm" onclick="advanceOrderStatus(${d.id})">Atualizar</button></td>
                  </tr>
                `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* 11. PROMOÇÕES */
function renderPromocoes(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div><h2>Promoções e Cupons</h2><p>Gerencie cupons de desconto para clientes de Nilópolis</p></div>
        <button type="button" class="btn-primary" onclick="openCouponModal()">+ Novo Cupom</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Código</th><th>Desconto</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            ${(state.coupons || [])
              .map(
                (c, i) => `
              <tr>
                <td><strong>${escapeHtml(c.code)}</strong></td>
                <td>${escapeHtml(c.discount)}</td>
                <td><span class="badge ${c.active ? "green" : "red"}">${c.active ? "Ativo" : "Inativo"}</span></td>
                <td><button type="button" class="btn-sm" onclick="toggleCoupon(${i})">Alternar</button></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.toggleCoupon = function (idx) {
  if (!state.coupons[idx]) return;
  state.coupons[idx].active = !state.coupons[idx].active;
  persistState();
  renderWorkspace();
};

window.openCouponModal = function () {
  openModal(
    "Criar Cupom Promocional",
    `
      <form id="couponForm">
        <div class="form-group"><label>Código</label><input type="text" id="cpCode" placeholder="BUNKER10" required /></div>
        <div class="form-group"><label>Benefício</label><input type="text" id="cpDisc" placeholder="10% OFF" required /></div>
        <button type="submit" class="btn-primary full-btn">Salvar Cupom</button>
      </form>
    `
  );
  document.getElementById("couponForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.coupons.unshift({
      code: document.getElementById("cpCode").value.trim().toUpperCase(),
      discount: document.getElementById("cpDisc").value.trim(),
      active: true
    });
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 12. AVALIAÇÕES */
function renderAvaliacoes(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header"><div><h2>Avaliações dos Clientes</h2><p>Feedbacks recentes da Bunker Burgers Nilópolis</p></div></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${(state.reviews || [])
          .map(
            (r) => `
          <div style="padding:12px;border:1px solid var(--border-color);border-radius:10px;">
            <div style="display:flex;justify-content:space-between;">
              <strong>${escapeHtml(r.customer)}</strong>
              <span>${"⭐".repeat(Number(r.rating || 5))}</span>
            </div>
            <p style="font-size:0.85rem;margin-top:4px;color:var(--text-muted);">${escapeHtml(r.comment)}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

/* 13. RELATÓRIOS */
function renderRelatorios(el) {
  renderVisaoGeral(el);
}

/* 14. NOTIFICAÇÕES */
function renderNotificacoes(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div><h2>Central de Notificações</h2><p>Alertas operacionais e aprovações de equipe</p></div>
        <button type="button" class="btn-sm" onclick="markAllNotificationsRead()">Marcar todas como lidas</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${
          (state.notifications || []).length === 0
            ? `<p style="color:var(--text-muted);">Nenhuma notificação no momento.</p>`
            : state.notifications
                .map(
                  (n) => `
              <div style="padding:10px 12px;border:1px solid var(--border-color);border-radius:10px;opacity:${n.read ? 0.65 : 1};">
                <strong>${escapeHtml(n.title)}</strong>
                <p style="font-size:0.82rem;color:var(--text-muted);">${escapeHtml(n.text || n.message || "")}</p>
              </div>
            `
                )
                .join("")
        }
      </div>
    </div>
  `;
}

window.markAllNotificationsRead = function () {
  (state.notifications || []).forEach((n) => {
    n.read = true;
  });
  updateNotifyBadges();
  persistState();
  renderWorkspace();
};

/* 15. PERMISSÕES */
function renderPermissoes(el) {
  const roles = ["Atendente", "Chapeiro", "Motoboy", "Gerente"];
  const modules = Object.keys(SECTION_META);

  el.innerHTML = `
    <div class="card">
      <div class="section-header"><div><h2>Matriz de Permissões por Cargo</h2><p>Defina quais módulos cada cargo pode acessar</p></div></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              ${roles.map((r) => `<th>${r}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${modules
              .map(
                (mod) => `
              <tr>
                <td>${SECTION_META[mod].title}</td>
                ${roles
                  .map((role) => {
                    const checked = (state.permissions?.[role] || []).includes(mod);
                    return `<td><input type="checkbox" ${checked ? "checked" : ""} ${role === "Gerente" ? "disabled" : ""} onchange="toggleRoleModule('${role}','${mod}',this.checked)" /></td>`;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.toggleRoleModule = function (role, mod, enabled) {
  if (!state.permissions[role]) state.permissions[role] = [];
  if (enabled && !state.permissions[role].includes(mod)) {
    state.permissions[role].push(mod);
  } else if (!enabled) {
    state.permissions[role] = state.permissions[role].filter((m) => m !== mod);
  }
  persistState();
};

/* 16. CONFIGURAÇÕES */
function renderConfiguracoes(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header"><div><h2>Configurações da Hamburgueria</h2><p>Dados gerais da Bunker Burgers Nilópolis</p></div></div>
      <form id="settingsForm" style="max-width:520px;">
        <div class="form-group"><label>Nome da Loja</label><input type="text" id="cfgName" value="${escapeHtml(state.shopName)}" required /></div>
        <div class="form-group"><label>Endereço</label><input type="text" id="cfgAddress" value="${escapeHtml(state.address)}" required /></div>
        <div class="form-group"><label>Código de Convite da Equipe</label><input type="text" id="cfgCode" value="${escapeHtml(state.shopCode)}" required /></div>
        <div class="form-group"><label>Meta Diária (R$)</label><input type="number" id="cfgGoal" value="${Number(state.dailyGoal || 1500)}" required /></div>
        <button type="submit" class="btn-primary">Salvar Configurações</button>
      </form>
    </div>
  `;

  document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.shopName = document.getElementById("cfgName").value.trim();
    state.address = document.getElementById("cfgAddress").value.trim();
    state.shopCode = document.getElementById("cfgCode").value.trim();
    state.dailyGoal = Number(document.getElementById("cfgGoal").value);
    persistState();
    addNotification("Configurações salvas", "Os dados da hamburgueria foram atualizados.");
    navigate("visao-geral");
  });
}

/* ABERTURA DO PAINEL E INICIALIZAÇÃO */
function enterApp(user) {
  if (user) {
    state.currentUser = user;
    persistState();
  }

  const publicScreen = document.getElementById("publicMenuScreen");
  const managerLogin = document.getElementById("portalGerenteLogin");
  const staffPortal = document.getElementById("portalFuncionario");
  const appShell = document.getElementById("appShell");

  if (publicScreen) publicScreen.hidden = true;
  if (managerLogin) managerLogin.hidden = true;
  if (staffPortal) staffPortal.hidden = true;
  if (appShell) appShell.hidden = false;

  applyRolePermissions();
  updateNotifyBadges();
  if (state.currentUser?.role === "GERENTE") {
    syncStaffFromBackend();
  }
  navigate(state.activeSection || "visao-geral");
}

window.enterApp = enterApp;
window.openDashboard = enterApp;
window.initApp = enterApp;

function bindAppEvents() {
  if (window.__BUNKER_APP_BOUND__) return;
  window.__BUNKER_APP_BOUND__ = true;

  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".nav-group");
      if (group && btn.dataset.hasSub === "true") {
        group.classList.toggle("open");
      }
      navigate(btn.dataset.section);
    });
  });

  document.querySelectorAll(".sub-link[data-section]").forEach((link) => {
    link.addEventListener("click", () => {
      if (link.dataset.theme) {
        document.body.dataset.theme = link.dataset.theme;
      }
      if (link.dataset.cat) {
        state.menuCategory = link.dataset.cat;
      }
      navigate(link.dataset.section);
    });
  });

  document.getElementById("toggleSidebarBtn")?.addEventListener("click", () => {
    document.getElementById("appShell")?.classList.toggle("sidebar-collapsed");
    document.getElementById("appShell")?.classList.toggle("mobile-open");
  });

  document.getElementById("closeSidebarBtn")?.addEventListener("click", () => {
    document.getElementById("appShell")?.classList.remove("mobile-open");
  });

  document.getElementById("globalSearch")?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderWorkspace();
  });

  document.getElementById("topbarNotifyBtn")?.addEventListener("click", () => {
    navigate("notificacoes");
  });

  document.getElementById("quickPdvBtn")?.addEventListener("click", () => {
    navigate("pdv");
  });

  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("appModal")?.addEventListener("click", (e) => {
    if (e.target.id === "appModal") closeModal();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    state.currentUser = null;
    persistState();
    if (window.BunkerAuth && typeof window.BunkerAuth.logout === "function") {
      await window.BunkerAuth.logout();
      return;
    }
    const appShell = document.getElementById("appShell");
    const managerLogin = document.getElementById("portalGerenteLogin");
    if (appShell) appShell.hidden = true;
    if (managerLogin) managerLogin.hidden = false;
    window.location.hash = "#/gerente/login";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindAppEvents();
});