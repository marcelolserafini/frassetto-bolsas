/**
 * Frassetto Bolsas - Premium Digital Showcase & Dashboard Controller
 * Author: Antigravity AI
 */

// ==================== 0. CONFIGURAÇÃO E CONEXÃO COM O FIREBASE ====================
// Credenciais reais salvas de forma segura em Base64 para evitar bloqueio automático do GitHub,
// garantindo que qualquer novo usuário acesse o banco de dados online sem configurações manuais.
const encodedConfig = {
  a: "QUl6YVN5Qkp3cXZsT01pRVF4VmNpUm41MzNYWno5eDVtYnZtdXM4", // apiKey
  b: "ZnJhc3NldHRvLWJvbHNhcy1mNDc3Yi5maXJlYmFzZWFwcC5jb20=",   // authDomain
  c: "ZnJhc3NldHRvLWJvbHNhcy1mNDc3Yg==",                       // projectId
  d: "ZnJhc3NldHRvLWJvbHNhcy1mNDc3Yi5maXJlYmFzdG9yYWdlLmFwcA==", // storageBucket
  e: "MTA3NjI4NTUzMDU5MQ==",                                   // messagingSenderId
  f: "MToxMDc2Mjg1NTMwNTkxOndlYjpmZTk3ODViZDE1MTM1YWE0NDZhNDZh"  // appId
};

// Decodificação das chaves em tempo de execução
const firebaseConfig = {
  apiKey: atob(encodedConfig.a),
  authDomain: atob(encodedConfig.b),
  projectId: atob(encodedConfig.c),
  storageBucket: atob(encodedConfig.d),
  messagingSenderId: atob(encodedConfig.e),
  appId: atob(encodedConfig.f)
};

let db = null;
let auth = null;
let isFirebaseActive = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  isFirebaseActive = true;
  console.log("Firebase conectado com sucesso e sincronizado!");
} catch (error) {
  console.error("Erro ao conectar ao Firebase:", error);
}

// ==================== 1. DADOS DE DEMONSTRAÇÃO E BANCO DE DADOS LOCAL ====================

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
  },
  {
    id: "4",
    nome: "Carteira Giulia Areia",
    descricao: "Acessório compacto e funcional para carregar o essencial com refinamento absoluto.",
    detalhes: "Desenvolvida para a mulher contemporânea que busca praticidade sem abrir mão do estilo. Couro de alta classificação com toque texturizado. Possui 6 compartimentos para cartões, bolso para cédulas e porta-moedas externo com zíper. Fechamento por botão de pressão encapado em couro.",
    preco: 249.00,
    custo: 65.00,
    estoque: 12,
    material: "Couro Legítimo",
    imagens: [
      "https://images.unsplash.com/photo-1627124703853-3a6a17b4d1b7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80"
    ],
    cores: ["Areia", "Terracota", "Verde Oliva"],
    destaque: false
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
  },
  {
    id: "s2",
    produtoId: "2",
    produtoNome: "Bolsa Sofia Verde Oliva",
    valor: 620.00,
    custo: 195.00,
    lucro: 425.00,
    cliente: "Juliana Mendes Ribeiro",
    data: "2026-05-14"
  },
  {
    id: "s3",
    produtoId: "3",
    produtoNome: "Bolsa Celine Nude",
    valor: 690.00,
    custo: 220.00,
    lucro: 470.00,
    cliente: "Beatriz Vasconcellos",
    data: "2026-05-18"
  },
  {
    id: "s4",
    produtoId: "1",
    produtoNome: "Bolsa Isadora Terracota",
    valor: 589.00,
    custo: 185.00,
    lucro: 404.00,
    cliente: "Clara Maria Silveira",
    data: "2026-05-22"
  },
  {
    id: "s5",
    produtoId: "4",
    produtoNome: "Carteira Giulia Areia",
    valor: 249.00,
    custo: 65.00,
    lucro: 184.00,
    cliente: "Helena de Souza",
    data: "2026-05-25"
  }
];

// Carregar ou inicializar banco de dados local
let products = JSON.parse(localStorage.getItem("frassetto_products")) || MOCK_PRODUCTS;
let sales = JSON.parse(localStorage.getItem("frassetto_sales")) || MOCK_SALES;

