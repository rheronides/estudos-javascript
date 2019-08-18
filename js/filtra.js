var campoFiltro = document.querySelector("#pesquisar-paciente");
//Adiciona evento de escuta no botão de pesquisa
campoFiltro.addEventListener("click", function(){
    var pacientes = document.querySelectorAll(".paciente");
    var box = document.querySelector("#filtrar-tabela");
    if (box.value.length > 0){
            
        for (var i = 0; i < pacientes.length; i++) {
            var paciente = pacientes[i];
            //Instancia regex 
            var exp = new RegExp(box.value, "i");
            //Verifica se valor digitado está na tabela e exibe na tabela
            if (exp.test(paciente.querySelector(".info-nome").textContent)){
                paciente.classList.remove("invisivel");
            }
            else{
                //Retira valores que não são iguais ao valor digitado no filtro
                paciente.classList.add("invisivel");
            }
        }
    }
    else{
        // Caso o filtro seja limpo, exibe todos os valores da lista
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