window.BUNKER_DATA = {
  shopName: "Bunker Burgers Nilópolis",
  shopCode: "BUNKER2026",
  address: "Centro, Nilópolis - RJ",
  phone: "(21) 99999-0000",
  dailyGoal: 1500,
  cashRegisterOpen: true,
  cashOpeningAmount: 250.0,

  currentUser: {
    name: "Gerente Bunker",
    role: "Gerente",
    email: "gerente@bunkerburgers.com"
  },

  menu: [
    {
      id: 1,
      name: "Bunker Smash Duplo Bacon",
      category: "burgers",
      price: 34.9,
      desc: "Pão brioche, 2 blends 120g, cheddar duplo, bacon crocante e molho Bunker.",
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=450&q=75",
      available: true
    },
    {
      id: 2,
      name: "Cheddar Melt & Cebola Crispy",
      category: "burgers",
      price: 31.9,
      desc: "Blend artesanal 150g, creme cheddar derretido, cebola crispy e barbecue.",
      img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=450&q=75",
      available: true
    },
    {
      id: 3,
      name: "Combo Bunker Nilópolis",
      category: "combos",
      price: 46.9,
      desc: "Bunker Smash Duplo + Batata Rústica com Alho + Refrigerante lata.",
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=450&q=75",
      available: true
    },
    {
      id: 4,
      name: "Batata Rústica Bunker",
      category: "acompanhamentos",
      price: 18.5,
      desc: "Batata rústica crocante com manteiga de alho, páprica e alecrim.",
      img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=450&q=75",
      available: true
    },
    {
      id: 5,
      name: "Limonada Suíça com Hortelã",
      category: "bebidas",
      price: 12.0,
      desc: "Limão taiti batido na hora com hortelã fresca.",
      img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=450&q=75",
      available: true
    }
  ],

  orders: [
    {
      id: 1024,
      customer: "Lucas Andrade",
      phone: "(21) 98811-2233",
      address: "Centro, Nilópolis - RJ",
      type: "Delivery",
      items: "2x Bunker Smash Duplo Bacon, 1x Batata Rústica",
      total: 88.3,
      payment: "PIX",
      status: "Em preparo",
      courier: "Carlos Motoboy",
      createdAt: "19:12"
    },
    {
      id: 1025,
      customer: "Camila Souza",
      phone: "(21) 97744-5566",
      address: "Olinda, Nilópolis - RJ",
      type: "Delivery",
      items: "1x Combo Bunker Nilópolis",
      total: 46.9,
      payment: "Cartão",
      status: "Recebido",
      courier: "Aguardando",
      createdAt: "19:21"
    },
    {
      id: 1026,
      customer: "Mesa 04 (Salão)",
      phone: "-",
      address: "Salão Principal",
      type: "Mesa",
      items: "2x Cheddar Melt & Cebola Crispy, 2x Limonada Suíça",
      total: 87.8,
      payment: "Crédito",
      status: "Pronto",
      courier: "Balcão",
      createdAt: "19:05"
    }
  ],

  customers: [
    { id: 1, name: "Lucas Andrade", neighborhood: "Centro, Nilópolis", orders: 14, totalSpent: 742.5, favorite: "Bunker Smash Duplo" },
    { id: 2, name: "Camila Souza", neighborhood: "Olinda, Nilópolis", orders: 9, totalSpent: 438.9, favorite: "Combo Bunker Nilópolis" },
    { id: 3, name: "Marcos Vinícius", neighborhood: "Cabral, Nilópolis", orders: 6, totalSpent: 295.0, favorite: "Cheddar Melt" }
  ],

  staff: [
    { id: 1, name: "Gerente Bunker", role: "Gerente", status: "Aprovado", shift: "17:00 - 00:00" },
    { id: 2, name: "João Pedro", role: "Chapeiro", status: "Aprovado", shift: "18:00 - 00:00" },
    { id: 3, name: "Mariana Costa", role: "Atendente", status: "Aprovado", shift: "17:30 - 23:30" },
    { id: 4, name: "Carlos Motoboy", role: "Motoboy", status: "Aprovado", shift: "18:30 - 00:00" },
    { id: 5, name: "Rafael Lima", role: "Chapeiro", status: "Pendente", shift: "Aguardando aprovação" }
  ],

  inventory: [
    { id: 1, name: "Pão Brioche Artesanal", qty: 85, min: 40, unit: "unid." },
    { id: 2, name: "Blend Bovino Smash 120g", qty: 110, min: 50, unit: "unid." },
    { id: 3, name: "Queijo Cheddar Fatiado", qty: 28, min: 35, unit: "pct" },
    { id: 4, name: "Bacon Fatiado Defumado", qty: 14, min: 10, unit: "kg" },
    { id: 5, name: "Batata Rústica Congelada", qty: 32, min: 20, unit: "kg" }
  ],

  transactions: [
    { id: 1, desc: "Vendas Turno Noite (Pedidos #1024-#1026)", type: "Entrada", category: "Vendas", amount: 945.5, date: "25/11/2026" },
    { id: 2, desc: "Compra Hortifruti e Pães Nilópolis", type: "Saída", category: "Insumos", amount: 260.0, date: "25/11/2026" },
    { id: 3, desc: "Embalagens Kraft Personalizadas", type: "Saída", category: "Operacional", amount: 145.0, date: "24/11/2026" }
  ],

  coupons: [
    { id: 1, code: "BUNKER10", discount: "10% OFF", rule: "Pedidos acima de R$ 50,00", active: true },
    { id: 2, code: "NILOPOLISFREE", discount: "Entrega Grátis", rule: "Centro e Olinda", active: true },
    { id: 3, code: "QUARTASMASH", discount: "R$ 8,00 OFF", rule: "Combos às quartas-feiras", active: false }
  ],

  reviews: [
    { id: 1, customer: "Lucas Andrade", rating: 5, comment: "Melhor smash de Nilópolis! Chegou quente e bacon super crocante.", replied: true },
    { id: 2, customer: "Camila Souza", rating: 5, comment: "Combo muito bem servido, batata sequinha.", replied: false },
    { id: 3, customer: "Felipe Martins", rating: 4, comment: "Lanche excelente, só demorou 10 min a mais na sexta.", replied: false }
  ],

  notifications: [
    { id: 1, title: "Novo cadastro de funcionário", text: "Rafael Lima solicitou acesso como Chapeiro.", read: false },
    { id: 2, title: "Alerta de estoque baixo", text: "Queijo Cheddar Fatiado abaixo do mínimo (28 pct).", read: false },
    { id: 3, title: "Novo pedido #1025", text: "Camila Souza pediu 1x Combo Bunker Nilópolis.", read: false }
  ],

  permissions: {
    Gerente: ["visao-geral", "pedidos", "cardapio", "clientes", "funcionarios", "cozinha", "estoque", "financeiro", "pdv", "entregas", "promocoes", "avaliacoes", "relatorios", "notificacoes", "permissoes", "configuracoes"],
    Atendente: ["visao-geral", "pedidos", "cardapio", "clientes", "pdv", "entregas", "notificacoes"],
    Chapeiro: ["cozinha", "cardapio", "estoque", "notificacoes"],
    Motoboy: ["entregas", "pedidos", "notificacoes"]
  },

  monthlyStats: [
    { m: "Jan", inc: 78, exp: 42 },
    { m: "Fev", inc: 64, exp: 38 },
    { m: "Mar", inc: 82, exp: 45 },
    { m: "Abr", inc: 88, exp: 49 },
    { m: "Mai", inc: 76, exp: 40 },
    { m: "Jun", inc: 84, exp: 44 },
    { m: "Jul", inc: 72, exp: 39 },
    { m: "Ago", inc: 91, exp: 48 },
    { m: "Set", inc: 85, exp: 43 },
    { m: "Out", inc: 79, exp: 41 },
    { m: "Nov", inc: 94, exp: 46 },
    { m: "Dez", inc: 96, exp: 50 }
  ]
};