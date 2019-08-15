var titulo = document.querySelector(".titulo");
titulo.textContent = "Aparecida Nutricionista";

var pacientes = document.querySelectorAll(".paciente");

for (var i=0; i < pacientes.length; i++){
   var paciente = pacientes[i];
var tdPeso = paciente.querySelector(".info-peso");
var tdAltura = paciente.querySelector(".info-altura");
var peso = tdPeso.textContent;
var altura = tdAltura.textContent;
var imc = peso / (altura * altura);
var tdImc = paciente.querySelector(".info-imc");
var pesoEhValido, alturaEhValida;
pesoEhValido = validaPeso(peso);
 alturaEhValida = validaAltura(altura);

if (!pesoEhValido){
    tdImc.textContent = "Peso Inválido";
    pesoEhValido = false;
    paciente.classList.add("paciente-invalido");
}
if (!alturaEhValida){
    tdImc.textContent = "Altura Inválida";
    alturaEhValida = false;
    paciente.classList.add("paciente-invalido");
}
if(pesoEhValido && alturaEhValida){
    tdImc.textContent = imc.toFixed(2);
    tdImc.textContent = calculaImc(peso, altura);
}   


}

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

