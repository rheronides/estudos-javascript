var pacientes = document.querySelectorAll(".paciente");
//Realiza validação por paciente
pacientes.forEach(function(paciente){
    // Pega valores das tags
    var peso = paciente.querySelector(".info-peso").textContent;
    var altura = paciente.querySelector(".info-altura").textContent;
    // Calcula imc
    var imc = peso / (altura * altura);
    var tdImc = paciente.querySelector(".info-imc");

    if (!validaPeso(peso)){
        tdImc.textContent = "Peso Inválido";
        pesoEhValido = false;
        paciente.classList.add("paciente-invalido");
    }
    if (!validaAltura(altura)){
        tdImc.textContent = "Altura Inválida";
        alturaEhValida = false;
        paciente.classList.add("paciente-invalido");
    }
    if(validaPeso(peso) && validaAltura(altura)){
        tdImc.textContent = imc.toFixed(2);
        tdImc.textContent = calculaImc(peso, altura);
    }  
});

function calculaImc(peso, altura){
    var imc = 0;
    imc = peso/(altura*altura);
    return imc.toFixed(2);
}

function validaPeso(peso){
    if (peso > 0 && peso < 1000){
        return true;
    }else{
        return false;
        }
}

function validaAltura(altura){
    if(altura > 0 && altura <= 3.000){
        return true;
    }else{
        return false;
    }
}

