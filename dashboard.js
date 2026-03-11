const URL_API = "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec";

/* ── verifica sessão ── */
if (!sessionStorage.getItem("iplace_logado")) {
  window.location.href = "admin-login.html";
}

function sair() {
  sessionStorage.removeItem("iplace_logado");
  window.location.href = "admin-login.html";
}

/* ══════════════════════════════
   CARREGAR DASHBOARD
══════════════════════════════ */
function carregarDashboard() {
  const btn = document.querySelector(".btn-atualizar");
  btn.classList.add("girando");

  jsonp(URL_API + "?acao=listarOS", "cbDash", function (dados) {
    btn.classList.remove("girando");

    if (!dados.lista) return;

    const lista = dados.lista;
    const agora = new Date();

    // helpers de data
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const hoje     = agora.toLocaleDateString("pt-BR");

    // ── MÉTRICAS ──
    let emExecucao   = 0;
    let concluidoMes = 0;
    let recebidosHoje = 0;
    let totalMes     = 0;
    let totalAno     = 0;

    const statusCount = {};
    const osHoje      = [];

    lista.forEach(function (os) {
      const sit = (os.situacao || "").toUpperCase();

      // em execução
      if (sit === "SERVIÇO EM EXECUÇÃO") emExecucao++;

      // concluídos no mês — usa saida_data
      if (sit === "SERVIÇO CONCLUÍDO" || sit === "ENTREGUE") {
        if (dentroDoMes(os.saida_data, mesAtual, anoAtual)) concluidoMes++;
      }

      // recebidos hoje
      if (os.entrada_data === hoje) {
        recebidosHoje++;
        osHoje.push(os);
      }

      // faturamento — só conta CONCLUÍDO ou ENTREGUE, filtra por saida_data
      if (sit === "SERVIÇO CONCLUÍDO" || sit === "ENTREGUE") {
        const vt = parseFloat(String(os.valor_total || "0").replace(",", ".")) || 0;
        if (dentroDoMes(os.saida_data, mesAtual, anoAtual)) totalMes += vt;
        if (dentroDoAno(os.saida_data, anoAtual)) totalAno += vt;
      }

      // contagem por status
      const s = os.situacao || "Sem status";
      statusCount[s] = (statusCount[s] || 0) + 1;
    });

    // ── PERÍODO ──
    const nomeMes = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    document.getElementById("dash-periodo").textContent =
      "Atualizado agora · " + nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

    // ── RENDERIZA CARDS ──
    renderCards({
      emExecucao,
      concluidoMes,
      recebidosHoje,
      totalMes,
      totalAno,
      total: lista.length
    });

    // ── RENDERIZA BARRAS ──
    renderBarras(statusCount, lista.length);

    // ── RENDERIZA OS HOJE ──
    renderHoje(osHoje);
  });
}

/* ══════════════════════════════
   RENDERIZAR CARDS
══════════════════════════════ */
function renderCards(m) {
  const container = document.getElementById("dash-cards");

  container.innerHTML = `
    ${card({
      label:    "Em Execução",
      value:    m.emExecucao,
      sub:      "agora em andamento",
      iconClass:"icon-execucao",
      icon:     iconWrench()
    })}
    ${card({
      label:    "Concluídos no Mês",
      value:    m.concluidoMes,
      sub:      "este mês",
      iconClass:"icon-concluido",
      icon:     iconCheck()
    })}
    ${card({
      label:    "Recebidos Hoje",
      value:    m.recebidosHoje,
      sub:      "entradas do dia",
      iconClass:"icon-hoje",
      icon:     iconCalendar()
    })}
    ${card({
      label:    "Faturamento do Mês",
      value:    "R$ " + m.totalMes.toFixed(2).replace(".", ","),
      sub:      "soma dos serviços concluídos",
      iconClass:"icon-mes",
      icon:     iconMoney(),
      destaque: true
    })}
    ${card({
      label:    "Faturamento no Ano",
      value:    "R$ " + m.totalAno.toFixed(2).replace(".", ","),
      sub:      "acumulado " + new Date().getFullYear(),
      iconClass:"icon-ano",
      icon:     iconTrend()
    })}
  `;
}