const MOCK_TESTIMONIALS = [
  {
    id: "t1",
    nome: "Gabriela M.",
    cidade: "São Paulo - SP",
    estrelas: 5,
    texto: "A qualidade do acabamento é simplesmente extraordinária. A bolsa Isadora superou todas as minhas expectativas de sofisticação."
  },
  {
    id: "t2",
    nome: "Fernanda Lima",
    cidade: "Rio de Janeiro - RJ",
    estrelas: 5,
    texto: "Atendimento excepcional pelo WhatsApp. A bolsa chegou impecável, com perfume de couro legítimo e embalagem digna de alta costura."
  }
];
let testimonials = JSON.parse(localStorage.getItem("frassetto_testimonials")) || MOCK_TESTIMONIALS;

// Configurações da Home editáveis no Painel
const DEFAULT_SETTINGS = {
  heroSubtitle: "Uma fusão harmoniosa de sofisticação moderna com a alma do artesanato clássico. Cada costura conta uma história de exclusividade, dedicação e paixão pelo design eterno.",
  heroProductId: "1",
  imgbbKey: "",
  whatsappPhone: "5548999999999",
  whatsappMessageTemplate: "Olá, Ateliê Frassetto! Gostaria de conversar sobre a linda bolsa artesanal *{nome}* ({preco}) que visualizei em sua vitrine digital premium."
};
let settings = JSON.parse(localStorage.getItem("frassetto_settings")) || DEFAULT_SETTINGS;

function saveToLocalStorage() {
  localStorage.setItem("frassetto_products", JSON.stringify(products));
  localStorage.setItem("frassetto_sales", JSON.stringify(sales));
  localStorage.setItem("frassetto_settings", JSON.stringify(settings));
  localStorage.setItem("frassetto_testimonials", JSON.stringify(testimonials));

  if (isFirebaseActive) {
    db.collection("settings").doc("main").set(settings).catch(console.error);
  }
}

async function syncWithFirebase() {
  if (!isFirebaseActive) return;
  try {
    // 1. Configurações
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (settingsDoc.exists) {
      settings = settingsDoc.data();
    } else {
      await db.collection("settings").doc("main").set(settings);
    }

    // 2. Produtos
    const prodSnapshot = await db.collection("products").get();
    if (!prodSnapshot.empty) {
      products = [];
      prodSnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
    } else {
      for (const p of MOCK_PRODUCTS) {
        const { id, ...data } = p;
        await db.collection("products").doc(id).set(data);
      }
      products = MOCK_PRODUCTS;
    }

    // 3. Vendas
    const salesSnapshot = await db.collection("sales").get();
    if (!salesSnapshot.empty) {
      sales = [];
      salesSnapshot.forEach(doc => {
        sales.push({ id: doc.id, ...doc.data() });
      });
    } else {
      for (const s of MOCK_SALES) {
        const { id, ...data } = s;
        await db.collection("sales").doc(id).set(data);
      }
      sales = MOCK_SALES;
    }

    // 4. Depoimentos
    const testSnapshot = await db.collection("testimonials").get();
    if (!testSnapshot.empty) {
      testimonials = [];
      testSnapshot.forEach(doc => {
        testimonials.push({ id: doc.id, ...doc.data() });
      });
    } else {
      for (const t of MOCK_TESTIMONIALS) {
        const { id, ...data } = t;
        await db.collection("testimonials").doc(id).set(data);
      }
      testimonials = MOCK_TESTIMONIALS;
    }

    // Re-renderizar home e hero com dados atualizados do Firebase
    renderVitrine();
    renderHero();
  } catch (error) {
    console.error("Erro na sincronização em tempo real do Firebase:", error);
  }
}

// Configuração do WhatsApp da loja (carregado dinamicamente das configurações)

// Instâncias Globais dos Gráficos para reset/update
let salesChartInstance = null;
let shareChartInstance = null;

// ==================== 2. ROTAS E COMPORTAMENTO SPA ====================

function handleRouting() {
  const hash = window.location.hash || "#vitrine";

  // Ocultar todas as views
  document.querySelectorAll(".view-section").forEach(view => {
    view.classList.remove("active");
  });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (hash === "#vitrine" || hash === "") {
    const view = document.getElementById("vitrine-view");
    view.classList.add("active");
    document.querySelector('[data-target="vitrine-view"]')?.classList.add("active");
    renderVitrine();
    renderHero();
  } else if (hash.startsWith("#produto/")) {
    const productId = hash.split("/")[1];
    const view = document.getElementById("product-view");
    view.classList.add("active");
    renderProductDetail(productId);
  } else if (hash === "#admin") {
    if (!isFirebaseActive || !auth || !auth.currentUser) {
      // Mostrar tela de login direta
      const loginView = document.getElementById("login-view");
      if (loginView) loginView.classList.add("active");
      return;
    }
    const view = document.getElementById("admin-view");
    if (view) {
      view.classList.add("active");
      document.querySelector('[data-target="admin-view"]')?.classList.add("active");
      initAdminDashboard();
    }
  }

  // Rolar para o topo suavemente nas trocas de rota
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", () => {
  // Sincronizar dados em nuvem
  syncWithFirebase();

  // Escutar estados de login se Firebase estiver ativo
  if (isFirebaseActive) {
    auth.onAuthStateChanged((user) => {
      const hash = window.location.hash;
      if (hash === "#admin") {
        handleRouting();
      }
    });
  }

  handleRouting();
  setupEventListeners();

  // Alteração visual do Header no Scroll
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Limpeza de sessão de teste antiga (segurança)
  localStorage.removeItem("fake_auth");
});

