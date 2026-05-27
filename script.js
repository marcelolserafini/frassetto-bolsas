/**
 * Frassetto Bolsas - Premium Digital Showcase & Dashboard Controller
 * Security & Architecture Audit Refactoring (Production Grade)
 * Author: Antigravity AI (Senior Software Engineer)
 */

// ============================================================================
// 1. CONFIGURAÇÃO E PROTOCOLO DE SEGURANÇA DO FIREBASE
// ============================================================================

// IMPORTANTE: Em aplicações Single Page Application (SPA), a chave de API do Firebase
// é pública por design. A segurança NUNCA depende da ocultação destas chaves no frontend,
// mas sim de regras de acesso granulares e robustas no Firestore (Firestore Security Rules)
// e autenticação forte via Firebase Auth, além do App Check para evitar flood e bots.
const firebaseConfig = {
  apiKey: "AIzaSyBJwqvlOMiEQxVciRn533XZz9x5mbvmus8",
  authDomain: "frassetto-bolsas-f477b.firebaseapp.com",
  projectId: "frassetto-bolsas-f477b",
  storageBucket: "frassetto-bolsas-f477b.firebasestorage.app",
  messagingSenderId: "1076285530591",
  appId: "1:1076285530591:web:fe9785bd15135aa446a46a",
  measurementId: "G-008NF6S9J8"
};

let db = null;
let auth = null;
let isFirebaseActive = false;

try {
  firebase.initializeApp(firebaseConfig);
  
  // Ativação do Firebase App Check opcional para produção (comentar se testar localmente em localhost)
  /*
  const appCheck = firebase.appCheck();
  appCheck.activate(
    new firebase.appCheck.ReCaptchaV3Provider('6Ld-pZEqAAAAAGZJ1z4gW7u7V4sJp8XyqYt1J7nC'),
    true
  );
  */
  
  db = firebase.firestore();
  auth = firebase.auth();
  isFirebaseActive = true;
  console.log("Firebase conectado com sucesso!");
} catch (error) {
  console.error("Falha ao inicializar o Firebase. Rodando em modo de demonstração local estrita.", error);
}

// ============================================================================
// 2. COMPONENTE DE VALIDAÇÃO E SANITIZAÇÃO DE DADOS (ANTI-XSS & ANTI-INJECTION)
// ============================================================================

const SecurityUtils = {
  /**
   * Remove tags de script e caracteres perigosos para evitar ataques XSS
   */
  sanitizeString: function(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  /**
   * Escape básico para atributos HTML com segurança extra
   */
  escapeHTML: function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[^\w. ]/gi, function(c) {
      return '&#' + c.charCodeAt(0) + ';';
    });
  },

  /**
   * Valida e higieniza números de telefone
   */
  validateWhatsappPhone: function(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    // Verifica se possui formato válido (DDI + DDD + Número): ex: 5548999999999
    if (cleanPhone.length >= 11 && cleanPhone.length <= 14) {
      return cleanPhone;
    }
    return null;
  },

  /**
   * Validação rígida de URLs para imagens (apenas domínios conhecidos e seguros)
   */
  validateImageUrl: function(url) {
    if (typeof url !== 'string') return false;
    const securePattern = /^(https:\/\/images\.unsplash\.com\/|https:\/\/i\.ibb\.co\/)/;
    return securePattern.test(url);
  },

  /**
   * Validação completa de formulário de produtos
   */
  validateProduct: function(prod) {
    const errors = [];
    
    if (!prod.nome || typeof prod.nome !== 'string' || prod.nome.trim().length < 3 || prod.nome.length > 50) {
      errors.push("O nome do produto é obrigatório e deve ter entre 3 e 50 caracteres.");
    }
    if (!prod.descricao || typeof prod.descricao !== 'string' || prod.descricao.trim().length < 10 || prod.descricao.length > 150) {
      errors.push("A descrição deve ter entre 10 e 150 caracteres.");
    }
    if (isNaN(prod.preco) || prod.preco <= 0 || prod.preco > 50000) {
      errors.push("O preço deve ser um número positivo menor que R$ 50.000,00.");
    }
    if (isNaN(prod.custo) || prod.custo < 0 || prod.custo > prod.preco) {
      errors.push("O custo de fabricação deve ser positivo e não pode ser maior que o preço de venda.");
    }
    if (isNaN(prod.estoque) || prod.estoque < 0 || prod.estoque > 500) {
      errors.push("Estoque inválido (máximo 500 unidades).");
    }
    if (prod.imagens.length === 0 || !prod.imagens.every(this.validateImageUrl)) {
      errors.push("Apenas URLs seguras de imagens do Unsplash ou ImgBB são permitidas.");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Validação completa de depoimento
   */
  validateTestimonial: function(test) {
    const errors = [];
    if (!test.nome || test.nome.trim().length < 3 || test.nome.length > 40) {
      errors.push("Nome inválido (entre 3 e 40 caracteres).");
    }
    if (!test.cidade || test.cidade.trim().length < 4 || test.cidade.length > 30) {
      errors.push("Cidade / Estado inválido.");
    }
    if (isNaN(test.estrelas) || test.estrelas < 3 || test.estrelas > 5) {
      errors.push("Classificação deve ser entre 3 e 5 estrelas.");
    }
    if (!test.texto || test.texto.trim().length < 10 || test.texto.length > 300) {
      errors.push("O depoimento deve ter entre 10 e 300 caracteres.");
    }
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};

// ============================================================================
// 3. DADOS DE DEMONSTRAÇÃO E BANCO DE DADOS LOCAL (ESTADO FRAGILIZADO HIGIENIZADO)
// ============================================================================

const MOCK_PRODUCTS = [
  {
    id: "1",
    nome: "Bolsa Isadora Terracota",
    descricao: "Bolsa tiracolo estruturada em couro legítimo com textura floater e costura artesanal manual.",
    detalhes: "Produzida inteiramente em couro legítimo floater de alta durabilidade. Costura manual reforçada com linha encerada premium. Forro interno em camurça acobreado com bolso organizador. Metais nobres com banho triplo de verniz para proteção contra oxidação. Acompanha duas alças: uma de mão fixa e uma transversal regulável e removível.",
    preco: 589.00,
    custo: 185.00,
    estoque: 8,
    material: "Couro Legítimo Floater",
    imagens: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80"
    ],
    cores: ["Terracota", "Areia", "Nude"],
    destaque: true
  },
  {
    id: "2",
    nome: "Bolsa Sofia Verde Oliva",
    descricao: "Design minimalista e fluido, ideal para compor produções elegantes e atemporais.",
    detalhes: "Inspirada no minimalismo escandinavo, a Bolsa Sofia destaca-se pelo design fluido e contornos orgânicos. Produzida em couro napa premium ultra macio. Fechamento magnético invisível. Compartimento interno espaçoso com divisória e zíper YKK original. Alça de ombro confortável.",
    preco: 620.00,
    custo: 195.00,
    estoque: 5,
    material: "Couro Napa Premium",
    imagens: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc15a490?auto=format&fit=crop&w=800&q=80"
    ],
    cores: ["Verde Oliva", "Areia", "Preto"],
    destaque: true
  },
  {
    id: "3",
    nome: "Bolsa Celine Nude",
    descricao: "Silhueta clássica de boutique com acabamento em matelassê feito artesanalmente.",
    detalhes: "A Celine é a expressão máxima da elegância clássica. Acabamento primoroso em matelassê costurado individualmente. Couro macio com toque aveludado. Alça de corrente entrelaçada com couro, versátil para uso duplo (ombro ou transversal). Interior luxuoso forrado em cetim reforçado.",
    preco: 690.00,
    custo: 220.00,
    estoque: 3,
    material: "Couro Mestiço Aveludado",
    imagens: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    ],
    cores: ["Nude", "Preto", "Off-White"],
    destaque: true
  }
];