function card({ label, value, sub, iconClass, icon, destaque }) {
  return `
    <div class="dash-card${destaque ? " destaque" : ""}">
      <div class="dash-card-top">
        <span class="dash-card-label">${label}</span>
        <div class="dash-card-icon ${iconClass}">${icon}</div>
      </div>
      <div>
        <div class="dash-card-value">${value}</div>
        <div class="dash-card-sub">${sub}</div>
      </div>
    </div>`;
}

/* ══════════════════════════════
   RENDERIZAR BARRAS DE STATUS
══════════════════════════════ */
function renderBarras(statusCount, total) {
  const container = document.getElementById("status-bars");

  if (Object.keys(statusCount).length === 0) {
    container.innerHTML = '<div class="dash-vazio">Nenhum dado disponível.</div>';
    return;
  }

  // ordena por quantidade decrescente
  const ordenado = Object.entries(statusCount)
    .sort((a, b) => b[1] - a[1]);

  container.innerHTML = ordenado.map(function ([status, count]) {
    const pct      = total > 0 ? Math.round((count / total) * 100) : 0;
    const barColor = corBarra(status);
    return `
      <div class="status-bar-item">
        <span class="status-bar-nome">${status}</span>
        <div class="status-bar-track">
          <div class="status-bar-fill ${barColor}" style="width:${pct}%"></div>
        </div>
        <span class="status-bar-count">${count}</span>
      </div>`;
  }).join("");
}

function corBarra(s) {
  s = (s || "").toUpperCase();
  if (s === "RECEBIDO")            return "bar-recebido";
  if (s.includes("AGUARDANDO"))    return "bar-aguardando";
  if (s === "SERVIÇO EM EXECUÇÃO") return "bar-execucao";
  if (s === "SERVIÇO CONCLUÍDO")   return "bar-concluido";
  if (s === "SAIU PARA ENTREGA")   return "bar-saiu";
  if (s === "ENTREGUE")            return "bar-entregue";
  return "bar-recebido";
}

/* ══════════════════════════════
   RENDERIZAR OS HOJE
══════════════════════════════ */
function renderHoje(lista) {
  const container = document.getElementById("os-hoje-lista");

  if (lista.length === 0) {
    container.innerHTML = '<div class="dash-vazio">Nenhuma OS recebida hoje.</div>';
    return;
  }

  container.innerHTML = lista.map(function (os) {
    return `
      <div class="os-hoje-item">
        <span class="os-hoje-num">#${os.os}</span>
        <span class="os-hoje-cliente">${os.cliente || "—"}</span>
        <span class="os-hoje-hora">${os.entrada_hora || ""}</span>
      </div>`;
  }).join("");
}

/* ══════════════════════════════
   HELPERS DE DATA
══════════════════════════════ */
function dentroDoMes(dataStr, mes, ano) {
  if (!dataStr || dataStr === "—") return false;
  // formato dd/MM/yyyy
  const parts = dataStr.split("/");
  if (parts.length < 3) return false;
  return parseInt(parts[1]) - 1 === mes && parseInt(parts[2]) === ano;
}

function dentroDoAno(dataStr, ano) {
  if (!dataStr || dataStr === "—") return false;
  const parts = dataStr.split("/");
  if (parts.length < 3) return false;
  return parseInt(parts[2]) === ano;
}

/* ══════════════════════════════
   ÍCONES SVG
══════════════════════════════ */
function iconWrench() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>`;
}

function iconCheck() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;
}

function iconCalendar() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`;
}

function iconMoney() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>`;
}

function iconTrend() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>`;
}

/* ══════════════════════════════
   JSONP HELPER
══════════════════════════════ */
function jsonp(url, cb, fn) {
  window[cb] = function (data) { fn(data); delete window[cb]; };
  const s = document.createElement("script");
  s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
  s.onerror = function () {
    document.querySelector(".btn-atualizar").classList.remove("girando");
    console.error("Erro de conexão com a API.");
  };
  document.body.appendChild(s);
}

/* ══════════════════════════════
   START
══════════════════════════════ */
carregarDashboard();