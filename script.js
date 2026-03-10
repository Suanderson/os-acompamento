function consultarOS(){

let os = document.getElementById("os").value
let telefone = document.getElementById("telefone").value

let url = "https://script.google.com/macros/s/AKfycbyGIGOxXHGtxXj5b4WHxbIU7IluC-Y7JWuZR_o1Dz0/exec?acao=consultarOS&os="+os+"&telefone="+telefone+"&callback=mostrarResultado"

let script = document.createElement("script")
script.src = url

document.body.appendChild(script)

}

function mostrarResultado(dados){

document.getElementById("resultado").innerHTML =
"<pre>"+JSON.stringify(dados,null,2)+"</pre>"

}