const MOCK_SALES = [
  {
    id: "s1",
    produtoId: "1",
    produtoNome: "Bolsa Isadora Terracota",
    valor: 589.00,
    custo: 185.00,
    lucro: 404.00,
    cliente: "Ana Carolina Santos",
    data: "2026-05-10"
  }
];

const MOCK_TESTIMONIALS = [
  {
    id: "t1",
    nome: "Gabriela M.",
    cidade: "São Paulo - SP",
    estrelas: 5,
    texto: "A qualidade do acabamento é simplesmente extraordinária. A bolsa Isadora superou todas as minhas expectativas de sofisticação."
  }
];

const DEFAULT_SETTINGS = {
  heroSubtitle: "Uma fusão harmoniosa de sofisticação moderna com a alma do artesanato clássico. Cada costura conta uma história de exclusividade, dedicação e paixão pelo design eterno.",
  heroProductId: "1",
  imgbbKey: "",
  whatsappPhone: "5548999999999",
  whatsappMessageTemplate: "Olá, Ateliê Frassetto! Gostaria de conversar sobre a linda bolsa artesanal *{nome}* ({preco}) que visualizei em sua vitrine digital premium."
};

// Estados mutáveis da aplicação
let products = [...MOCK_PRODUCTS];
let sales = [...MOCK_SALES];
let testimonials = [...MOCK_TESTIMONIALS];
let settings = { ...DEFAULT_SETTINGS };

// Controle de instâncias de gráficos do Chart.js
let salesChartInstance = null;
let shareChartInstance = null;

// ============================================================================
// 4. AUTENTICAÇÃO E ROTEAMENTO SEGURO (SPA SHIELD)
// ============================================================================

const AuthService = {
  /**
   * Monitora o estado de autenticação real do Firebase.
   * Não confia em localStorage ou variáves locais de permissão.
   */
  checkSession: function(callback) {
    if (!isFirebaseActive) {
      if (callback) callback(null);
      return;
    }
    auth.onAuthStateChanged((user) => {
      if (user) {
        if (callback) callback(user);
      } else {
        if (callback) callback(null);
      }
    });
  },

  /**
   * Logout seguro limpando referências em memória
   */
  logout: function() {
    if (isFirebaseActive) {
      auth.signOut().then(() => {
        window.location.hash = "#vitrine";
      });
    } else {
      window.location.hash = "#vitrine";
    }
  }
};

// ============================================================================
// 5. BANCO DE DADOS: SINCRONIZAÇÃO NUVEM E LOCALSTORAGE SEGURO
// ============================================================================

function saveToLocalStorage() {
  localStorage.setItem("frassetto_products", JSON.stringify(products));
  localStorage.setItem("frassetto_sales", JSON.stringify(sales));
  localStorage.setItem("frassetto_settings", JSON.stringify(settings));
  localStorage.setItem("frassetto_testimonials", JSON.stringify(testimonials));
}

async function syncWithFirebase() {
  if (!isFirebaseActive) return;
  try {
    // 1. Configurações
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (settingsDoc.exists) {
      settings = { ...DEFAULT_SETTINGS, ...settingsDoc.data() };
    } else {
      // Se não existir, tenta criar caso seja o admin principal autenticado
      if (auth.currentUser) {
        await db.collection("settings").doc("main").set(settings);
      }
    }

    // 2. Produtos
    const prodSnapshot = await db.collection("products").get();
    if (!prodSnapshot.empty) {
      products = [];
      prodSnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
    }

    // 3. Vendas (Apenas se o Admin estiver devidamente logado no Firebase)
    if (auth.currentUser) {
      const salesSnapshot = await db.collection("sales").get();
      if (!salesSnapshot.empty) {
        sales = [];
        salesSnapshot.forEach(doc => {
          sales.push({ id: doc.id, ...doc.data() });
        });
      }
    } else {
      sales = []; // Esvazia dados de faturamento na memória para não administradores
    }

    // 4. Depoimentos
    const testSnapshot = await db.collection("testimonials").get();
    if (!testSnapshot.empty) {
      testimonials = [];
      testSnapshot.forEach(doc => {
        testimonials.push({ id: doc.id, ...doc.data() });
      });
    }

    // Re-renderização dos componentes estáticos seguros
    renderVitrine();
    renderHero();
  } catch (error) {
    console.error("Restrição de segurança na sincronização (Firestore Rules bloqueou):", error.message);
  }
}

// ============================================================================
// 6. SPA ROTAS E PROTEÇÃO AVANÇADA DE INTERFACES (CLIENT SHIELD)
// ============================================================================

