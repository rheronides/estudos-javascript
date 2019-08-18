var buscaPaciente = document.querySelector("#buscar-pacientes");
buscaPaciente.addEventListener("click", function(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api-pacientes.herokuapp.com/pacientes");
  
    xhr.addEventListener("load", function(){
        var erroAjax = document.querySelector("#erro-ajax");
        
        if(xhr.status == 200){
            erroAjax.classList.add("invisivel");
            pacientes = JSON.parse(xhr.responseText);
            pacientes.forEach(function(paciente){
                adicionaPacienteNaTabela(paciente);
            });   
        }
        else{
            console.log("passa");
            erroAjax.classList.remove("invisivel");
        } 
    });
    xhr.send();
});