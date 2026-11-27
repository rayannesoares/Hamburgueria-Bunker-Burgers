const STORAGE_STATE_KEY = "bunker_burgers_nilopolis_full_v1";
const STAFF_PORTAL_STORAGE_KEY = "bunker_burgers_staff_v1";

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

function getUserAvatarIcon(user) {
  const role = String(user?.role || "").toUpperCase();
  const title = String(user?.roleTitle || "").toLowerCase();

  if (role === "GERENTE" || title.includes("gerente")) return "👔";
  if (title.includes("chapeiro") || title.includes("cozinha")) return "👨‍🍳";
  if (title.includes("motoboy") || title.includes("entregador")) return "🛵";
  if (title.includes("atendente") || title.includes("caixa")) return "🧑‍💼";
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

/* 5. FUNCIONÁRIOS */
function normalizeStaffStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APROVADO") return "Aprovado";
  if (s === "PENDENTE") return "Pendente";
  if (s === "RECUSADO") return "Recusado";
  if (s === "BLOQUEADO") return "Bloqueado";
  return status || "Pendente";
}

function toBackendStaffStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APROVADO") return "APROVADO";
  if (s === "PENDENTE") return "PENDENTE";
  if (s === "RECUSADO") return "RECUSADO";
  if (s === "BLOQUEADO") return "BLOQUEADO";
  return "PENDENTE";
}