function handleRouting() {
  const hash = window.location.hash || "#vitrine";

  // Ocultar todas as views e links ativos
  document.querySelectorAll(".view-section").forEach(view => {
    view.classList.remove("active");
  });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (hash === "#vitrine" || hash === "") {
    const view = document.getElementById("vitrine-view");
    if (view) {
      view.classList.add("active");
      document.querySelector('[data-target="vitrine-view"]')?.classList.add("active");
      renderVitrine();
      renderHero();
    }
  } else if (hash.startsWith("#produto/")) {
    const productId = hash.split("/")[1];
    const view = document.getElementById("product-view");
    if (view) {
      view.classList.add("active");
      renderProductDetail(productId);
    }
  } else if (hash === "#admin") {
    // PROTEÇÃO ATIVA DE ROTAS (Bypass Preventer):
    // Nunca confia no status local. Sempre valida o estado real do Firebase Auth.
    AuthService.checkSession((user) => {
      if (!user) {
        // Exibe o painel de Login Restrito
        const loginView = document.getElementById("login-view");
        if (loginView) loginView.classList.add("active");
      } else {
        // Usuário é Admin legítimo: exibe o dashboard seguro
        const view = document.getElementById("admin-view");
        if (view) {
          view.classList.add("active");
          document.querySelector('[data-target="admin-view"]')?.classList.add("active");
          initAdminDashboard();
        }
      }
    });
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", () => {
  // Configura interceptação de rota inicial
  AuthService.checkSession((user) => {
    syncWithFirebase().then(() => {
      handleRouting();
    });
  });

  setupEventListeners();

  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
  });
});

// ============================================================================
// 7. COMPONENTES FRONTEND E RENDERIZAÇÃO 100% SEGURA (ANTI-XSS)
// ============================================================================

function renderVitrine() {
  const featuredContainer = document.getElementById("featured-products-container");
  const allContainer = document.getElementById("all-products-container");

  if (!featuredContainer || !allContainer) return;

  featuredContainer.innerHTML = "";
  allContainer.innerHTML = "";

  // 1. Calcular dinamicamente a quantidade de vendas por produto
  const salesCountMap = {};
  sales.forEach(sale => {
    // Agrupa por produtoId
    salesCountMap[sale.produtoId] = (salesCountMap[sale.produtoId] || 0) + 1;
  });

  // 2. Ordenar todos os produtos pela quantidade de vendas decrescente
  const sortedBySales = [...products].sort((a, b) => {
    const salesA = salesCountMap[a.id] || 0;
    const salesB = salesCountMap[b.id] || 0;
    return salesB - salesA; // Mais vendidos primeiro
  });

  // 3. Obter as 3 bolsas que mais venderam (se não houver vendas registradas, pega as 3 primeiras)
  const displayFeatured = sortedBySales.slice(0, 3);

  displayFeatured.forEach(p => {
    featuredContainer.appendChild(createProductCard(p, true));
  });

  products.forEach(p => {
    allContainer.appendChild(createProductCard(p, false));
  });

  renderTestimonials();
  setupScrollAnimations();
}

/**
   * Renderizador de Cards usando nós puros do DOM (createElement) 
   * evitando completamente falhas de injeção por XSS do innerHTML.
   */
function createProductCard(prod, isFeatured) {
  const card = document.createElement("div");
  card.className = "product-card";

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "product-image-wrapper";
  
  const img = document.createElement("img");
  img.src = SecurityUtils.validateImageUrl(prod.imagens[0]) ? prod.imagens[0] : "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80";
  img.alt = SecurityUtils.sanitizeString(prod.nome);
  img.setAttribute("loading", "lazy");
  imageWrapper.appendChild(img);

  if (isFeatured) {
    const badge = document.createElement("span");
    badge.className = "product-card-badge";
    badge.textContent = "Artesanal Premium";
    imageWrapper.appendChild(badge);
  }
  card.appendChild(imageWrapper);

  const info = document.createElement("div");
  info.className = "product-info";

  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = prod.nome;
  info.appendChild(name);

  const desc = document.createElement("p");
  desc.className = "product-description-short";
  desc.textContent = prod.descricao;
  info.appendChild(desc);

  const meta = document.createElement("div");
  meta.className = "product-meta";

  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = prod.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  meta.appendChild(price);

  const viewBtn = document.createElement("a");
  viewBtn.className = "product-view-btn";
  viewBtn.href = `#produto/${prod.id}`;
  viewBtn.textContent = "Ver Detalhes";
  meta.appendChild(viewBtn);

  info.appendChild(meta);
  card.appendChild(info);

  return card;
}

