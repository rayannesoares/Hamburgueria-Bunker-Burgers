require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET || "bunker-burgers-nilopolis-secret-change-in-prod";
const STAFF_INVITE_CODE = process.env.STAFF_INVITE_CODE || "BUNKER2026";
const DATABASE_URL = process.env.DATABASE_URL;
const MANAGER_EMAIL = "gerente@bunkerburgers.com";
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "976874462aA";

if (!DATABASE_URL) {
  console.error("Erro: DATABASE_URL não encontrada no arquivo server/.env");
  process.exit(1);
}

const isLocalDb =
  DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

const ALL_PERMISSIONS = [
  "visao-geral",
  "pedidos",
  "cardapio",
  "clientes",
  "funcionarios",
  "cozinha",
  "estoque",
  "financeiro",
  "pdv",
  "entregas",
  "promocoes",
  "avaliacoes",
  "relatorios",
  "notificacoes",
  "permissoes",
  "configuracoes",
];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Serve os arquivos estáticos do frontend (raiz do projeto)
const frontendDir = path.join(__dirname, "..");
app.use(express.static(frontendDir));

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers.cookie || "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find(
      (part) =>
        part.startsWith("bunker_token=") ||
        part.startsWith("token=") ||
        part.startsWith("auth_token=")
    );

  if (cookieMatch) {
    return decodeURIComponent(cookieMatch.split("=").slice(1).join("="));
  }

  return null;
}

function setAuthCookie(res, token) {
  res.cookie("bunker_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      roleTitle: user.role_title,
      permissions: user.permissions || [],
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleTitle: user.role_title,
    status: user.status,
    permissions: user.permissions || [],
  };
}

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'FUNCIONARIO',
        role_title TEXT NOT NULL DEFAULT 'Funcionário',
        status TEXT NOT NULL DEFAULT 'PENDENTE',
        password_hash TEXT NOT NULL,
        permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Lanches',
        price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'un',
        min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NOVO',
        total NUMERIC(10, 2) NOT NULL DEFAULT 0,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const managerPasswordHash = await bcrypt.hash(MANAGER_PASSWORD, 12);

    await client.query(
      `
      INSERT INTO users (name, email, phone, role, role_title, status, password_hash, permissions)
      VALUES ($1, $2, $3, 'GERENTE', 'Gerente', 'APROVADO', $4, $5::jsonb)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          status = 'APROVADO',
          role = 'GERENTE',
          role_title = 'Gerente',
          permissions = EXCLUDED.permissions;
      `,
      [
        "Gerente Bunker",
        MANAGER_EMAIL,
        "(21) 99999-0000",
        managerPasswordHash,
        JSON.stringify(ALL_PERMISSIONS),
      ]
    );

    console.log("Banco de dados conectado e tabelas verificadas com sucesso.");
  } finally {
    client.release();
  }
}

function authMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res
      .status(401)
      .json({ error: "Token não fornecido.", message: "Token não fornecido." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({
      error: "Token inválido ou expirado.",
      message: "Token inválido ou expirado.",
    });
  }
}

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== "GERENTE") {
    return res.status(403).json({
      error: "Acesso permitido apenas para gerente.",
      message: "Acesso permitido apenas para gerente.",
    });
  }
  return next();
}

async function handleLogin(req, res, onlyManager = false) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "Informe e-mail e senha.",
        message: "Informe e-mail e senha.",
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, phone, role, role_title, status, password_hash, permissions FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({
        error: "E-mail ou senha inválidos.",
        message: "E-mail ou senha inválidos.",
      });
    }

    if (onlyManager && user.role !== "GERENTE") {
      return res.status(403).json({
        error: "Acesso exclusivo para contas de gerente.",
        message: "Acesso exclusivo para contas de gerente.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: "E-mail ou senha inválidos.",
        message: "E-mail ou senha inválidos.",
      });
    }

    if (user.status !== "APROVADO") {
      return res.status(403).json({
        status: user.status,
        error: "Seu cadastro ainda está pendente de aprovação pelo gerente.",
        message: "Seu cadastro ainda está pendente de aprovação pelo gerente.",
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({
      error: "Erro interno ao fazer login.",
      message: "Erro interno ao fazer login.",
    });
  }
}

async function handleStaffRegister(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");
    const inviteCode = String(req.body.inviteCode || "").trim();
    const roleTitle =
      String(req.body.roleTitle || "Funcionário").trim() || "Funcionário";

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Preencha nome, e-mail e senha.",
        message: "Preencha nome, e-mail e senha.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres.",
        message: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    if (inviteCode !== STAFF_INVITE_CODE) {
      return res.status(400).json({
        error: "Código de convite inválido.",
        message: "Código de convite inválido.",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Este e-mail já está cadastrado.",
        message: "Este e-mail já está cadastrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await pool.query(
      `
      INSERT INTO users (name, email, phone, role, role_title, status, password_hash, permissions)
      VALUES ($1, $2, $3, 'FUNCIONARIO', $4, 'PENDENTE', $5, '["visao-geral","pedidos","cozinha"]'::jsonb)
      RETURNING id, name, email, phone, role, role_title, status, permissions, created_at
      `,
      [name, email, phone, roleTitle, passwordHash]
    );

    await pool.query(
      "INSERT INTO notifications (title, message) VALUES ($1, $2)",
      [
        "Novo funcionário aguardando aprovação",
        `${name} (${email}) solicitou acesso ao sistema.`,
      ]
    );

    return res.status(201).json({
      message: "Cadastro enviado! Aguarde a aprovação do gerente.",
      user: created.rows[0],
    });
  } catch (err) {
    console.error("Erro no cadastro de funcionário:", err);
    return res.status(500).json({
      error: "Erro interno ao cadastrar funcionário.",
      message: "Erro interno ao cadastrar funcionário.",
    });
  }
}

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error("Erro no /api/health:", err);
    res.status(500).json({ ok: false, error: "Falha ao conectar no banco." });
  }
});

