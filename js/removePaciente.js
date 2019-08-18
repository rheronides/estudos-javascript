var table = document.querySelector("#tabela-pacientes");

table.addEventListener("dblclick", function(event){
    //Adiciona estilo na tag pai do objeto clicado
    event.target.parentNode.classList.add("fadeOut");

    setTimeout(function(){
      if(event.target.tagName == "TD") {
        event.target.parentNode.remove();
     }
    }, 500);

});