function renderProductDetail(productId) {
  const container = document.getElementById("product-detail-content");
  if (!container) return;

  const prod = products.find(p => p.id === productId);
  container.innerHTML = "";

  if (!prod) {
    const err = document.createElement("p");
    err.style.cssText = "grid-column: 1/-1; text-align: center; padding: 4rem 0;";
    err.textContent = "Produto não encontrado ou indisponível.";
    container.appendChild(err);
    return;
  }

  const gallery = document.createElement("div");
  gallery.className = "product-gallery";

  const mainFrame = document.createElement("div");
  mainFrame.className = "main-image-frame";
  const mainImg = document.createElement("img");
  mainImg.id = "detail-main-img";
  const firstImg = (prod.imagens && prod.imagens.length > 0) ? prod.imagens[0] : "";
  mainImg.src = SecurityUtils.validateImageUrl(firstImg) ? firstImg : "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80";
  mainImg.alt = prod.nome || "Produto";
  mainFrame.appendChild(mainImg);
  gallery.appendChild(mainFrame);

  const strip = document.createElement("div");
  strip.className = "thumbnails-strip";
  if (prod.imagens && Array.isArray(prod.imagens)) {
    prod.imagens.forEach((img, idx) => {
      const thumb = document.createElement("div");
      thumb.className = `thumb-image ${idx === 0 ? "active" : ""}`;
      thumb.addEventListener("click", function() {
        document.getElementById("detail-main-img").src = img;
        document.querySelectorAll(".thumb-image").forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      });
      const thumbImg = document.createElement("img");
      thumbImg.src = img;
      thumbImg.alt = "Miniatura";
      thumb.appendChild(thumbImg);
      strip.appendChild(thumb);
    });
  }
  gallery.appendChild(strip);
  container.appendChild(gallery);

  // Painel de informações
  const info = document.createElement("div");
  info.className = "product-detail-info";

  const back = document.createElement("a");
  back.className = "detail-back-btn";
  back.href = "#vitrine";
  back.innerHTML = `<i class="fas fa-arrow-left"></i> Voltar à vitrine`;
  info.appendChild(back);

  const title = document.createElement("h2");
  title.className = "detail-title";
  title.textContent = prod.nome || "Bolsa Artesanal";
  info.appendChild(title);

  const price = document.createElement("div");
  price.className = "detail-price";
  price.textContent = (prod.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  info.appendChild(price);

  const desc = document.createElement("p");
  desc.className = "detail-description";
  desc.textContent = prod.detalhes || prod.descricao || "Sem descrição disponível.";
  info.appendChild(desc);

  // Ficha técnica
  const spec = document.createElement("div");
  spec.className = "detail-spec-group";
  const specTitle = document.createElement("span");
  specTitle.className = "detail-spec-title";
  specTitle.textContent = "Ficha Técnica";
  spec.appendChild(specTitle);

  const list = document.createElement("ul");
  list.className = "spec-list";

  const liMaterial = document.createElement("li");
  liMaterial.innerHTML = `<span>Material Principal</span> <span>${SecurityUtils.sanitizeString(prod.material || "Couro Legítimo")}</span>`;
  list.appendChild(liMaterial);

  const liHand = document.createElement("li");
  liHand.innerHTML = `<span>Feito à Mão</span> <span>Sim (Produção Familiar Premium)</span>`;
  list.appendChild(liHand);

  const liStock = document.createElement("li");
  liStock.innerHTML = `<span>Disponibilidade</span> <span>${prod.estoque > 0 ? `Em Estoque (${prod.estoque} un)` : "Produção sob encomenda"}</span>`;
  list.appendChild(liStock);

  spec.appendChild(list);
  info.appendChild(spec);

  // Botão de compra seguro
  const actions = document.createElement("div");
  actions.className = "detail-actions";

  const phone = SecurityUtils.validateWhatsappPhone(settings.whatsappPhone) || "5548999999999";
  const rawMsg = (settings.whatsappMessageTemplate || DEFAULT_SETTINGS.whatsappMessageTemplate)
    .replace("{nome}", prod.nome || "Bolsa")
    .replace("{preco}", (prod.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  const cleanMsg = encodeURIComponent(rawMsg);

  const buyBtn = document.createElement("a");
  buyBtn.className = "btn-primary detail-whatsapp-btn";
  buyBtn.target = "_blank";
  buyBtn.href = `https://wa.me/${phone}?text=${cleanMsg}`;
  buyBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Chamar no WhatsApp para Encomenda`;
  actions.appendChild(buyBtn);
  info.appendChild(actions);

  container.appendChild(info);
}

function renderTestimonials() {
  const container = document.getElementById("testimonials-container");
  if (!container) return;

  container.innerHTML = "";

  if (testimonials.length === 0) {
    const empty = document.createElement("div");
    empty.className = "testimonial-card";
    empty.innerHTML = `<p class="testimonial-text">"Nenhum depoimento cadastrado no momento."</p>`;
    container.appendChild(empty);
    return;
  }

  testimonials.forEach(t => {
    const card = document.createElement("div");
    card.className = "testimonial-card";

    const stars = document.createElement("div");
    stars.className = "testimonial-stars";
    stars.innerHTML = '<i class="fas fa-star"></i>'.repeat(t.estrelas);
    card.appendChild(stars);

    const txt = document.createElement("p");
    txt.className = "testimonial-text";
    txt.textContent = `"${t.texto}"`;
    card.appendChild(txt);

    const author = document.createElement("span");
    author.className = "testimonial-author";
    author.textContent = `${t.nome} — ${t.cidade}`;
    card.appendChild(author);

    container.appendChild(card);
  });
}

// ============================================================================
// 8. PAINEL DE GESTÃO DO ADMINISTRADOR E COMPONENTES GRÁFICOS
// ============================================================================

function initAdminDashboard() {
  // Bloqueio extra: Verifica se a sessão é nula e redireciona agressivamente se bypassado
  if (isFirebaseActive && !auth.currentUser) {
    window.location.hash = "#vitrine";
    return;
  }
  renderKPIs();
  renderAdminProductsTable();
  renderAdminSalesTable();
  renderCharts();
  renderSettingsForm();
  renderAdminTestimonials();
}

function renderKPIs() {
  const totalVendas = sales.reduce((acc, sale) => acc + sale.valor, 0);
  const totalCustos = sales.reduce((acc, sale) => acc + sale.custo, 0);
  const lucroLiquido = totalVendas - totalCustos;
  const margemLucro = totalVendas > 0 ? (lucroLiquido / totalVendas) * 100 : 0;

  document.getElementById("kpi-total-vendas").textContent = totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  document.getElementById("kpi-total-custos").textContent = totalCustos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const lucroEl = document.getElementById("kpi-lucro-liquido");
  lucroEl.textContent = lucroLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const footerLucro = document.getElementById("kpi-lucro-footer");
  if (lucroLiquido >= 0) {
    lucroEl.style.color = "var(--text-primary)";
    footerLucro.className = "kpi-footer";
    footerLucro.innerHTML = `<i class="fas fa-wallet"></i> Ganhos Reais`;
  } else {
    lucroEl.style.color = "#C85353";
    footerLucro.className = "kpi-footer negative";
    footerLucro.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Operação com prejuízo`;
  }

  document.getElementById("kpi-margem-lucro").textContent = `${margemLucro.toFixed(1)}%`;
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("admin-products-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  products.forEach(p => {
    const tr = document.createElement("tr");

    let stockClass = "stock-ok";
    let stockLabel = `${p.estoque} un`;
    if (p.estoque === 0) {
      stockClass = "stock-empty";
      stockLabel = "Esgotado";
    } else if (p.estoque <= 2) {
      stockClass = "stock-low";
      stockLabel = `Baixo (${p.estoque})`;
    }

    const imgCell = document.createElement("td");
    const img = document.createElement("img");
    img.src = SecurityUtils.validateImageUrl(p.imagens[0]) ? p.imagens[0] : "";
    img.style.cssText = "width: 50px; height: 50px; object-fit: cover; border-radius: 8px;";
    imgCell.appendChild(img);
    tr.appendChild(imgCell);

    const nameCell = document.createElement("td");
    nameCell.style.fontWeight = "500";
    nameCell.textContent = p.nome;
    const materialSub = document.createElement("span");
    materialSub.style.cssText = "font-size: 0.75rem; color: var(--text-secondary); display: block;";
    materialSub.textContent = p.material || "Couro";
    nameCell.appendChild(materialSub);
    tr.appendChild(nameCell);

    const priceCell = document.createElement("td");
    priceCell.textContent = p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    tr.appendChild(priceCell);

    const costCell = document.createElement("td");
    costCell.textContent = p.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    tr.appendChild(costCell);

    const stockCell = document.createElement("td");
    const stockBadge = document.createElement("span");
    stockBadge.className = `stock-badge ${stockClass}`;
    stockBadge.textContent = stockLabel;
    stockCell.appendChild(stockBadge);
    tr.appendChild(stockCell);

    const actionCell = document.createElement("td");
    const wrapper = document.createElement("div");
    wrapper.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-icon";
    editBtn.innerHTML = `<i class="fas fa-edit"></i>`;
    editBtn.addEventListener("click", () => openProductProductModal(p.id));
    wrapper.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon delete";
    delBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`;
    delBtn.addEventListener("click", () => deleteProductAdmin(p.id));
    wrapper.appendChild(delBtn);

    actionCell.appendChild(wrapper);
    tr.appendChild(actionCell);

    tbody.appendChild(tr);
  });
}

function renderAdminSalesTable() {
  const tbody = document.getElementById("admin-sales-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const sortedSales = [...sales].sort((a, b) => new Date(b.data) - new Date(a.data));

  sortedSales.forEach(s => {
    const tr = document.createElement("tr");

    const dateFormatted = new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR");

    tr.innerHTML = `
      <td>${SecurityUtils.sanitizeString(dateFormatted)}</td>
      <td style="font-weight: 500;">${SecurityUtils.sanitizeString(s.cliente)}</td>
      <td>${SecurityUtils.sanitizeString(s.produtoNome)}</td>
      <td>${s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td>${s.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td style="color: ${s.lucro >= 0 ? "var(--color-olive)" : "#C85353"}; font-weight:600;">${s.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon delete" id="btn-revert-${s.id}"><i class="fas fa-undo"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    document.getElementById(`btn-revert-${s.id}`).addEventListener("click", () => deleteSaleAdmin(s.id));
  });
}

function deleteProductAdmin(id) {
  if (confirm("Tem certeza que deseja remover este produto da vitrine?")) {
    products = products.filter(p => p.id !== id);
    saveToLocalStorage();
    if (isFirebaseActive) {
      db.collection("products").doc(id).delete().catch(console.error);
    }
    initAdminDashboard();
  }
}

function deleteSaleAdmin(id) {
  if (confirm("Deseja estornar esta venda? O valor será removido dos relatórios financeiros.")) {
    const sale = sales.find(s => s.id === id);
    if (sale) {
      const prod = products.find(p => p.id === sale.produtoId);
      if (prod) {
        prod.estoque += 1;
        if (isFirebaseActive) {
          const { id: _, ...prodData } = prod;
          db.collection("products").doc(sale.produtoId).set(prodData).catch(console.error);
        }
      }
    }
    sales = sales.filter(s => s.id !== id);
    saveToLocalStorage();
    if (isFirebaseActive) {
      db.collection("sales").doc(id).delete().catch(console.error);
    }
    initAdminDashboard();
  }
}

function renderAdminTestimonials() {
  const container = document.getElementById("admin-testimonials-list");
  if (!container) return;

  container.innerHTML = "";

  if (testimonials.length === 0) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">Nenhum depoimento cadastrado.</p>`;
    return;
  }

  testimonials.forEach(t => {
    const item = document.createElement("div");
    item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: var(--bg-primary); border-radius: var(--border-radius-sm); border: 1px solid rgba(230, 220, 208, 0.5); margin-bottom: 0.5rem;";

    const detailWrapper = document.createElement("div");
    detailWrapper.style.cssText = "flex-grow: 1; padding-right: 1.5rem;";

    const header = document.createElement("div");
    header.style.cssText = "display: flex; gap: 8px; align-items: center; margin-bottom: 4px;";

    const name = document.createElement("strong");
    name.style.cssText = "font-size: 0.9rem; color: var(--text-primary);";
    name.textContent = t.nome;
    header.appendChild(name);

    const city = document.createElement("span");
    city.style.cssText = "font-size: 0.75rem; color: var(--text-secondary);";
    city.textContent = t.cidade;
    header.appendChild(city);

    const stars = document.createElement("span");
    stars.style.cssText = "color: var(--color-accent); font-size: 0.75rem;";
    stars.textContent = '★'.repeat(t.estrelas);
    header.appendChild(stars);
    
    detailWrapper.appendChild(header);

    const quote = document.createElement("p");
    quote.style.cssText = "font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;";
    quote.textContent = `"${t.texto}"`;
    detailWrapper.appendChild(quote);

    item.appendChild(detailWrapper);

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon delete";
    delBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`;
    delBtn.addEventListener("click", () => deleteTestimonialAdmin(t.id));
    item.appendChild(delBtn);

    container.appendChild(item);
  });
}

function deleteTestimonialAdmin(id) {
  if (confirm("Tem certeza que deseja remover este depoimento? Ele deixará de aparecer na vitrine.")) {
    testimonials = testimonials.filter(t => t.id !== id);
    saveToLocalStorage();
    if (isFirebaseActive) {
      db.collection("testimonials").doc(id).delete().catch(console.error);
    }
    renderAdminTestimonials();
    renderTestimonials();
  }
}

// ============================================================================
// 9. EVENT LISTENERS E PROCESSAMENTO DE SEGURANÇA DE FORMULÁRIOS
// ============================================================================

function setupEventListeners() {
  // Toggle menu mobile
  const menuToggle = document.getElementById("mobile-menu");
  const navMenu = document.getElementById("nav-menu");
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      menuToggle.classList.toggle("active");
    });
  }

  // Links de Rolagem (Scroll suave) na Home
  document.querySelectorAll(".scroll-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-scroll");
      const targetSection = document.getElementById(targetId);

      if (window.location.hash !== "#vitrine" && window.location.hash !== "") {
        window.location.hash = "#vitrine";
        setTimeout(() => {
          scrollSmoothlyTo(targetSection);
        }, 300);
      } else {
        scrollSmoothlyTo(targetSection);
      }
    });
  });

  function scrollSmoothlyTo(element) {
    if (!element) return;
    const targetPosition = element.offsetTop - 90;
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetPosition - startPosition;
    const duration = 1200;
    let start = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animationStep(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);

      window.scrollTo(0, startPosition + distance * easeOutCubic(percentage));

      if (progress < duration) {
        window.requestAnimationFrame(animationStep);
      }
    }

    window.requestAnimationFrame(animationStep);
  }

  // Alternância de Abas no Painel Administrativo (Tab Switching)
  document.querySelectorAll(".admin-menu-item[data-tab]").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".admin-menu-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const tabId = item.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(tab => {
        tab.classList.remove("active");
      });
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add("active");
      }

      if (tabId === "dashboard-tab") {
        renderCharts();
      }
    });
  });

  // Interceptador do Formulário de Autenticação com Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const pass = document.getElementById("login-password").value;
      const errorMsg = document.getElementById("login-error-msg");

      if (errorMsg) errorMsg.style.display = "none";

      if (!isFirebaseActive) {
        if (errorMsg) {
          errorMsg.textContent = "Erro: Servidor Firebase offline.";
          errorMsg.style.display = "block";
        }
        return;
      }

      auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
          const loginView = document.getElementById("login-view");
          if (loginView) loginView.classList.remove("active");
          handleRouting();
        })
        .catch((error) => {
          console.error("Erro na autenticação:", error.message);
          if (errorMsg) {
            errorMsg.textContent = "Erro: Credenciais inválidas para o portal administrativo.";
            errorMsg.style.display = "block";
          }
        });
    });
  }

  // Logout listener
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      AuthService.logout();
    });
  }

  // Envio de novo produto higienizado
  const prodForm = document.getElementById("product-form");
  if (prodForm) {
    prodForm.addEventListener("submit", handleProductFormSubmit);
  }

  // Envio de nova venda higienizada
  const saleForm = document.getElementById("sale-form");
  if (saleForm) {
    saleForm.addEventListener("submit", handleSaleFormSubmit);
  }

  // Envio de configurações higienizadas
  const configForm = document.getElementById("config-form");
  if (configForm) {
    configForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cleanSub = SecurityUtils.sanitizeString(document.getElementById("config-hero-subtitle").value);
      const cleanPhone = SecurityUtils.validateWhatsappPhone(document.getElementById("config-whatsapp-phone").value);
      const cleanTemplate = SecurityUtils.sanitizeString(document.getElementById("config-whatsapp-template").value);
      const cleanImgbb = SecurityUtils.sanitizeString(document.getElementById("config-imgbb-key").value);
      
      if (!cleanPhone) {
        alert("Erro: Formato de número do WhatsApp inválido!");
        return;
      }

      settings.heroSubtitle = cleanSub;
      settings.heroProductId = document.getElementById("config-hero-product").value;
      settings.whatsappPhone = cleanPhone;
      settings.whatsappMessageTemplate = cleanTemplate;
      settings.imgbbKey = cleanImgbb;

      saveToLocalStorage();
      renderHero();
      alert("Configurações atualizadas e protegidas com sucesso!");
    });
  }

  // Envio de depoimento higienizado
  const testForm = document.getElementById("testimonial-form");
  if (testForm) {
    testForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newTest = {
        nome: SecurityUtils.sanitizeString(document.getElementById("test-nome").value),
        cidade: SecurityUtils.sanitizeString(document.getElementById("test-cidade").value),
        estrelas: parseInt(document.getElementById("test-estrelas").value),
        texto: SecurityUtils.sanitizeString(document.getElementById("test-texto").value)
      };

      const validation = SecurityUtils.validateTestimonial(newTest);
      if (!validation.isValid) {
        alert("Erros de validação:\n" + validation.errors.join("\n"));
        return;
      }

      newTest.id = "t" + Date.now();

      testimonials.push(newTest);
      if (isFirebaseActive) {
        const { id: _, ...testData } = newTest;
        db.collection("testimonials").doc(newTest.id).set(testData).catch(console.error);
      }
      saveToLocalStorage();
      renderAdminTestimonials();
      testForm.reset();
      alert("Depoimento adicionado!");
    });
  }

  // Configuração das janelas modais simples
  document.getElementById("open-product-modal-btn")?.addEventListener("click", () => openProductProductModal());
  document.getElementById("close-product-modal")?.addEventListener("click", () => closeModal(document.getElementById("product-modal")));
  document.getElementById("cancel-product-btn")?.addEventListener("click", () => closeModal(document.getElementById("product-modal")));

  document.getElementById("open-sale-modal-btn")?.addEventListener("click", () => openSaleModal());
  document.getElementById("open-sale-modal-btn-alt")?.addEventListener("click", () => openSaleModal());
  document.getElementById("close-sale-modal")?.addEventListener("click", () => closeModal(document.getElementById("sale-modal")));
  document.getElementById("cancel-sale-btn")?.addEventListener("click", () => closeModal(document.getElementById("sale-modal")));
  
  // Crop Enquadramento do ImgBB seguro
  setupImgbbUploader();
}

function openModal(modal) {
  if (!modal) return;
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("active");
  setTimeout(() => modal.style.display = "none", 300);
}

function openProductProductModal(productId = null) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  const title = document.getElementById("product-modal-title");

  if (!modal || !form) return;
  form.reset();
  document.getElementById("form-product-id").value = "";

  if (productId) {
    title.textContent = "Editar Produto";
    const prod = products.find(p => p.id === productId);
    if (prod) {
      document.getElementById("form-product-id").value = prod.id;
      document.getElementById("prod-nome").value = prod.nome;
      document.getElementById("prod-descricao").value = prod.descricao;
      document.getElementById("prod-detalhes").value = prod.detalhes;
      document.getElementById("prod-preco").value = prod.preco;
      document.getElementById("prod-custo").value = prod.custo;
      document.getElementById("prod-estoque").value = prod.estoque;
      document.getElementById("prod-material").value = prod.material || "Couro Legítimo";
      document.getElementById("prod-imagem").value = prod.imagens.join(", ");
      document.getElementById("prod-cores").value = prod.cores.join(", ");
    }
  } else {
    title.textContent = "Novo Produto";
  }

  openModal(modal);
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("form-product-id").value;
  const rawImagens = document.getElementById("prod-imagem").value.split(",").map(url => url.trim()).filter(url => url !== "");

  const prod = {
    nome: SecurityUtils.sanitizeString(document.getElementById("prod-nome").value),
    descricao: SecurityUtils.sanitizeString(document.getElementById("prod-descricao").value),
    detalhes: SecurityUtils.sanitizeString(document.getElementById("prod-detalhes").value),
    preco: parseFloat(document.getElementById("prod-preco").value),
    custo: parseFloat(document.getElementById("prod-custo").value),
    estoque: parseInt(document.getElementById("prod-estoque").value),
    material: SecurityUtils.sanitizeString(document.getElementById("prod-material").value),
    imagens: rawImagens,
    cores: document.getElementById("prod-cores").value.split(",").map(c => SecurityUtils.sanitizeString(c.trim())).filter(c => c !== "")
  };

  const validation = SecurityUtils.validateProduct(prod);
  if (!validation.isValid) {
    alert("Falha na validação do produto:\n" + validation.errors.join("\n"));
    return;
  }

  if (id) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...prod };
      if (isFirebaseActive) {
        const { id: _, ...data } = products[index];
        db.collection("products").doc(id).set(data).catch(console.error);
      }
    }
  } else {
    const newId = (Math.max(...products.map(p => parseInt(p.id) || 0)) + 1).toString();
    const newProd = { id: newId, ...prod, destaque: false };
    products.push(newProd);
    if (isFirebaseActive) {
      const { id: _, ...data } = newProd;
      db.collection("products").doc(newId).set(data).catch(console.error);
    }
  }

  saveToLocalStorage();
  closeModal(document.getElementById("product-modal"));
  initAdminDashboard();
}

function openSaleModal() {
  const modal = document.getElementById("sale-modal");
  const select = document.getElementById("sale-produto");

  if (!modal || !select) return;
  document.getElementById("sale-form").reset();
  select.innerHTML = "";

  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
    select.appendChild(option);
  });

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("sale-data").value = today;

  select.addEventListener("change", () => {
    const selectedProd = products.find(p => p.id === select.value);
    if (selectedProd) {
      document.getElementById("sale-valor").value = selectedProd.preco;
    }
  });

  if (products.length > 0) {
    document.getElementById("sale-valor").value = products[0].preco;
  }

  openModal(modal);
}

function handleSaleFormSubmit(e) {
  e.preventDefault();

  const produtoId = document.getElementById("sale-produto").value;
  const selectedProd = products.find(p => p.id === produtoId);

  if (!selectedProd) {
    alert("Selecione um produto cadastrado.");
    return;
  }

  if (selectedProd.estoque <= 0) {
    alert("Erro: O estoque deste produto encontra-se esgotado!");
    return;
  }

  const cleanCliente = SecurityUtils.sanitizeString(document.getElementById("sale-cliente").value);
  const cleanData = SecurityUtils.sanitizeString(document.getElementById("sale-data").value);
  const valor = parseFloat(document.getElementById("sale-valor").value);
  const custo = selectedProd.custo;
  const lucro = valor - custo;

  const newSale = {
    id: "s" + Date.now(),
    produtoId,
    produtoNome: selectedProd.nome,
    valor,
    custo,
    lucro,
    cliente: cleanCliente,
    data: cleanData
  };

  selectedProd.estoque -= 1;
  sales.push(newSale);

  if (isFirebaseActive) {
    const { id: _, ...saleData } = newSale;
    db.collection("sales").doc(newSale.id).set(saleData).catch(console.error);

    const { id: __, ...prodData } = selectedProd;
    db.collection("products").doc(produtoId).set(prodData).catch(console.error);
  }

  saveToLocalStorage();
  closeModal(document.getElementById("sale-modal"));
  initAdminDashboard();
  alert("Venda adicionada e estoque atualizado!");
}

// ============================================================================
// 10. UPLOAD DE FOTOS SEGURO E ENQUADRAMENTO CROPPER.JS
// ============================================================================

function setupImgbbUploader() {
  const uploadInput = document.getElementById("prod-upload");
  const cropperModal = document.getElementById("cropper-modal");
  const cropperImage = document.getElementById("cropper-image");
  let activeCropper = null;

  if (!uploadInput || !cropperModal) return;

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById("upload-status");
    if (!settings.imgbbKey) {
      if (statusEl) {
        statusEl.textContent = "Erro: Cadastre a Chave ImgBB nas Configurações!";
        statusEl.style.color = "#C85353";
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = "Carregando visualizador de recortes...";
      statusEl.style.color = "var(--color-accent)";
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      cropperImage.src = event.target.result;
      openModal(cropperModal);

      if (activeCropper) activeCropper.destroy();

      setTimeout(() => {
        activeCropper = new Cropper(cropperImage, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.9,
          responsive: true
        });
      }, 150);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("confirm-crop-btn")?.addEventListener("click", () => {
    if (!activeCropper) return;

    const statusEl = document.getElementById("upload-status");
    if (statusEl) {
      statusEl.textContent = "Enviando arquivo recortado para o ImgBB...";
      statusEl.style.color = "var(--color-accent)";
    }

    const canvas = activeCropper.getCroppedCanvas({
      width: 800,
      height: 800
    });

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("image", blob, "img_enquadrada.jpg");

      closeModal(cropperModal);
      activeCropper.destroy();
      activeCropper = null;

      const cleanKey = SecurityUtils.sanitizeString(settings.imgbbKey);

      fetch(`https://api.imgbb.com/1/upload?key=${cleanKey}`, {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const imageUrl = data.data.url;
            const imageInput = document.getElementById("prod-imagem");

            if (imageInput.value.trim() === "") {
              imageInput.value = imageUrl;
            } else {
              imageInput.value += `, ${imageUrl}`;
            }

            if (statusEl) {
              statusEl.textContent = "Foto enviada com sucesso!";
              statusEl.style.color = "var(--color-olive)";
            }
          } else {
            throw new Error();
          }
        })
        .catch(() => {
          if (statusEl) {
            statusEl.textContent = "Erro ao enviar imagem ao ImgBB.";
            statusEl.style.color = "#C85353";
          }
        });
    });
  });

  const closeCropper = () => {
    closeModal(cropperModal);
    if (activeCropper) {
      activeCropper.destroy();
      activeCropper = null;
    }
  };

  document.getElementById("cancel-crop-btn")?.addEventListener("click", closeCropper);
  document.getElementById("close-cropper-modal")?.addEventListener("click", closeCropper);
}

