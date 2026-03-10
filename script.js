function consultarOS() {
  let os = document.getElementById("os").value.trim();
  let telefone = document.getElementById("telefone").value.trim();

  document.getElementById("resultado").innerHTML = "";
  document.getElementById("loading").style.display = "block";

  let url =
    "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec?acao=consultarOS&os=" +
    os +
    "&telefone=" +
    telefone +
    "&callback=mostrarResultado";

  let script = document.createElement("script");
  script.src = url;
  document.body.appendChild(script);
}

function mostrarResultado(dados) {
  document.getElementById("loading").style.display = "none";

  if (!dados.encontrado) {
    document.getElementById("resultado").innerHTML = `
      <div class="erro-card">
        <div class="erro-icon">🔍</div>
        <p>Ordem de serviço não encontrada.<br>Verifique os dados e tente novamente.</p>
      </div>
    `;
    return;
  }

  /* status dot class */
  let dotClass = "aguardando";
  if (dados.situacao === "SERVIÇO EM EXECUÇÃO") dotClass = "em-execucao";
  if (dados.situacao === "ENTREGUE") dotClass = "entregue";

  let html = `<div class="os-card">`;

  html += `<p class="os-eyebrow">Ordem de Serviço</p>`;
  html += `<p class="os-number">#${dados.os}</p>`;

  html += `
    <div class="os-row">
      <span class="label">Situação atual</span>
      <div>
        <span class="status-badge">
          <span class="status-dot ${dotClass}"></span>
          ${dados.situacao}
        </span>
      </div>
    </div>
  `;

  html += `<div class="os-divider"></div>`;

  html += `
    <div class="os-row">
      <span class="label">Serviço</span>
      <span class="value">${dados.produto}</span>
    </div>
    <div class="os-row">
      <span class="label">Entrada</span>
      <span class="value">${dados.entrada_data} às ${dados.entrada_hora}</span>
    </div>
    <div class="os-row">
      <span class="label">Saída prevista</span>
      <span class="value">${dados.saida_data || "—"}</span>
    </div>
  `;

  /* barra de progresso */
  if (dados.situacao === "SERVIÇO EM EXECUÇÃO") {
    let progresso = Number(dados.progresso) || 0;
    html += `<div class="os-divider"></div>`;
    html += `<div class="os-row"><span class="label">Progresso do serviço</span></div>`;
    html += `<div class="barra">`;
    for (let i = 1; i <= 5; i++) {
      html += `<div class="quad ${i <= progresso ? "ativo" : ""}"></div>`;
    }
    html += `</div>`;
  }

  /* entregue */
  if (dados.situacao === "ENTREGUE") {
    html += `<div class="os-divider"></div>`;
    html += `
      <div class="os-row">
        <span class="label">Recebido por</span>
        <span class="value">${dados.recebido_por}</span>
      </div>
    `;
  }

  html += `</div>`;

  document.getElementById("resultado").innerHTML = html;
}