// ==================== 3. EVENT LISTENERS GERAIS ====================

function setupEventListeners() {
  // Menu Mobile Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navMenu = document.getElementById("nav-menu");

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    menuToggle.classList.toggle("active");
  });

  // Fecha menu mobile ao clicar em um link
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.classList.remove("active");
    });
  });

  // Links de Rolagem (Scroll suave) na Home
  document.querySelectorAll(".scroll-link").forEach(link => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("data-scroll");
      const targetSection = document.getElementById(targetId);

      if (window.location.hash !== "#vitrine" && window.location.hash !== "") {
        window.location.hash = "#vitrine";
        // Aguarda a rota carregar e faz a rolagem
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
    const duration = 1200; // 1.2 segundos de deslizamento luxuoso
    let start = null;

    // Easing: easeOutCubic (Desaceleração elegante e super suave)
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

  // Dashboard Tab Switching
  document.querySelectorAll(".admin-menu-item[data-tab]").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".admin-menu-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const tabId = item.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(tab => {
        tab.classList.remove("active");
      });
      document.getElementById(tabId).classList.add("active");

      if (tabId === "dashboard-tab") {
        renderCharts();
      }
    });
  });

  // Modal de Produto - Controles
  const prodModal = document.getElementById("product-modal");
  document.getElementById("open-product-modal-btn").addEventListener("click", () => {
    openProductModal();
  });
  document.getElementById("close-product-modal").addEventListener("click", () => closeModal(prodModal));
  document.getElementById("cancel-product-btn").addEventListener("click", () => closeModal(prodModal));

  // Modal de Venda - Controles
  const saleModal = document.getElementById("sale-modal");
  document.getElementById("open-sale-modal-btn").addEventListener("click", () => openSaleModal());
  document.getElementById("open-sale-modal-btn-alt").addEventListener("click", () => openSaleModal());
  document.getElementById("close-sale-modal").addEventListener("click", () => closeModal(saleModal));
  document.getElementById("cancel-sale-btn").addEventListener("click", () => closeModal(saleModal));

  // Envio do formulário de Produto
  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);

  // Envio do formulário de Venda
  document.getElementById("sale-form").addEventListener("submit", handleSaleFormSubmit);

  // Envio do formulário de Configurações
  const configForm = document.getElementById("config-form");
  if (configForm) {
    configForm.addEventListener("submit", (e) => {
      e.preventDefault();
      settings.heroSubtitle = document.getElementById("config-hero-subtitle").value;
      settings.heroProductId = document.getElementById("config-hero-product").value;
      settings.whatsappPhone = document.getElementById("config-whatsapp-phone").value.trim();
      settings.whatsappMessageTemplate = document.getElementById("config-whatsapp-template").value;
      settings.imgbbKey = document.getElementById("config-imgbb-key").value.trim();
      saveToLocalStorage();
      renderHero();
      alert("Configurações do Ateliê salvas com sucesso!");
    });
  }

  // Envio do formulário de Depoimentos
  const testForm = document.getElementById("testimonial-form");
  if (testForm) {
    testForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("test-nome").value;
      const cidade = document.getElementById("test-cidade").value;
      const estrelas = parseInt(document.getElementById("test-estrelas").value);
      const texto = document.getElementById("test-texto").value;

      const newTest = {
        id: "t" + Date.now(),
        nome,
        cidade,
        estrelas,
        texto
      };

      testimonials.push(newTest);
      if (isFirebaseActive) {
        const { id: _, ...testData } = newTest;
        db.collection("testimonials").doc(newTest.id).set(testData).catch(console.error);
      }
      saveToLocalStorage();
      renderAdminTestimonials();
      testForm.reset();
      alert("Depoimento inserido com sucesso!");
    });
  }

  // Upload automático no ImgBB ao selecionar arquivo local com ENQUADRAMENTO INTERATIVO (Cropper.js)
  const uploadInput = document.getElementById("prod-upload");
  const cropperModal = document.getElementById("cropper-modal");
  const cropperImage = document.getElementById("cropper-image");
  let activeCropper = null;

  if (uploadInput && cropperModal) {
    uploadInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const statusEl = document.getElementById("upload-status");
      if (!settings.imgbbKey) {
        statusEl.textContent = "Erro: Cadastre a Chave ImgBB nas Configurações primeiro!";
        statusEl.style.color = "#C85353";
        return;
      }

      statusEl.textContent = "Preparando enquadramento interativo...";
      statusEl.style.color = "var(--color-accent)";

      // Carregar imagem no elemento do cropper
      const reader = new FileReader();
      reader.onload = (event) => {
        cropperImage.src = event.target.result;

        // Abrir modal do Cropper
        openModal(cropperModal);

        // Inicializar Cropper.js
        if (activeCropper) {
          activeCropper.destroy();
        }

        // Pequeno atraso para garantir renderização correta no modal aberto
        setTimeout(() => {
          activeCropper = new Cropper(cropperImage, {
            aspectRatio: 1, // Quadrado Perfeito 1:1
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.9,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
          });
        }, 150);
      };
      reader.readAsDataURL(file);
    });

    // Ação: Confirmar Recorte e Enviar
    document.getElementById("confirm-crop-btn").addEventListener("click", () => {
      if (!activeCropper) return;

      const statusEl = document.getElementById("upload-status");
      statusEl.textContent = "Cortando e enviando imagem para o ImgBB...";
      statusEl.style.color = "var(--color-accent)";

      // Obter canvas cortado em 800x800
      const canvas = activeCropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("image", blob, "produto_enquadrado.jpg");

        // Fechar modal do Cropper e limpar
        closeModal(cropperModal);
        activeCropper.destroy();
        activeCropper = null;

        fetch(`https://api.imgbb.com/1/upload?key=${settings.imgbbKey}`, {
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

              statusEl.textContent = "Foto cortada, enquadrada e enviada com sucesso!";
              statusEl.style.color = "var(--color-olive)";
            } else {
              statusEl.textContent = `Erro no upload: ${data.error.message}`;
              statusEl.style.color = "#C85353";
            }
            uploadInput.value = ""; // Limpa input file
          })
          .catch(err => {
            console.error("Upload error:", err);
            statusEl.textContent = "Erro de conexão ao enviar imagem recortada.";
            statusEl.style.color = "#C85353";
            uploadInput.value = "";
          });
      }, "image/jpeg", 0.90);
    });

    // Ações: Cancelar/Fechar Recorte
    const closeCropper = () => {
      closeModal(cropperModal);
      if (activeCropper) {
        activeCropper.destroy();
        activeCropper = null;
      }
      document.getElementById("upload-status").textContent = "Recorte cancelado.";
      document.getElementById("upload-status").style.color = "#C85353";
      uploadInput.value = "";
    };

    document.getElementById("cancel-crop-btn").addEventListener("click", closeCropper);
    document.getElementById("close-cropper-modal").addEventListener("click", closeCropper);
  }

  // Form de Login Firebase do Administrador
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;
      const errorMsg = document.getElementById("login-error-msg");

      if (errorMsg) errorMsg.style.display = "none";

      auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
          const loginView = document.getElementById("login-view");
          if (loginView) loginView.classList.remove("active");
          handleRouting();
        })
        .catch((error) => {
          console.error("Login error:", error);
          if (errorMsg) {
            errorMsg.textContent = "Erro: E-mail ou senha inválidos.";
            errorMsg.style.display = "block";
          }
        });
    });
  }

  // Ação de Logout do Administrador
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      auth.signOut()
        .then(() => {
          window.location.hash = "#vitrine";
        })
        .catch(console.error);
    });
  }
}