// ============================================================================
// 11. RENDERIZAÇÃO LUXUOSA DA HERO E ANIMAÇÕES
// ============================================================================

function renderHero() {
  const subtitleEl = document.getElementById("hero-subtitle");
  const imageEl = document.getElementById("hero-image");
  const titleEl = document.getElementById("hero-badge-title");
  const descEl = document.getElementById("hero-badge-desc");
  const linkEl = document.getElementById("hero-image-link");

  if (!subtitleEl) return;

  subtitleEl.textContent = settings.heroSubtitle;

  const featuredProduct = products.find(p => p.id === settings.heroProductId) || products[0];
  if (featuredProduct) {
    if (imageEl) imageEl.src = SecurityUtils.validateImageUrl(featuredProduct.imagens[0]) ? featuredProduct.imagens[0] : "";
    if (titleEl) titleEl.textContent = featuredProduct.nome;
    if (descEl) descEl.textContent = `100% Feito à Mão • ${featuredProduct.material || "Couro Legítimo"}`;

    if (linkEl) {
      linkEl.style.cursor = "pointer";
      linkEl.onclick = () => {
        window.location.hash = `#produto/${featuredProduct.id}`;
      };
    }
  }

  updateWhatsappLinks();
}

function updateWhatsappLinks() {
  const phone = SecurityUtils.validateWhatsappPhone(settings.whatsappPhone) || "5548999999999";
  const genericMsg = encodeURIComponent("Olá! Gostaria de saber mais sobre as bolsas do ateliê.");
  const atendimentoMsg = encodeURIComponent("Olá! Gostaria de solicitar um atendimento personalizado.");
  const baseUrl = `https://wa.me/${phone}`;

  const navLink = document.getElementById("nav-whatsapp-link");
  if (navLink) navLink.href = baseUrl;

  const heroLink = document.getElementById("hero-whatsapp-link");
  if (heroLink) heroLink.href = `${baseUrl}?text=${atendimentoMsg}`;

  const footerLink = document.getElementById("footer-whatsapp-link");
  if (footerLink) footerLink.href = baseUrl;

  const floatLink = document.getElementById("float-whatsapp-link");
  if (floatLink) floatLink.href = `${baseUrl}?text=${genericMsg}`;
}

