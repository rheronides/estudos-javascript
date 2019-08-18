var buscaPaciente = document.querySelector("#buscar-pacientes");
buscaPaciente.addEventListener("click", function(){
    //Instancia objeto de requisição
    var xhr = new XMLHttpRequest();
    //Define o verbo e realizada chamada
    xhr.open("GET", "https://api-pacientes.herokuapp.com/pacientes");

    xhr.addEventListener("load", function(){
        var erroAjax = document.querySelector("#erro-ajax");
        //Caso a chamada retorne com sucesso
        if(xhr.status == 200){
            //Remove mensagem de erro da tela
            erroAjax.classList.add("invisivel");
            //Converte string de reposta em objeto
            pacientes = JSON.parse(xhr.responseText);
            //Adiciona paciente na tabela
            pacientes.forEach(function(paciente){
                adicionaPacienteNaTabela(paciente);
            });   
        }
        //Caso chamada retorne com erro, exibe mensagem de erro
        else{
            erroAjax.classList.remove("invisivel");
        } 
    });
    //Dispara chamada
    xhr.send();
});