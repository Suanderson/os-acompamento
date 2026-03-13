const URL_API  = "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec";
const URL_SITE = "https://suanderson.github.io/os-acompamento/";
const ENDERECO = "Tabocas, Espírito Santo - RN";

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function jsonp(url, cb, fn) {
  window[cb] = function(data) { fn(data); delete window[cb]; };
  const s = document.createElement("script");
  s.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cb;
  s.onerror = function() {
    document.getElementById("loading").textContent = "Erro ao carregar OS.";
  };
  document.body.appendChild(s);
}

function formatarMoeda(v) {
  const n = parseFloat(v) || 0;
  return "R$ " + n.toFixed(2).replace(".", ",");
}

function gerarQRUrl(osNum) {
  const url = URL_SITE + "?os=" + osNum;
  return "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(url);
}

function renderOS(d) {
  const folha = document.getElementById("folha");

  let linhasPecas = "";
  const total = parseFloat(d.valor_total) || 0;

  if (d.desc_servico || d.valor_servico) {
    linhasPecas += `
      <tr>
        <td>${d.desc_servico || "Serviço"}</td>
        <td>${formatarMoeda(d.valor_servico)}</td>
      </tr>`;
  }
  if (d.pecas || d.valor_peca) {
    linhasPecas += `
      <tr>
        <td>${d.pecas || "Peças"}</td>
        <td>${formatarMoeda(d.valor_peca)}</td>
      </tr>`;
  }
  if (!linhasPecas) {
    linhasPecas = `<tr class="tabela-vazia"><td colspan="2">Nenhum item registrado</td></tr>`;
  }

  const recebimento = d.entrada_data
    ? (d.entrada_data + (d.entrada_hora ? ", " + d.entrada_hora : ""))
    : "—";

  folha.innerHTML = `
    <!-- CABEÇALHO -->
    <div class="cab">
      <div class="cab-titulo">ORDEM<br>DE SERVIÇO</div>
      <div class="cab-logo">
        <img src="Logo.png" alt="SI" onerror="this.style.display='none'"/>
        <div class="cab-logo-texto">Suanderson<br>Informática</div>
      </div>
    </div>

    <!-- OS + QR -->
    <div class="info-topo">
      <div class="info-topo-esq">
        <div class="tag">Ordem de Serviço N°: <strong>${d.os}</strong></div>
        <div class="tag">Recebimento: <strong>${recebimento}</strong></div>
      </div>
      <div class="qr-wrap">
        <img src="${gerarQRUrl(d.os)}" alt="QR Code"/>
        <small>Acompanhe seu Atendimento</small>
      </div>
    </div>

    <!-- CLIENTE -->
    <div class="secao">
      <div class="secao-titulo">Informações do Cliente</div>
      <div class="linha-dupla">
        <div class="linha-dado"><span class="label">Nome:</span> <strong>${d.cliente || "—"}</strong></div>
        <div class="linha-dado"><span class="label">Telefone:</span> <strong>${d.telefone || "—"}</strong></div>
      </div>
      <div class="linha-dupla">
        <div class="linha-dado"><span class="label">Email:</span> <strong>${d.email || "—"}</strong></div>
        <div class="linha-dado"><span class="label">Documento:</span> <strong>${d.documento || "—"}</strong></div>
      </div>
    </div>

    <!-- PRODUTO -->
    <div class="secao">
      <div class="secao-titulo">Informações do Produto</div>
      <div class="linha-dado"><span class="label">Produto:</span> <strong>${d.produto || "—"}</strong></div>
      <div class="linha-dado"><span class="label">Detalhes:</span> <strong>${d.desc_produto || "—"}</strong></div>
    </div>

    <!-- PROBLEMA + PARECER -->
    <div class="secao">
      <div class="linha-dado" style="margin-bottom:6px">
        <strong>Descrição do Problema:</strong>
      </div>
      <div class="area-texto">${d.desc_problema || '<div class="area-vazia"></div>'}</div>
      <div class="linha-dado" style="margin-top:8px;margin-bottom:6px">
        <strong>Parecer Técnico:</strong>
      </div>
      <div class="area-texto">${d.parecer || '<div class="area-vazia"></div>'}</div>
    </div>

    <!-- PEÇAS E SERVIÇOS -->
    <div class="secao" style="flex:1">
      <div class="secao-titulo">Peças e Serviços</div>
      <table class="tabela-pecas">
        <thead>
          <tr><th>Descrição</th><th>Valor</th></tr>
        </thead>
        <tbody>${linhasPecas}</tbody>
      </table>
      <div class="total-row">TOTAL: ${formatarMoeda(total)}</div>
    </div>

    <!-- RODAPÉ -->
    <div class="rodape">
      ${ENDERECO} — ${URL_SITE}
    </div>
  `;
}

/* ── INIT ── */
const osNum = getParam("os");
if (!osNum) {
  document.getElementById("loading").textContent = "Nenhuma OS informada na URL.";
} else {
  const url = URL_API + "?acao=buscarOS&os=" + osNum;
  jsonp(url, "cbImprimir", function(dados) {
    if (!dados.encontrado) {
      document.getElementById("loading").textContent = "OS não encontrada.";
      return;
    }
    renderOS(dados);
    setTimeout(function() {
      if (getParam("print") === "1") window.print();
    }, 800);
  });
}