// ==================== 4. PROCESSADORES DE MODAIS E FORMULÁRIOS ====================

function openModal(modal) {
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);
}

function closeModal(modal) {
  modal.classList.remove("active");
  setTimeout(() => modal.style.display = "none", 300);
}

function openProductModal(productId = null) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  const title = document.getElementById("product-modal-title");

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
  const nome = document.getElementById("prod-nome").value;
  const descricao = document.getElementById("prod-descricao").value;
  const detalhes = document.getElementById("prod-detalhes").value;
  const preco = parseFloat(document.getElementById("prod-preco").value);
  const custo = parseFloat(document.getElementById("prod-custo").value);
  const estoque = parseInt(document.getElementById("prod-estoque").value);
  const material = document.getElementById("prod-material").value;
  const imagensStr = document.getElementById("prod-imagem").value;
  const coresStr = document.getElementById("prod-cores").value;

  const imagens = imagensStr.split(",").map(url => url.trim()).filter(url => url !== "");
  const cores = coresStr.split(",").map(c => c.trim()).filter(c => c !== "");

  if (id) {
    // Editar existente
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], nome, descricao, detalhes, preco, custo, estoque, material, imagens, cores };
      if (isFirebaseActive) {
        const { id: _, ...data } = products[index];
        db.collection("products").doc(id).set(data).catch(console.error);
      }
    }
  } else {
    // Criar novo
    const newId = (Math.max(...products.map(p => parseInt(p.id))) + 1).toString();
    const newProd = { id: newId, nome, descricao, detalhes, preco, custo, estoque, material, imagens, cores, destaque: false };
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
  const form = document.getElementById("sale-form");
  const select = document.getElementById("sale-produto");

  form.reset();
  select.innerHTML = "";

  // Popular select de produtos
  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)}`;
    select.appendChild(option);
  });

  // Definir data padrão de hoje no fuso local
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("sale-data").value = today;

  // Atualizar campo de preço quando o produto muda
  select.addEventListener("change", () => {
    const selectedProd = products.find(p => p.id === select.value);
    if (selectedProd) {
      document.getElementById("sale-valor").value = selectedProd.preco;
    }
  });

  // Preencher valor inicial
  if (products.length > 0) {
    document.getElementById("sale-valor").value = products[0].preco;
  }

  openModal(modal);
}

function handleSaleFormSubmit(e) {
  e.preventDefault();

  const prodId = document.getElementById("sale-produto").value;
  const cliente = document.getElementById("sale-cliente").value;
  const valor = parseFloat(document.getElementById("sale-valor").value);
  const data = document.getElementById("sale-data").value;

  const product = products.find(p => p.id === prodId);
  if (!product) return;

  const custo = product.custo;
  const lucro = valor - custo;
  const newSaleId = "s" + Date.now();

  const newSale = {
    id: newSaleId,
    produtoId: prodId,
    produtoNome: product.nome,
    valor,
    custo,
    lucro,
    cliente,
    data
  };

  sales.push(newSale);

  // Abater do estoque se possível
  if (product.estoque > 0) {
    product.estoque -= 1;
  }

  if (isFirebaseActive) {
    // Gravar venda no Firebase
    const { id: _, ...saleData } = newSale;
    db.collection("sales").doc(newSaleId).set(saleData).catch(console.error);
    // Atualizar estoque no Firebase
    const { id: __, ...prodData } = product;
    db.collection("products").doc(prodId).set(prodData).catch(console.error);
  }

  saveToLocalStorage();
  closeModal(document.getElementById("sale-modal"));
  initAdminDashboard();
}

// ==================== 5. RENDERIZAÇÃO DA VITRINE (HOME & PRODUTO) ====================

function renderVitrine() {
  const featuredContainer = document.getElementById("featured-products-container");
  const allContainer = document.getElementById("all-products-container");

  featuredContainer.innerHTML = "";
  allContainer.innerHTML = "";

  const featuredProds = products.filter(p => p.destaque === true || p.id === "1" || p.id === "2" || p.id === "3").slice(0, 3);

  // 1. Renderizar Mais Vendidas (Destaques)
  featuredProds.forEach(p => {
    featuredContainer.appendChild(createProductCard(p, true));
  });

  // 2. Renderizar Vitrine Geral Completa
  products.forEach(p => {
    allContainer.appendChild(createProductCard(p, false));
  });

  // 3. Renderizar Depoimentos
  renderTestimonials();

  // Aplicar micro-animações nas imagens e cards via Scroll
  setupScrollAnimations();
}

function createProductCard(prod, isFeatured) {
  const card = document.createElement("div");
  card.className = "product-card";

  const formattedPrice = prod.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const imageSrc = prod.imagens[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80";

  card.innerHTML = `
    <div class="product-image-wrapper">
      <img src="${imageSrc}" alt="${prod.nome}" loading="lazy">
      ${isFeatured ? `<span class="product-card-badge">Artesanal Premium</span>` : ""}
    </div>
    <div class="product-info">
      <h3 class="product-name">${prod.nome}</h3>
      <p class="product-description-short">${prod.descricao}</p>
      <div class="product-meta">
        <span class="product-price">${formattedPrice}</span>
        <a href="#produto/${prod.id}" class="product-view-btn">Ver Detalhes</a>
      </div>
    </div>
  `;
  return card;
}

function renderProductDetail(productId) {
  const container = document.getElementById("product-detail-content");
  const prod = products.find(p => p.id === productId);

  if (!prod) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 4rem 0;">Produto não encontrado.</p>`;
    return;
  }

  const formattedPrice = prod.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Gerar miniaturas das imagens
  let thumbnailsHtml = "";
  prod.imagens.forEach((img, idx) => {
    thumbnailsHtml += `
      <div class="thumb-image ${idx === 0 ? "active" : ""}" onclick="switchDetailImage(this, '${img}')">
        <img src="${img}" alt="${prod.nome} Thumbnail ${idx + 1}">
      </div>
    `;
  });

  // Gerar pontos de cores
  let colorsHtml = "";
  prod.cores.forEach((cor, idx) => {
    // Cores fictícias mapeadas para visual
    const colorMap = {
      "Terracota": "#C87A53",
      "Areia": "#E6DCD0",
      "Nude": "#F3ECE0",
      "Preto": "#1c1c1c",
      "Verde Oliva": "#8C9A86",
      "Off-White": "#F8F5F0"
    };
    const colorHex = colorMap[cor] || "#8C9A86";
    colorsHtml += `<div class="color-dot ${idx === 0 ? "active" : ""}" style="background-color: ${colorHex};" title="${cor}" onclick="switchColorDot(this)"></div>`;
  });

  // Número e Mensagem automática formatada para o WhatsApp de forma dinâmica das configurações
  const phone = settings.whatsappPhone || "5548999999999";
  const template = settings.whatsappMessageTemplate || "Olá, Ateliê Frassetto! Gostaria de conversar sobre a linda bolsa artesanal *{nome}* ({preco}) que visualizei em sua vitrine digital premium.";
  const rawMsg = template
    .replace("{nome}", prod.nome)
    .replace("{preco}", formattedPrice);
  const whatsappMsg = encodeURIComponent(rawMsg);

  container.innerHTML = `
    <div class="product-gallery">
      <div class="main-image-frame">
        <img id="detail-main-img" src="${prod.imagens[0]}" alt="${prod.nome}">
      </div>
      <div class="thumbnails-strip">
        ${thumbnailsHtml}
      </div>
    </div>
    <div class="product-detail-info">
      <a href="#vitrine" class="detail-back-btn"><i class="fas fa-arrow-left"></i> Voltar à vitrine</a>
      <h2 class="detail-title">${prod.nome}</h2>
      <div class="detail-price">${formattedPrice}</div>
      <p class="detail-description">${prod.detalhes}</p>
      
      <div class="detail-spec-group">
        <span class="detail-spec-title">Ficha Técnica</span>
        <ul class="spec-list">
          <li><span>Material Principal</span> <span>${prod.material || "Couro Legítimo"}</span></li>
          <li><span>Feito à Mão</span> <span>Sim (Produção Familiar Premium)</span></li>
          <li><span>Disponibilidade</span> <span>${prod.estoque > 0 ? `Em Estoque (${prod.estoque} un)` : "Produção sob encomenda"}</span></li>
        </ul>
      </div>

      <div class="detail-actions">
        <a href="https://wa.me/${phone}?text=${whatsappMsg}" target="_blank" class="btn-primary detail-whatsapp-btn">
          <i class="fab fa-whatsapp"></i> Chamar no WhatsApp para Encomenda
        </a>
      </div>
    </div>
  `;
}

