var botaoAdicionar = document.querySelector("#adicionar-paciente");
botaoAdicionar.addEventListener("click", function(event){
    //Remove comportamento padrão do botão
    event.preventDefault();
    var form = document.querySelector("#form-adiciona");
    var paciente = obtemDadosdoPaciente(form);
    //Valida erros
    var erros = validaPaciente(paciente);
    //Caso retorne erro, exibe na tela
    if (erros.length>0){
        exibeMsgErro(erros);
        return;
    }
    adicionaPacienteNaTabela(paciente);
    form.reset();

    //Remove erros da tela
    document.querySelector(".msgerro").innerHTML = "";

    removeInvisible();

    var filtro = document.querySelector("#filtrar-tabela");
    filtro.value = "";
})

function obtemDadosdoPaciente(form) {
    var paciente = {
        nome: form.nome.value,
        peso: form.peso.value,
        altura: form.altura.value,
        gordura: form.gordura.value,
        imc: calculaImc(form.peso.value, form.altura.value)
    }

    return paciente;
}

function montaTd(dado, classe){
    var td = document.createElement("td");
    td.classList.add(classe);
    td.textContent = dado;

    return td;
}

function montaTr(paciente){
    var pacienteTr = document.createElement("tr");
    pacienteTr.classList.add("paciente");
    pacienteTr.appendChild(montaTd(paciente.nome, "info-nome"));
    pacienteTr.appendChild(montaTd(paciente.peso, "info-peso"));
    pacienteTr.appendChild(montaTd(paciente.altura, "info-altura"));
    pacienteTr.appendChild(montaTd(paciente.gordura, "info-gordura"));
    pacienteTr.appendChild(montaTd(paciente.imc, "info-imc"));

    return pacienteTr;
}

function exibeMsgErro(erros){
    var ul = document.querySelector(".msgerro");
    ul.innerHTML = "";
    
    erros.forEach(function(erro){
        var li = document.createElement("li");
        li.textContent = erro;
        ul.appendChild(li);
    });
}

function validaPaciente(paciente){
    var erros = [];

    if(paciente.nome.length == 0){
        erros.push("O nome não pode ser em branco");
    }
    if(isNaN(paciente.gordura)){
        erros.push("Percentual de gordura deve ser numérico");
    }
    if(paciente.gordura.length == 0){
        erros.push("A gordura não pode ser em branco");
    }
    if(paciente.peso.length == 0){
        erros.push("O peso não pode ser em branco");
    }
    if(paciente.altura.length == 0){
        erros.push("A altura não pode ser em branco");
    }
    if(!validaPeso(paciente.peso)){
        erros.push("Peso inválido");
    }
    if(!validaAltura(paciente.altura)){
        erros.push("Altura inválida");
    }

    return erros;
}

function adicionaPacienteNaTabela(paciente) {
    var pacienteTr = montaTr(paciente);
    var tabela = document.querySelector("#tabela-pacientes");
    tabela.appendChild(pacienteTr);
}