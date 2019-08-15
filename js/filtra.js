var campoFiltro = document.querySelector("#pesquisar-paciente");

campoFiltro.addEventListener("click", function(){
    
    var pacientes = document.querySelectorAll(".paciente");
    var box = document.querySelector("#filtrar-tabela");
    if (box.value.length > 0){
            
        for (var i = 0; i < pacientes.length; i++) {
            var paciente = pacientes[i];
            var tdNome = paciente.querySelector(".info-nome");
            var nome = tdNome.textContent;
            var exp = new RegExp(box.value, "i");
            if (exp.test(nome)){
                paciente.classList.remove("invisivel");
            }
            else{
                paciente.classList.add("invisivel");
            }
        }
    }
else{
    removeInvisible();
}
 
});

function removeInvisible(){
    var pacientes = document.querySelectorAll(".paciente");
    for (var i = 0; i < pacientes.length; i++) {
        var paciente = pacientes[i];
        paciente.classList.remove("invisivel");
    }
}