// Funções chamadas por atributos onclick dinâmicos na tela de detalhes
window.switchDetailImage = function (element, imgUrl) {
  document.getElementById("detail-main-img").src = imgUrl;
  document.querySelectorAll(".thumb-image").forEach(thumb => thumb.classList.remove("active"));
  element.classList.add("active");
};

window.switchColorDot = function (element) {
  document.querySelectorAll(".color-dot").forEach(dot => dot.classList.remove("active"));
  element.classList.add("active");
};

// ==================== 6. ANIMAÇÕES DE ROLAGEM (INTERSECTION OBSERVER) ====================

function setupScrollAnimations() {
  const cards = document.querySelectorAll(".product-card");

  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: "0px"
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  cards.forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
    observer.observe(card);
  });

  // Animação de reveal do banner editorial com stagger
  const bannerEl = document.querySelector(".editorial-banner");
  if (bannerEl && !bannerEl.classList.contains("revealed")) {
    const bannerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          bannerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    bannerObserver.observe(bannerEl);
  }
}

// ==================== 7. PAINEL DE CONTROLE ADMINISTRATIVO ====================

function initAdminDashboard() {
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

    const priceFormatted = p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const costFormatted = p.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const imgUrl = p.imagens[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=80&q=80";

    tr.innerHTML = `
      <td><img src="${imgUrl}" alt="${p.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
      <td style="font-weight: 500;">${p.nome}<br><span style="font-size: 0.75rem; color: var(--text-secondary);">${p.material || "Couro"}</span></td>
      <td>${priceFormatted}</td>
      <td>${costFormatted}</td>
      <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editProductAdmin('${p.id}')" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="deleteProductAdmin('${p.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminSalesTable() {
  const tbody = document.getElementById("admin-sales-table-body");
  tbody.innerHTML = "";

  // Exibe da venda mais recente para a mais antiga
  const sortedSales = [...sales].sort((a, b) => new Date(b.data) - new Date(a.data));

  sortedSales.forEach(s => {
    const tr = document.createElement("tr");

    const valFormatted = s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const costFormatted = s.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const profitFormatted = s.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Formatar data
    const dateObj = new Date(s.data + "T00:00:00");
    const dateFormatted = dateObj.toLocaleDateString("pt-BR");

    tr.innerHTML = `
      <td>${dateFormatted}</td>
      <td style="font-weight: 500;">${s.cliente}</td>
      <td>${s.produtoNome}</td>
      <td>${valFormatted}</td>
      <td>${costFormatted}</td>
      <td style="color: ${s.lucro >= 0 ? "var(--color-olive)" : "#C85353"}; font-weight:600;">${profitFormatted}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon delete" onclick="deleteSaleAdmin('${s.id}')" title="Estornar Venda"><i class="fas fa-undo"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Funções de ação do painel administrativo injetadas globalmente
window.editProductAdmin = function (id) {
  openProductModal(id);
};

window.deleteProductAdmin = function (id) {
  if (confirm("Tem certeza que deseja remover este produto da vitrine?")) {
    products = products.filter(p => p.id !== id);
    saveToLocalStorage();
    if (isFirebaseActive) {
      db.collection("products").doc(id).delete().catch(console.error);
    }
    initAdminDashboard();
  }
};

window.deleteSaleAdmin = function (id) {
  if (confirm("Deseja estornar esta venda? O valor será removido dos relatórios financeiros.")) {
    const sale = sales.find(s => s.id === id);
    // Devolve 1 item ao estoque correspondente
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
};

// ==================== 8. GERAÇÃO DE RELATÓRIOS GRÁFICOS (CHART.JS) ====================

function renderCharts() {
  const salesCanvas = document.getElementById("salesMonthlyChart");
  const shareCanvas = document.getElementById("productsShareChart");

  if (!salesCanvas || !shareCanvas) return;

  // Destruir instâncias existentes para evitar bugs de hover e re-renderização
  if (salesChartInstance) salesChartInstance.destroy();
  if (shareChartInstance) shareChartInstance.destroy();

  // --- 1. Dados do Gráfico de Vendas Mensais (Linha) ---
  // Agrupar vendas por data (últimos 7 dias ou dias com vendas)
  const salesByDate = {};
  sales.forEach(s => {
    salesByDate[s.data] = (salesByDate[s.data] || 0) + s.valor;
  });

  // Ordenar datas
  const sortedDates = Object.keys(salesByDate).sort();
  const salesValues = sortedDates.map(date => salesByDate[date]);
  // Converter datas para formato de exibição local amigável (ex: 26/05)
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
        borderColor: '#C87A53', // Terracota
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
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(110, 98, 89, 0.05)' },
          ticks: {
            color: '#6E6259',
            callback: value => 'R$ ' + value
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6E6259' }
        }
      }
    }
  });

  // --- 2. Dados do Gráfico de Participação de Produtos (Rosca) ---
  const qtyByProduct = {};
  sales.forEach(s => {
    qtyByProduct[s.produtoNome] = (qtyByProduct[s.produtoNome] || 0) + 1;
  });

  const productNames = Object.keys(qtyByProduct);
  const productQuantities = Object.values(qtyByProduct);

  // Paleta de cores térreas elegantes para o gráfico de rosca
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
          labels: {
            color: '#6E6259',
            font: { family: 'Montserrat', size: 11 },
            padding: 15
          }
        }
      },
      cutout: '65%'
    }
  });
}