// Rotas de autenticação
app.post("/api/auth/login", (req, res) => handleLogin(req, res, false));
app.post("/api/auth/gerente/login", (req, res) => handleLogin(req, res, true));
app.post("/api/auth/funcionario/login", (req, res) => handleLogin(req, res, false));
app.post("/api/auth/register", handleStaffRegister);
app.post("/api/auth/funcionario/cadastro", handleStaffRegister);

app.get("/api/auth/funcionario/status", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        status: "DESCONHECIDO",
        message: "E-mail não informado.",
      });
    }

    const result = await pool.query(
      "SELECT status FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        status: "NAO_ENCONTRADO",
        message: "Cadastro não encontrado.",
      });
    }

    return res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error("Erro ao consultar status do funcionário:", err);
    return res.status(500).json({
      status: "ERRO",
      message: "Erro ao consultar status.",
    });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, role_title, status, permissions, created_at FROM users WHERE id = $1 LIMIT 1",
      [req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    return res.json({ user: formatUserResponse(result.rows[0]) });
  } catch (err) {
    console.error("Erro no /api/auth/me:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

app.get("/api/auth/sessao", async (req, res) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      "SELECT id, name, email, phone, role, role_title, status, permissions, created_at FROM users WHERE id = $1 LIMIT 1",
      [decoded.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: formatUserResponse(user),
    });
  } catch (_err) {
    return res.status(200).json({ authenticated: false, user: null });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("bunker_token");
  return res.json({ ok: true });
});

// Gerente: listar usuários/funcionários
app.get("/api/users", authMiddleware, requireManager, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, role_title, status, permissions, created_at FROM users ORDER BY id DESC"
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Erro no GET /api/users:", err);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// Gerente: aprovar ou atualizar status/permissões de funcionário
app.patch("/api/users/:id", authMiddleware, requireManager, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const currentRes = await pool.query(
      "SELECT * FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const current = currentRes.rows[0];
    if (!current) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const status = req.body.status
      ? String(req.body.status).toUpperCase()
      : current.status;
    const roleTitle = req.body.roleTitle
      ? String(req.body.roleTitle).trim()
      : current.role_title;
    const permissions = Array.isArray(req.body.permissions)
      ? req.body.permissions
      : current.permissions;

    const updated = await pool.query(
      `
      UPDATE users
      SET status = $1,
          role_title = $2,
          permissions = $3::jsonb
      WHERE id = $4
      RETURNING id, name, email, phone, role, role_title, status, permissions, created_at
      `,
      [status, roleTitle, JSON.stringify(permissions), userId]
    );

    res.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("Erro no PATCH /api/users/:id:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
});

// Gerente: excluir definitivamente conta de funcionário
app.delete("/api/users/:id", authMiddleware, requireManager, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID inválido." });
    }

    if (Number(req.user.id) === userId) {
      return res
        .status(400)
        .json({ error: "Não é possível excluir a própria conta do gerente." });
    }

    const deleted = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email",
      [userId]
    );

    if (!deleted.rows[0]) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json({ ok: true, deleted: deleted.rows[0] });
  } catch (err) {
    console.error("Erro no DELETE /api/users/:id:", err);
    return res.status(500).json({ error: "Erro ao excluir usuário." });
  }
});

// Notificações
app.get("/api/notifications", authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY id DESC LIMIT 50"
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Erro no GET /api/notifications:", err);
    res.status(500).json({ error: "Erro ao buscar notificações." });
  }
});

// Cardápio
app.get("/api/menu", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu_items ORDER BY id DESC");
    res.json({ items: result.rows });
  } catch (err) {
    console.error("Erro no GET /api/menu:", err);
    res.status(500).json({ error: "Erro ao buscar cardápio." });
  }
});

app.post("/api/menu", authMiddleware, requireManager, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "Lanches").trim();
    const price = Number(req.body.price);
    const available =
      req.body.available !== undefined ? Boolean(req.body.available) : true;

    if (!name || Number.isNaN(price) || price < 0) {
      return res
        .status(400)
        .json({ error: "Nome e preço válido são obrigatórios." });
    }

    const result = await pool.query(
      "INSERT INTO menu_items (name, category, price, available) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, category, price, available]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error("Erro no POST /api/menu:", err);
    res.status(500).json({ error: "Erro ao criar item no cardápio." });
  }
});

// Estoque
app.get("/api/inventory", authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory_items ORDER BY id DESC"
    );
    res.json({ items: result.rows });
  } catch (err) {
    console.error("Erro no GET /api/inventory:", err);
    res.status(500).json({ error: "Erro ao buscar estoque." });
  }
});

// Pedidos
app.get("/api/orders", authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json({ orders: result.rows });
  } catch (err) {
    console.error("Erro no GET /api/orders:", err);
    res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
});

// Fallback para rotas HTML do frontend
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Rota não encontrada." });
  }
  return res.sendFile(path.join(frontendDir, "index.html"));
});

// Tratamento global de erros
app.use((err, _req, res, _next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Falha ao inicializar o banco de dados:", err);
    process.exit(1);
  });