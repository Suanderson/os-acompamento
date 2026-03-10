function consultarOS(){

let os = document.getElementById("os").value
let telefone = document.getElementById("telefone").value

document.getElementById("resultado").innerHTML = ""
document.getElementById("loading").style.display = "block"

let url = "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec?acao=consultarOS&os="+os+"&telefone="+telefone+"&callback=mostrarResultado"

let script = document.createElement("script")
script.src = url

document.body.appendChild(script)

}

function mostrarResultado(dados){

document.getElementById("loading").style.display = "none"

if(!dados.encontrado){

document.getElementById("resultado").innerHTML =
"Ordem de serviço não encontrada"

return
}

let html = ""

html += "<h2>ORDEM DE SERVIÇO</h2>"

html += "<h1>"+dados.os+"</h1>"

html += "<p>Situação atual:<br>"+dados.situacao+"</p>"

html += "<p>Serviço:<br>"+dados.produto+"</p>"

html += "<p>Entrada:<br>"+dados.entrada_data+" - "+dados.entrada_hora+"</p>"

html += "<p>Saída:<br>"+(dados.saida_data || "---")+"</p>"



/* BARRA DE PROGRESSO */

if(dados.situacao == "SERVIÇO EM EXECUÇÃO"){

let progresso = Number(dados.progresso) || 0

html += "<div class='barra'>"

for(let i=1;i<=5;i++){

if(i <= progresso){

html += "<div class='quad ativo'></div>"

}else{

html += "<div class='quad'></div>"

}

}

html += "</div>"

}





/* ENTREGUE */

if(dados.situacao == "ENTREGUE"){

html += "<p>Recebido por:<br>"+dados.recebido_por+"</p>"

}

document.getElementById("resultado").innerHTML = html

}