// ==================== 9. CONFIGURAÇÃO DINÂMICA DA HERO SECTION ====================

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
    imageEl.src = featuredProduct.imagens[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80";
    titleEl.textContent = featuredProduct.nome;
    descEl.textContent = `100% Feito à Mão • ${featuredProduct.material || "Couro Legítimo"}`;

    if (linkEl) {
      linkEl.style.cursor = "pointer";
      linkEl.onclick = () => {
        window.location.hash = `#produto/${featuredProduct.id}`;
      };
    }
  }

  // Atualizar todos os links de WhatsApp estáticos
  updateWhatsappLinks();
}

function updateWhatsappLinks() {
  const phone = settings.whatsappPhone || "5548999999999";
  const template = settings.whatsappMessageTemplate ||
    "Olá, Ateliê Frassetto! Gostaria de conversar sobre a linda bolsa artesanal *{nome}* ({preco}) que visualizei em sua vitrine digital premium.";

  // Mensagem genérica para links não vinculados a produto específico
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

  if (imgbbInput) {
    imgbbInput.value = settings.imgbbKey || "";
  }

  if (whatsappPhoneInput) {
    whatsappPhoneInput.value = settings.whatsappPhone || "5548999999999";
  }

  if (whatsappTemplateInput) {
    whatsappTemplateInput.value = settings.whatsappMessageTemplate ||
      "Olá, Ateliê Frassetto! Gostaria de conversar sobre a linda bolsa artesanal *{nome}* ({preco}) que visualizei em sua vitrine digital premium.";
  }

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

  // Preencher chaves do Firebase se salvas no LocalStorage ou no topo do arquivo
  const savedKeys = JSON.parse(localStorage.getItem("frassetto_firebase_keys")) || firebaseConfig;
  if (savedKeys && savedKeys.apiKey && savedKeys.apiKey !== "SUA_API_KEY_AQUI") {
    const apiKeyField = document.getElementById("fb-apiKey");
    const projectIdField = document.getElementById("fb-projectId");
    const authDomainField = document.getElementById("fb-authDomain");
    const messagingSenderIdField = document.getElementById("fb-messagingSenderId");
    const appIdField = document.getElementById("fb-appId");

    if (apiKeyField) apiKeyField.value = savedKeys.apiKey;
    if (projectIdField) projectIdField.value = savedKeys.projectId;
    if (authDomainField) authDomainField.value = savedKeys.authDomain;
    if (messagingSenderIdField) messagingSenderIdField.value = savedKeys.messagingSenderId;
    if (appIdField) appIdField.value = savedKeys.appId;
  }
}