function readPortalStaffStorage() {
  try {
    const raw = localStorage.getItem(STAFF_PORTAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePortalStaffStorage(list) {
  try {
    localStorage.setItem(STAFF_PORTAL_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function mergePortalStaffIntoState() {
  const portalList = readPortalStaffStorage();
  if (!Array.isArray(state.staff)) state.staff = [];

  portalList.forEach((p, idx) => {
    const emailLower = String(p.email || "").trim().toLowerCase();
    const existingIdx = state.staff.findIndex(
      (s) =>
        (s.email && String(s.email).trim().toLowerCase() === emailLower) ||
        (p.id && String(s.id) === String(p.id))
    );

    const mapped = {
      id: p.id || (existingIdx >= 0 ? state.staff[existingIdx].id : Date.now() + idx + 10),
      name: p.name || "Funcionário",
      email: p.email || "",
      phone: p.phone || "",
      role: p.roleTitle || p.role || "Atendente / Caixa",
      shift: normalizeStaffStatus(p.status) === "Pendente" ? "Aguardando aprovação" : "18:00 - 00:00",
      status: normalizeStaffStatus(p.status),
      permissions:
        existingIdx >= 0 && Array.isArray(state.staff[existingIdx].permissions)
          ? state.staff[existingIdx].permissions
          : []
    };

    if (existingIdx >= 0) {
      state.staff[existingIdx] = {
        ...state.staff[existingIdx],
        ...mapped,
        status: mapped.status
      };
    } else {
      state.staff.unshift(mapped);
    }
  });
}

function syncStaffStateToPortalStorage() {
  const currentPortal = readPortalStaffStorage();
  const updatedPortal = (state.staff || []).map((s) => {
    const prev = currentPortal.find(
      (p) =>
        (s.email && String(p.email || "").toLowerCase() === String(s.email).toLowerCase()) ||
        String(p.id) === String(s.id)
    );
    return {
      id: s.id,
      name: s.name,
      phone: s.phone || prev?.phone || "",
      roleTitle: s.role,
      email: s.email || prev?.email || "",
      status: toBackendStaffStatus(s.status),
      createdAt: prev?.createdAt || new Date().toISOString()
    };
  });
  writePortalStaffStorage(updatedPortal);
}

function syncStaffFromStorage() {
  mergePortalStaffIntoState();
  persistState();
  if (state.activeSection === "funcionarios") {
    const container = document.getElementById("workspace");
    if (container) renderFuncionariosTable(container);
  }
}

function renderFuncionariosTable(el) {
  mergePortalStaffIntoState();
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
          <button type="button" class="btn-sm" onclick="syncStaffFromStorage()">Atualizar Lista</button>
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
  mergePortalStaffIntoState();
  renderFuncionariosTable(el);
}

window.syncStaffFromStorage = syncStaffFromStorage;
window.syncStaffFromBackend = syncStaffFromStorage;

window.deleteStaffUser = function (id) {
  const person = (state.staff || []).find((s) => s.id === id);
  if (!person) return;

  state.staff = (state.staff || []).filter((s) => s.id !== id);
  syncStaffStateToPortalStorage();
  addNotification("Funcionário excluído", `${person.name} teve o acesso apagado do sistema.`);
  persistState();
  renderWorkspace();
};

window.setStaffStatus = function (id, nextStatus) {
  const person = (state.staff || []).find((s) => s.id === id);
  if (!person) return;

  person.status = normalizeStaffStatus(nextStatus);
  if (person.status === "Aprovado" && (!person.shift || person.shift === "Aguardando aprovação")) {
    person.shift = "18:00 - 00:00";
  }

  syncStaffStateToPortalStorage();
  addNotification(
    `Funcionário ${person.status}`,
    `${person.name} (${person.role}) teve o status alterado para ${person.status}.`
  );
  persistState();
  renderWorkspace();
};

window.openStaffModal = function () {
  openModal(
    "Cadastrar Novo Funcionário",
    `
      <form id="newStaffForm">
        <div class="form-group">
          <label>Nome completo</label>
          <input type="text" id="nsName" required placeholder="Ex.: Lucas Almeida" />
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="nsEmail" required placeholder="lucas@bunkerburgers.com.br" />
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" id="nsPhone" placeholder="(21) 99999-0000" />
        </div>
        <div class="form-group">
          <label>Cargo</label>
          <select id="nsRole">
            <option value="Atendente / Caixa">Atendente / Caixa</option>
            <option value="Chapeiro / Cozinha">Chapeiro / Cozinha</option>
            <option value="Motoboy / Entregador">Motoboy / Entregador</option>
            <option value="Gerente">Gerente</option>
          </select>
        </div>
        <button type="submit" class="btn-primary full-btn">Salvar Funcionário</button>
      </form>
    `
  );

  document.getElementById("newStaffForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const role = document.getElementById("nsRole").value;
    state.staff.unshift({
      id: Date.now(),
      name: document.getElementById("nsName").value.trim(),
      email: document.getElementById("nsEmail").value.trim(),
      phone: document.getElementById("nsPhone").value.trim(),
      role,
      shift: "18:00 - 00:00",
      status: "Aprovado",
      permissions: state.permissions?.[role] || ["visao-geral", "pedidos", "cardapio", "pdv"]
    });
    syncStaffStateToPortalStorage();
    persistState();
    closeModal();
    renderWorkspace();
  });
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
          <label>Cargo</label>
          <input type="text" id="esRole" value="${escapeHtml(person.role)}" required />
        </div>
        <div class="form-group">
          <label>Turno</label>
          <input type="text" id="esShift" value="${escapeHtml(person.shift || "18:00 - 00:00")}" />
        </div>
        <div class="form-group">
          <label>Módulos liberados</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:170px;overflow:auto;padding:6px;border:1px solid var(--border);border-radius:8px;">
            ${allModules
              .map(
                (mod) => `
                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;margin:0;">
                  <input type="checkbox" name="esPerms" value="${mod}" ${currentPerms.includes(mod) ? "checked" : ""} />
                  ${escapeHtml(SECTION_META[mod].title)}
                </label>
              `
              )
              .join("")}
          </div>
        </div>
        <button type="submit" class="btn-primary full-btn">Salvar Alterações</button>
      </form>
    `
  );

  document.getElementById("editStaffForm").addEventListener("submit", (e) => {
    e.preventDefault();
    person.name = document.getElementById("esName").value.trim();
    person.role = document.getElementById("esRole").value.trim();
    person.shift = document.getElementById("esShift").value.trim();
    person.permissions = Array.from(
      document.querySelectorAll('input[name="esPerms"]:checked')
    ).map((cb) => cb.value);

    syncStaffStateToPortalStorage();
    persistState();
    closeModal();
    renderWorkspace();
  });
};

/* 6. COZINHA (KDS) */
function renderCozinha(el) {
  const activeOrders = (state.orders || []).filter(
    (o) => o.status === "Recebido" || o.status === "Em preparo" || o.status === "Pronto"
  );

  el.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Painel KDS — Cozinha e Chapa</h2>
        <p>${activeOrders.length} pedido(s) na fila de produção</p>
      </div>
      <button type="button" class="btn-primary" onclick="navigate('pedidos')">Ver Todos os Pedidos</button>
    </div>
    <div class="grid-3">
      ${
        activeOrders.length === 0
          ? `<div class="card"><p style="color:var(--text-muted);">Nenhum pedido na fila da cozinha agora.</p></div>`
          : activeOrders
              .map(
                (o) => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong>#${o.id} • ${escapeHtml(o.customer)}</strong>
              <span class="badge ${o.status === "Pronto" ? "green" : "orange"}">${escapeHtml(o.status)}</span>
            </div>
            <p style="font-size:0.88rem;margin-bottom:10px;">${escapeHtml(o.items)}</p>
            <small style="color:var(--text-muted);display:block;margin-bottom:10px;">${escapeHtml(o.type)} • ${escapeHtml(o.createdAt)}</small>
            <button type="button" class="btn-primary full-btn" onclick="advanceOrderStatus(${o.id})">Avançar Etapa</button>
          </div>
        `
              )
              .join("")
      }
    </div>
  `;
}

/* 7. ESTOQUE */
function renderEstoque(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Controle de Insumos e Estoque</h2>
          <p>Acompanhe quantidades mínimas e registre reposições</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Insumo</th><th>Atual</th><th>Mínimo</th><th>Status</th><th>Ação</th></tr>
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
                    <td><span class="badge ${low ? "red" : "green"}">${low ? "Baixo" : "OK"}</span></td>
                    <td><button type="button" class="btn-sm" onclick="restockItem(${item.id})">+10 ${escapeHtml(item.unit)}</button></td>
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

window.restockItem = function (id) {
  const item = (state.inventory || []).find((i) => i.id === id);
  if (!item) return;
  item.qty = Number(item.qty || 0) + 10;
  persistState();
  renderWorkspace();
};

/* 8. FINANCEIRO */
function renderFinanceiro(el) {
  const income = (state.transactions || [])
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const expense = (state.transactions || [])
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  el.innerHTML = `
    <div class="grid-3">
      <div class="kpi-box"><div class="kpi-title">Entradas</div><div class="kpi-num">${brl(income)}</div></div>
      <div class="kpi-box"><div class="kpi-title">Saídas</div><div class="kpi-num">${brl(expense)}</div></div>
      <div class="kpi-box"><div class="kpi-title">Saldo Líquido</div><div class="kpi-num">${brl(income - expense)}</div></div>
    </div>
    <div class="card">
      <h2>Movimentações Recentes</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
          <tbody>
            ${(state.transactions || [])
              .map(
                (t) => `
                <tr>
                  <td>${escapeHtml(t.date)}</td>
                  <td>${escapeHtml(t.desc)}</td>
                  <td><span class="badge ${t.type === "entrada" ? "green" : "red"}">${escapeHtml(t.type)}</span></td>
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

/* 9. PDV */
function renderPdv(el) {
  const available = (state.menu || []).filter((m) => m.available);
  const cartTotal = (state.pdvCart || []).reduce((acc, item) => acc + item.price * item.qty, 0);

  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h2>Produtos Disponíveis</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:12px;">
          ${available
            .map(
              (m) => `
              <div class="kpi-box" style="cursor:pointer;" onclick="addToPdvCart(${m.id})">
                <strong>${escapeHtml(m.name)}</strong>
                <div style="color:var(--accent);font-weight:700;margin-top:6px;">${brl(m.price)}</div>
                <small style="color:var(--text-muted);">+ Adicionar</small>
              </div>
            `
            )
            .join("")}
        </div>
      </div>

      <div class="card">
        <h2>Carrinho do Pedido</h2>
        <form id="pdvCheckoutForm" style="margin-top:12px;">
          <div class="form-group">
            <label>Cliente</label>
            <input type="text" id="pdvCustomer" required value="Cliente Balcão" />
          </div>
          <div class="form-group">
            <label>Canal</label>
            <select id="pdvType">
              <option value="Balcão">Balcão</option>
              <option value="Delivery">Delivery</option>
              <option value="Mesa">Mesa</option>
            </select>
          </div>
          <div class="form-group">
            <label>Pagamento</label>
            <select id="pdvPayment">
              <option value="Pix">Pix</option>
              <option value="Cartão Crédito">Cartão Crédito</option>
              <option value="Cartão Débito">Cartão Débito</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
          <div style="margin:12px 0;padding:10px;border:1px solid var(--border);border-radius:8px;">
            ${
              state.pdvCart.length === 0
                ? `<small style="color:var(--text-muted);">Selecione itens ao lado para lançar o pedido.</small>`
                : state.pdvCart
                    .map(
                      (c) => `
                      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.86rem;">
                        <span>${c.qty}x ${escapeHtml(c.name)}</span>
                        <strong>${brl(c.price * c.qty)}</strong>
                      </div>
                    `
                    )
                    .join("")
            }
            <hr style="margin:8px 0;border-color:var(--border);" />
            <div style="display:flex;justify-content:space-between;font-size:1rem;">
              <strong>Total</strong>
              <strong>${brl(cartTotal)}</strong>
            </div>
          </div>
          <button type="submit" class="btn-primary full-btn" ${state.pdvCart.length === 0 ? "disabled" : ""}>Finalizar Pedido</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("pdvCheckoutForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.pdvCart.length === 0) return;

    const total = state.pdvCart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const itemsSummary = state.pdvCart.map((i) => `${i.qty}x ${i.name}`).join(", ");
    const customer = document.getElementById("pdvCustomer").value.trim() || "Cliente Balcão";
    const type = document.getElementById("pdvType").value;
    const payment = document.getElementById("pdvPayment").value;

    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000),
      customer,
      type,
      address: type === "Delivery" ? "Centro, Nilópolis - RJ" : "Retirada na loja",
      items: itemsSummary,
      total,
      payment,
      status: "Recebido",
      createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    state.orders.unshift(newOrder);
    state.transactions.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString("pt-BR"),
      desc: `Pedido #${newOrder.id} (${customer})`,
      type: "entrada",
      amount: total
    });
    state.pdvCart = [];
    persistState();
    navigate("pedidos");
  });
}

window.addToPdvCart = function (menuId) {
  const item = (state.menu || []).find((m) => m.id === menuId);
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

/* 10. ENTREGAS */
function renderEntregas(el) {
  const deliveries = (state.orders || []).filter((o) => o.type === "Delivery");
  el.innerHTML = `
    <div class="card">
      <h2>Entregas em Nilópolis (${deliveries.length})</h2>
      <div class="table-wrap" style="margin-top:12px;">
        <table>
          <thead><tr><th>#Pedido</th><th>Cliente</th><th>Endereço</th><th>Entregador</th><th>Status</th></tr></thead>
          <tbody>
            ${
              deliveries.length === 0
                ? `<tr><td colspan="5" style="color:var(--text-muted);">Nenhuma entrega cadastrada.</td></tr>`
                : deliveries
                    .map(
                      (d) => `
                <tr>
                  <td>#${d.id}</td>
                  <td>${escapeHtml(d.customer)}</td>
                  <td>${escapeHtml(d.address)}</td>
                  <td>${escapeHtml(d.courier || "Carlos Motoboy")}</td>
                  <td><span class="badge orange">${escapeHtml(d.status)}</span></td>
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
      <h2>Cupons e Campanhas Ativas</h2>
      <div class="grid-3" style="margin-top:12px;">
        ${(state.coupons || [])
          .map(
            (c) => `
            <div class="kpi-box">
              <strong>${escapeHtml(c.code)}</strong>
              <div class="kpi-num">${escapeHtml(c.discount)}</div>
              <small style="color:var(--text-muted);">${escapeHtml(c.desc || "Válido em Nilópolis")}</small>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

/* 12. AVALIAÇÕES */
function renderAvaliacoes(el) {
  el.innerHTML = `
    <div class="card">
      <h2>Avaliações dos Clientes</h2>
      <div style="display:grid;gap:10px;margin-top:12px;">
        ${(state.reviews || [])
          .map(
            (r) => `
            <div class="kpi-box">
              <strong>${escapeHtml(r.customer)} • ${"⭐".repeat(Number(r.rating || 5))}</strong>
              <p style="font-size:0.86rem;margin-top:6px;">${escapeHtml(r.comment)}</p>
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
  const totalOrders = (state.orders || []).length + 24;
  const totalRevenue = (state.orders || []).reduce((acc, o) => acc + Number(o.total || 0), 0) + 722.5;
  el.innerHTML = `
    <div class="grid-3">
      <div class="kpi-box"><div class="kpi-title">Pedidos Totais</div><div class="kpi-num">${totalOrders}</div></div>
      <div class="kpi-box"><div class="kpi-title">Receita Acumulada</div><div class="kpi-num">${brl(totalRevenue)}</div></div>
      <div class="kpi-box"><div class="kpi-title">Ticket Médio</div><div class="kpi-num">${brl(totalRevenue / totalOrders)}</div></div>
    </div>
  `;
}

/* 14. NOTIFICAÇÕES */
function renderNotificacoes(el) {
  el.innerHTML = `
    <div class="card">
      <div class="section-header">
        <h2>Central de Notificações</h2>
        <button type="button" class="btn-sm" onclick="markAllNotificationsRead()">Marcar todas como lidas</button>
      </div>
      <div style="display:grid;gap:8px;margin-top:12px;">
        ${
          (state.notifications || []).length === 0
            ? `<p style="color:var(--text-muted);">Nenhuma notificação no momento.</p>`
            : state.notifications
                .map(
                  (n) => `
              <div class="kpi-box" style="opacity:${n.read ? 0.65 : 1};">
                <strong>${escapeHtml(n.title)}</strong>
                <p style="font-size:0.84rem;margin-top:4px;">${escapeHtml(n.text)}</p>
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
  const roles = Object.keys(state.permissions || {});
  el.innerHTML = `
    <div class="card">
      <h2>Permissões por Cargo</h2>
      <div class="grid-2" style="margin-top:12px;">
        ${roles
          .map(
            (role) => `
            <div class="kpi-box">
              <strong>${escapeHtml(role)}</strong>
              <p style="font-size:0.82rem;color:var(--text-muted);margin-top:6px;">
                ${(state.permissions[role] || []).length} módulos habilitados
              </p>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

/* 16. CONFIGURAÇÕES */
function renderConfiguracoes(el) {
  el.innerHTML = `
    <div class="card">
      <h2>Configurações da Hamburgueria</h2>
      <form id="shopSettingsForm" style="margin-top:12px;max-width:520px;">
        <div class="form-group">
          <label>Nome da unidade</label>
          <input type="text" id="cfgShopName" value="${escapeHtml(state.shopName)}" required />
        </div>
        <div class="form-group">
          <label>Código de convite da equipe</label>
          <input type="text" id="cfgShopCode" value="${escapeHtml(state.shopCode)}" required />
        </div>
        <div class="form-group">
          <label>Meta diária (R$)</label>
          <input type="number" id="cfgDailyGoal" value="${Number(state.dailyGoal || 1500)}" required />
        </div>
        <button type="submit" class="btn-primary">Salvar Configurações</button>
      </form>
    </div>
  `;

  document.getElementById("shopSettingsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.shopName = document.getElementById("cfgShopName").value.trim();
    state.shopCode = document.getElementById("cfgShopCode").value.trim();
    state.dailyGoal = Number(document.getElementById("cfgDailyGoal").value || 1500);
    persistState();
    navigate("configuracoes");
  });
}

/* INICIALIZAÇÃO GLOBAL */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.section);
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    window.BunkerAuth?.logout();
  });

  document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
    document.getElementById("appShell")?.classList.toggle("mobile-open");
  });

  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("appModal")?.addEventListener("click", (e) => {
    if (e.target.id === "appModal") closeModal();
  });

  document.getElementById("globalSearchInput")?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value || "";
    renderWorkspace();
  });

  document.getElementById("topbarNotifyBtn")?.addEventListener("click", () => {
    navigate("notificacoes");
  });

  updateNotifyBadges();

  if (window.BunkerAuth && typeof window.BunkerAuth.init === "function") {
    window.BunkerAuth.init((user) => {
      state.currentUser = user;
      mergePortalStaffIntoState();
      persistState();
      applyRolePermissions();
      navigate(state.activeSection || "visao-geral");
    });
  } else {
    applyRolePermissions();
    navigate("visao-geral");
  }
});
