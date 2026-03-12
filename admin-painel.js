const URL_API = "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec";

let osAtual = null; // null = nova OS | "00001" = edição

/* ══════════════════════════════
   INIT — verifica sessão
══════════════════════════════ */
if (!sessionStorage.getItem("iplace_logado")) {
  window.location.href = "admin-login.html";
}

/* ══════════════════════════════
   SAIR
══════════════════════════════ */
function sair() {
  sessionStorage.removeItem("iplace_logado");
  window.location.href = "admin-login.html";
}

/* ══════════════════════════════
   LISTA DE OS
══════════════════════════════ */
let _listaCompleta = [];

function carregarLista() {
  document.getElementById("lista-os").innerHTML =
    '<div class="lista-estado">Carregando ordens de serviço...</div>';

  jsonp(URL_API + "?acao=listarOS", "cbLista", function (dados) {
    if (!dados.lista || dados.lista.length === 0) {
      document.getElementById("lista-os").innerHTML =
        '<div class="lista-estado">Nenhuma ordem de serviço cadastrada.</div>';
      return;
    }
    _listaCompleta = dados.lista;
    renderLista(_listaCompleta);
  });
}

function renderLista(lista) {
  const container = document.getElementById("lista-os");

  if (!lista || lista.length === 0) {
    container.innerHTML = '<div class="lista-estado">Nenhuma OS encontrada para este status.</div>';
    return;
  }

  container.innerHTML = "";
  lista.forEach(function (os) {
    const div = document.createElement("div");
    div.className = "os-item";
    div.onclick   = function () { abrirOS(os.os); };
    div.innerHTML = `
      <span class="os-num">#${os.os}</span>
      <span class="os-cliente">${os.cliente || "—"}</span>
      <span class="os-produto">${os.produto  || "—"}</span>
      <span class="os-badge ${badgeClass(os.situacao)}">${os.situacao || "—"}</span>
      <span class="os-data">${os.entrada_data || "—"}</span>
    `;
    container.appendChild(div);
  });
}

function filtrarPorStatus() {
  const sel = document.getElementById("filtro-status").value;
  if (!sel) {
    renderLista(_listaCompleta);
    return;
  }
  const filtrado = _listaCompleta.filter(os => os.situacao === sel);
  renderLista(filtrado);
}

function badgeClass(s) {
  if (!s) return "badge-default";
  s = s.toUpperCase();
  if (s === "RECEBIDO")             return "badge-recebido";
  if (s.includes("AGUARDANDO"))     return "badge-aguardando";
  if (s === "SERVIÇO EM EXECUÇÃO")  return "badge-execucao";
  if (s === "SERVIÇO CONCLUÍDO")    return "badge-concluido";
  if (s === "SAIU PARA ENTREGA")    return "badge-saiu";
  if (s === "ENTREGUE")             return "badge-entregue";
  return "badge-default";
}

/* ══════════════════════════════
   NOVA OS
══════════════════════════════ */
function novaOS() {
  osAtual = null;
  limparForm();

  document.getElementById("form-titulo").textContent    = "Nova Ordem de Serviço";
  document.getElementById("form-os-numero").style.display = "none";
  document.getElementById("secao-historico-os").style.display = "none";
  document.getElementById("btn-apagar").style.display   = "none";

  const agora = new Date();
  document.getElementById("f-entrada-data").value = agora.toISOString().slice(0, 10);
  document.getElementById("f-entrada-hora").value = agora.toTimeString().slice(0, 5);

  mostrarSecaoOS();
}

/* ══════════════════════════════
   ABRIR OS PARA EDIÇÃO
══════════════════════════════ */
function abrirOS(numero) {
  osAtual = numero;

  const url = URL_API + "?acao=buscarOS&os=" + numero;

  jsonp(url, "cbBuscar", function (dados) {
    if (!dados.encontrado) {
      mostrarToast("OS não encontrada.", "err");
      return;
    }

    document.getElementById("form-titulo").textContent = "Editar Ordem de Serviço";
    const badge = document.getElementById("form-os-numero");
    badge.textContent    = "#" + dados.os;
    badge.style.display  = "inline-block";
    document.getElementById("btn-apagar").style.display = "flex";

    setValue("f-cliente",           dados.cliente);
    setValue("f-telefone",          dados.telefone);
    setValue("f-email",             dados.email);
    setValue("f-documento",         dados.documento);
    setValue("f-produto",           dados.produto);
    setValue("f-descricao-produto", dados.desc_produto);
    setValue("f-descricao-problema",dados.desc_problema);
    setValue("f-parecer",           dados.parecer);
    setValue("f-descricao-servico", dados.desc_servico);
    setValue("f-valor-servico",     dados.valor_servico);
    setValue("f-valor-peca",        dados.valor_peca);
    setValue("f-pecas",             dados.pecas);
    setValue("f-situacao",          dados.situacao || "RECEBIDO");
    setValue("f-progresso",         dados.progresso || "1");
    setValue("f-recebido-por",      dados.recebido_por);
    setValue("f-entrada-data",      dados.entrada_data_iso);
    setValue("f-entrada-hora",      dados.entrada_hora);
    setValue("f-saida-data",        dados.saida_data_iso);
    setValue("f-saida-hora",        dados.saida_hora);

    calcularTotal();
    onStatusChange();

    // histórico
    if (dados.historico && dados.historico.length > 0) {
      document.getElementById("secao-historico-os").style.display = "block";
      const hl = document.getElementById("historico-lista-os");
      hl.innerHTML = "";
      dados.historico.forEach(function (h) {
        hl.innerHTML += `
          <div class="historico-item">
            <div class="historico-dot"></div>
            <p><strong>${h.data}</strong> — ${h.status}</p>
          </div>`;
      });
    } else {
      document.getElementById("secao-historico-os").style.display = "none";
    }

    mostrarSecaoOS();
  });
}