function renderSettingsForm() {
  const subtitleInput = document.getElementById("config-hero-subtitle");
  const productSelect = document.getElementById("config-hero-product");
  const imgbbInput = document.getElementById("config-imgbb-key");
  const whatsappPhoneInput = document.getElementById("config-whatsapp-phone");
  const whatsappTemplateInput = document.getElementById("config-whatsapp-template");

  if (!subtitleInput || !productSelect) return;

  subtitleInput.value = settings.heroSubtitle;
  if (imgbbInput) imgbbInput.value = settings.imgbbKey || "";
  if (whatsappPhoneInput) whatsappPhoneInput.value = settings.whatsappPhone || "";
  if (whatsappTemplateInput) whatsappTemplateInput.value = settings.whatsappMessageTemplate || "";

  productSelect.innerHTML = "";
  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.nome;
    if (p.id === settings.heroProductId) {
      option.selected = true;
    }
    productSelect.appendChild(option);
  });
}

function renderCharts() {
  const salesCanvas = document.getElementById("salesMonthlyChart");
  const shareCanvas = document.getElementById("productsShareChart");

  if (!salesCanvas || !shareCanvas) return;

  if (salesChartInstance) salesChartInstance.destroy();
  if (shareChartInstance) shareChartInstance.destroy();

  const salesByDate = {};
  sales.forEach(s => {
    salesByDate[s.data] = (salesByDate[s.data] || 0) + s.valor;
  });

  const sortedDates = Object.keys(salesByDate).sort();
  const salesValues = sortedDates.map(date => salesByDate[date]);
  const dateLabels = sortedDates.map(date => {
    const dateObj = new Date(date + "T00:00:00");
    return dateObj.toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' });
  });

  salesChartInstance = new Chart(salesCanvas, {
    type: 'line',
    data: {
      labels: dateLabels.length > 0 ? dateLabels : ['Sem vendas'],
      datasets: [{
        label: 'Vendas Diárias (R$)',
        data: salesValues.length > 0 ? salesValues : [0],
        borderColor: '#C87A53',
        backgroundColor: 'rgba(200, 122, 83, 0.1)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#C87A53',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  const qtyByProduct = {};
  sales.forEach(s => {
    qtyByProduct[s.produtoNome] = (qtyByProduct[s.produtoNome] || 0) + 1;
  });

  const productNames = Object.keys(qtyByProduct);
  const productQuantities = Object.values(qtyByProduct);
  const earthColors = ['#C87A53', '#8C9A86', '#E6DCD0', '#6E6259', '#2C2621'];

  shareChartInstance = new Chart(shareCanvas, {
    type: 'doughnut',
    data: {
      labels: productNames.length > 0 ? productNames : ['Sem vendas registradas'],
      datasets: [{
        data: productQuantities.length > 0 ? productQuantities : [1],
        backgroundColor: productQuantities.length > 0 ? earthColors.slice(0, productNames.length) : ['#F3ECE0'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#6E6259', font: { family: 'Montserrat', size: 11 } }
        }
      },
      cutout: '65%'
    }
  });
}

function setupScrollAnimations() {
  const cards = document.querySelectorAll(".product-card");
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
    observer.observe(card);
  });

  // Revelação suave (reveal stagger) do banner editorial
  const bannerEl = document.querySelector(".editorial-banner");
  if (bannerEl && !bannerEl.classList.contains("revealed")) {
    const bannerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          bannerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    bannerObserver.observe(bannerEl);
  }
}