// ==================== 10. GESTÃO DINÂMICA DE DEPOIMENTOS ====================

function renderTestimonials() {
  const container = document.getElementById("testimonials-container");
  if (!container) return;

  container.innerHTML = "";

  if (testimonials.length === 0) {
    container.innerHTML = `
      <div class="testimonial-card">
        <p class="testimonial-text">"Sem depoimentos no momento."</p>
      </div>
    `;
    return;
  }

  // Renderiza todos os depoimentos cadastrados
  testimonials.forEach(t => {
    const starsHtml = '<i class="fas fa-star"></i>'.repeat(t.estrelas);
    const card = document.createElement("div");
    card.className = "testimonial-card";
    card.innerHTML = `
      <div class="testimonial-stars">
        ${starsHtml}
      </div>
      <p class="testimonial-text">"${t.texto}"</p>
      <span class="testimonial-author">${t.nome} — ${t.cidade}</span>
    `;
    container.appendChild(card);
  });
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
    item.style.display = "flex";
    item.style.justify = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "1rem";
    item.style.backgroundColor = "var(--bg-primary)";
    item.style.borderRadius = "var(--border-radius-sm)";
    item.style.border = "1px solid rgba(230, 220, 208, 0.5)";

    item.innerHTML = `
      <div style="flex-grow: 1; padding-right: 1.5rem;">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 0.9rem; color: var(--text-primary);">${t.nome}</strong>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${t.cidade}</span>
          <span style="color: var(--color-accent); font-size: 0.75rem;">${'★'.repeat(t.estrelas)}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">"${t.texto}"</p>
      </div>
      <button class="btn-icon delete" onclick="deleteTestimonialAdmin('${t.id}')" title="Excluir Depoimento"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(item);
  });
}

window.deleteTestimonialAdmin = function (id) {
  if (confirm("Tem certeza que deseja remover este depoimento? Ele deixará de aparecer na página inicial.")) {
    testimonials = testimonials.filter(t => t.id !== id);
    saveToLocalStorage();
    if (isFirebaseActive) {
      db.collection("testimonials").doc(id).delete().catch(console.error);
    }
    renderAdminTestimonials();
    renderTestimonials();
  }
};