/* ══════════════════════════════
   SALVAR OS
══════════════════════════════ */
function salvarOS() {
  const btn = document.querySelector(".btn-salvar");
  btn.disabled    = true;
  btn.textContent = "Salvando...";

  const params = {
    acao:          osAtual ? "atualizarOS" : "criarOS",
    os:            osAtual || "",
    cliente:       getValue("f-cliente"),
    telefone:      getValue("f-telefone"),
    email:         getValue("f-email"),
    documento:     getValue("f-documento"),
    produto:       getValue("f-produto"),
    desc_produto:  getValue("f-descricao-produto"),
    desc_problema: getValue("f-descricao-problema"),
    parecer:       getValue("f-parecer"),
    desc_servico:  getValue("f-descricao-servico"),
    valor_servico: getValue("f-valor-servico"),
    valor_peca:    getValue("f-valor-peca"),
    pecas:         getValue("f-pecas"),
    situacao:      getValue("f-situacao"),
    progresso:     getValue("f-progresso"),
    recebido_por:  getValue("f-recebido-por"),
    entrada_data:  getValue("f-entrada-data"),
    entrada_hora:  getValue("f-entrada-hora"),
    saida_data:    getValue("f-saida-data"),
    saida_hora:    getValue("f-saida-hora"),
  };

  const qs  = Object.keys(params)
    .map(k => k + "=" + encodeURIComponent(params[k]))
    .join("&");

  jsonp(URL_API + "?" + qs, "cbSalvar", function (dados) {
    btn.disabled    = false;
    btn.innerHTML   = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Salvar OS`;

    if (dados.ok) {
      mostrarToast("OS salva com sucesso! ✓", "ok");
      setTimeout(mostrarLista, 1200);
    } else {
      mostrarToast("Erro ao salvar. Tente novamente.", "err");
    }
  });
}

/* ══════════════════════════════
   NAVEGAÇÃO
══════════════════════════════ */
function mostrarLista() {
  document.getElementById("secao-lista").style.display = "block";
  document.getElementById("secao-os").style.display    = "none";
  carregarLista();
}

function mostrarSecaoOS() {
  document.getElementById("secao-lista").style.display = "none";
  document.getElementById("secao-os").style.display    = "block";
  window.scrollTo(0, 0);
}

/* ══════════════════════════════
   HELPERS DE FORMULÁRIO
══════════════════════════════ */
function getValue(id) {
  return (document.getElementById(id).value || "").trim();
}

function setValue(id, val) {
  document.getElementById(id).value = val || "";
}

function limparForm() {
  const ids = [
    "f-cliente","f-telefone","f-email","f-documento",
    "f-produto","f-descricao-produto","f-descricao-problema","f-parecer",
    "f-descricao-servico","f-pecas","f-valor-servico","f-valor-peca",
    "f-recebido-por","f-entrada-data","f-entrada-hora",
    "f-saida-data","f-saida-hora"
  ];
  ids.forEach(id => setValue(id, ""));
  setValue("f-situacao", "RECEBIDO");
  setValue("f-progresso", "1");
  document.getElementById("valor-total-display").textContent = "R$ 0,00";
  document.getElementById("campo-recebido-por").style.display = "none";
  document.getElementById("campo-progresso").style.display    = "none";
}

function calcularTotal() {
  const s = parseFloat(getValue("f-valor-servico")) || 0;
  const p = parseFloat(getValue("f-valor-peca"))    || 0;
  document.getElementById("valor-total-display").textContent =
    "R$ " + (s + p).toFixed(2).replace(".", ",");
}

function onStatusChange() {
  const s = getValue("f-situacao");
  document.getElementById("campo-recebido-por").style.display =
    s === "ENTREGUE" ? "block" : "none";
  document.getElementById("campo-progresso").style.display =
    s === "SERVIÇO EM EXECUÇÃO" ? "block" : "none";
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
function mostrarToast(msg, tipo) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = "toast show " + tipo;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = "toast"; }, 3000);
}

/* ══════════════════════════════
   APAGAR OS
══════════════════════════════ */
function confirmarApagar() {
  document.getElementById("modal-apagar").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal-apagar").style.display = "none";
}

function apagarOS() {
  const btn = document.getElementById("btn-apagar-confirm");
  btn.disabled    = true;
  btn.textContent = "Apagando...";

  jsonp(URL_API + "?acao=apagarOS&os=" + osAtual, "cbApagar", function (dados) {
    fecharModal();
    if (dados.ok) {
      mostrarToast("OS apagada com sucesso.", "ok");
      setTimeout(mostrarLista, 1200);
    } else {
      btn.disabled    = false;
      btn.textContent = "Sim, apagar";
      mostrarToast("Erro ao apagar. Tente novamente.", "err");
    }
  });
}

/* ══════════════════════════════
   JSONP HELPER
══════════════════════════════ */
function jsonp(url, cb, fn) {
  window[cb] = function (data) { fn(data); delete window[cb]; };
  const s = document.createElement("script");
  s.src    = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
  s.onerror = function () { mostrarToast("Erro de conexão.", "err"); };
  document.body.appendChild(s);
}


/* ══════════════════════════════
   HISTÓRICO
══════════════════════════════ */
let _historicoCompleto = [];

function carregarHistorico() {
  const container = document.getElementById("hist-conteudo");
  container.innerHTML = '<div class="hist-loading"><div class="spinner-hist"></div><p>Carregando histórico...</p></div>';

  jsonp(URL_API + "?acao=listarHistorico", "cbHistorico", function (dados) {
    _historicoCompleto = dados.historico || [];
    renderHistorico(_historicoCompleto);
  });
}

function filtrarHistorico() {
  const busca = document.getElementById("busca-os").value.trim();
  document.getElementById("btn-limpar").style.display = busca ? "flex" : "none";

  if (!busca) {
    renderHistorico(_historicoCompleto);
    return;
  }

  const num = busca.replace(/^0+/, ""); // remove zeros à esquerda para comparação
  const filtrado = _historicoCompleto.filter(function (grupo) {
    const osNum = String(grupo.os).replace(/^0+/, "");
    return osNum.includes(num);
  });

  renderHistorico(filtrado, busca);
}

function limparBusca() {
  document.getElementById("busca-os").value = "";
  document.getElementById("btn-limpar").style.display = "none";
  renderHistorico(_historicoCompleto);
}

function renderHistorico(grupos, busca) {
  const container = document.getElementById("hist-conteudo");

  if (!grupos || grupos.length === 0) {
    container.innerHTML = `
      <div class="hist-vazio">
        <div class="hist-vazio-icon">🔍</div>
        <p>${busca ? "Nenhum resultado para OS #" + busca : "Nenhum histórico registrado."}</p>
      </div>`;
    return;
  }

  container.innerHTML = grupos.map(function (grupo, gi) {
    const eventos = grupo.eventos || [];
    const total   = eventos.length;

    const linhasTempo = eventos.map(function (ev, i) {
      const isPrimeiro = i === 0;
      const isUltimo   = i === total - 1;
      const classe = isPrimeiro ? "primeiro" : isUltimo ? "ultimo" : "";
      return `
        <div class="hist-evento ${classe}">
          <div class="hist-evento-card">
            <div class="hist-evento-top">
              <span class="hist-evento-status">${ev.evento || "—"}</span>
              <span class="hist-evento-tempo">${ev.data || ""} ${ev.hora ? "às " + ev.hora : ""}</span>
            </div>
          </div>
        </div>`;
    }).join("");

    return `
      <div class="hist-grupo" id="grupo-${gi}">
        <div class="hist-grupo-header" onclick="toggleGrupo(${gi})">
          <span class="hist-os-num">OS #${grupo.os}</span>
          <span class="hist-os-cliente">${grupo.cliente || ""}</span>
          <span class="hist-os-badge">${total} evento${total !== 1 ? "s" : ""}</span>
          <svg class="hist-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="hist-timeline">${linhasTempo}</div>
      </div>`;
  }).join("");
}

function toggleGrupo(index) {
  const grupo = document.getElementById("grupo-" + index);
  if (grupo) grupo.classList.toggle("collapsed");
}


/* ══════════════════════════════
   DRAWER MOBILE
══════════════════════════════ */
function abrirSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("show");
  document.body.style.overflow = "hidden";
}
 
function fecharSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("show");
  document.body.style.overflow = "";
}
 
function sincronizarBtnMenu() {
  const isMobile = window.innerWidth <= 700;
  const btnLista = document.getElementById("btn-menu");
  const btnForm  = document.getElementById("btn-menu-form");
  const lista    = document.getElementById("secao-lista");
  const form     = document.getElementById("secao-os");
  if (btnLista) btnLista.style.display = isMobile && lista.style.display !== "none" ? "flex" : "none";
  if (btnForm)  btnForm.style.display  = isMobile && form.style.display  !== "none" ? "flex" : "none";
}
 
window.addEventListener("resize", sincronizarBtnMenu);
window.addEventListener("load",   sincronizarBtnMenu);
document.addEventListener("keydown", function(e) { if (e.key === "Escape") fecharSidebar(); });


/* ══════════════════════════════
   START
══════════════════════════════ */
carregarLista();