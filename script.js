// MENU HAMBÚRGUER
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
document.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", () => navLinks.classList.remove("active")));

// DARK/LIGHT MODE
const toggleThemeBtn = document.getElementById("toggle-theme");
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    atualizarChartColors();
});

// SALÁRIO
let salario = parseFloat(localStorage.getItem("salario")) || 0;
const salaryInput = document.getElementById("salary");
salaryInput.value = salario;
salaryInput.addEventListener("input", () => {
    salario = parseFloat(salaryInput.value) || 0;
    localStorage.setItem("salario", salario);
    atualizarTotais();
});

// DADOS INICIAIS
let gastoLabels = JSON.parse(localStorage.getItem("gastoLabels")) || ["Mercado", "Lazer", "Transporte", "Saúde", "Educação", "Contas"];
let gastoData = JSON.parse(localStorage.getItem("gastoData")) || [0,0,0,0,0,0];

let investLabels = JSON.parse(localStorage.getItem("investLabels")) || ["Cripto", "Ações", "Poupança", "FIIs", "Renda Fixa", "Outros"];
let investData = JSON.parse(localStorage.getItem("investData")) || [0,0,0,0,0,0];

let history = JSON.parse(localStorage.getItem("history")) || [];

// APORTE IDEAL
function calcularAporteIdeal() {
    const totalGastos = gastoData.reduce((a,b)=>a+b,0);
    const saldo = salario - totalGastos;
    let aporte = 0;

    if(salario <= 2000) aporte = salario * 0.15;
    else if(salario <= 5000) aporte = salario * 0.2;
    else aporte = salario * 0.25;

    return saldo >= aporte ? aporte : saldo > 0 ? saldo : 0;
}

// ATUALIZA TOTAL E SUGESTÃO
function atualizarTotais() {
    const totalGastos = gastoData.reduce((a,b)=>a+b,0);
    const totalInvestimentos = investData.reduce((a,b)=>a+b,0);
    const saldo = salario - totalGastos;

    document.getElementById("total-gastos").innerText = totalGastos.toFixed(2);
    document.getElementById("total-investimentos").innerText = totalInvestimentos.toFixed(2);
    document.getElementById("saldo").innerText = saldo.toFixed(2);

    // Atualiza sugestão de aporte
    document.getElementById("suggestion").innerText = "R$ " + calcularAporteIdeal().toFixed(2);

    // Atualiza gráficos
    gastosChart.update();
    investimentosChart.update();
    saldoChart.data.datasets[0].data = [salario, totalGastos, saldo];
    saldoChart.update();

    renderHistory(document.getElementById("period-filter").value);
}

// HISTÓRICO
function renderHistory(filter="all") {
    const tbody = document.getElementById("history-table").querySelector("tbody");
    tbody.innerHTML = "";
    const now = new Date();
    let filtered = history;

    if(filter === "today") filtered = history.filter(item => new Date(item.date).toDateString() === now.toDateString());
    else if(filter === "week") {
        const ws = new Date();
        ws.setDate(now.getDate() - now.getDay());
        filtered = history.filter(item => new Date(item.date) >= ws);
    } else if(filter === "month") {
        filtered = history.filter(item => {
            const d = new Date(item.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    }

    filtered.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.tipo}</td>
            <td>${item.categoria}</td>
            <td>R$ ${item.valor.toFixed(2)}</td>
            <td>${new Date(item.date).toLocaleString()}</td>
            <td><button class="delete-btn" data-index="${index}">Apagar</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-index"));
            const item = history[idx];
            if(!confirm("Tem certeza que deseja apagar este item?")) return;
            if(item.tipo === "Gasto") gastoData[gastoLabels.indexOf(item.categoria)] -= item.valor;
            else investData[investLabels.indexOf(item.categoria)] -= item.valor;
            history.splice(idx,1);
            salvarDados();
            atualizarTotais();
        });
    });
}

// FILTRO DE PERÍODO
document.getElementById("period-filter").addEventListener("change", (e)=>{
    renderHistory(e.target.value);
});

// BOTÃO LIMPAR TODOS OS DADOS
document.getElementById("clear-data").addEventListener("click", ()=>{
    if(!window.confirmedClear){
        if(!confirm("Tem certeza que deseja apagar TODOS os dados?")) return;
        window.confirmedClear = true;
    }

    // Reset categorias e dados para valores padrão
    gastoLabels = ["Mercado", "Lazer", "Transporte", "Saúde", "Educação", "Contas"];
    gastoData = [0,0,0,0,0,0];

    investLabels = ["Cripto", "Ações", "Poupança", "FIIs", "Renda Fixa", "Outros"];
    investData = [0,0,0,0,0,0];

    history = [];
    salario = 0;
    salaryInput.value = "";

    salvarDados();

    renderCategories(gastoLabels,"gasto-categories","gasto");
    renderCategories(investLabels,"invest-categories","investimentos");
    atualizarTotais();

    window.confirmedClear = false;
});

// SALVAR DADOS
function salvarDados() {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("gastoData", JSON.stringify(gastoData));
    localStorage.setItem("investData", JSON.stringify(investData));
    localStorage.setItem("gastoLabels", JSON.stringify(gastoLabels));
    localStorage.setItem("investLabels", JSON.stringify(investLabels));
    localStorage.setItem("salario", salario);
}

// GRÁFICOS
function getLabelColor(){ return document.body.classList.contains("dark")?"#fff":"#111"; }

const ctxGastos = document.getElementById('gastosChart').getContext('2d');
const gastosChart = new Chart(ctxGastos,{
    type:'doughnut',
    data:{ labels:gastoLabels, datasets:[{data:gastoData,backgroundColor:['#f43f5e','#ff6b6b','#fb7185','#f472b6','#fcd34d','#22d3ee']}] },
    options:{ responsive:true, plugins:{ legend:{position:'bottom', labels:{color:getLabelColor()}} } }
});

const ctxInvest = document.getElementById('investimentosChart').getContext('2d');
const investimentosChart = new Chart(ctxInvest,{
    type:'doughnut',
    data:{ labels:investLabels, datasets:[{data:investData,backgroundColor:['#22d3ee','#f43f5e','#ff6b6b','#f472b6','#fcd34d','#8b5cf6']}] },
    options:{ responsive:true, plugins:{ legend:{position:'bottom', labels:{color:getLabelColor()}} } }
});

const ctxSaldo = document.getElementById('saldoChart').getContext('2d');
const saldoChart = new Chart(ctxSaldo,{
    type:'bar',
    data:{ labels:['Salário','Gastos','Saldo'], datasets:[{label:'R$',data:[salario,gastoData.reduce((a,b)=>a+b,0),salario-gastoData.reduce((a,b)=>a+b,0)],backgroundColor:['#22d3ee','#f43f5e','#4ade80']}] },
    options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{y:{beginAtZero:true}} }
});

// CATEGORIAS
function renderCategories(labels, containerId, tipo){
    const container = document.getElementById(containerId);
    container.innerHTML="";
    labels.forEach((cat,idx)=>{
        const div = document.createElement("div");
        div.className="category";
        div.innerHTML=`
            <h3>${cat}</h3>
            <input type="number" placeholder="Adicionar valor">
            <button>Adicionar</button>
            <button class="remove-cat">Remover</button>
        `;
        container.appendChild(div);
        setupAddValue(div.querySelector("button"),tipo,idx);
        setupRemoveCategory(div.querySelector(".remove-cat"),tipo,idx);
    });
}

// ADICIONAR VALOR
function setupAddValue(button,tipo,index){
    button.addEventListener("click",()=>{
        const input = button.previousElementSibling;
        let valor = parseFloat(input.value);
        if(!isNaN(valor) && valor>0){
            const categoria = button.parentElement.querySelector("h3").innerText;
            const date = new Date();
            if(tipo==="gasto") gastoData[index]+=valor;
            else investData[index]+=valor;
            history.push({tipo:tipo==="gasto"?"Gasto":"Investimento",categoria,valor,date:date.toISOString()});
            salvarDados();
            input.value="";
            atualizarTotais();
        }
    });
}

// REMOVER CATEGORIA
function setupRemoveCategory(button,tipo,index){
    button.addEventListener("click",()=>{
        if(!confirm("Deseja remover esta categoria e todos os valores associados?")) return;
        const catName = button.parentElement.querySelector("h3").innerText;
        if(tipo==="gasto"){
            gastoData.splice(index,1);
            gastoLabels.splice(index,1);
        } else {
            investData.splice(index,1);
            investLabels.splice(index,1);
        }
        history = history.filter(item => !((tipo==="gasto"?item.tipo==="Gasto":item.tipo==="Investimento") && item.categoria===catName));
        salvarDados();
        renderCategories(tipo==="gasto"?gastoLabels:investLabels, tipo==="gasto"?"gasto-categories":"invest-categories", tipo);
        atualizarTotais();
    });
}

// ADICIONAR NOVA CATEGORIA
function addCategory(inputId, labelsArray, containerId, tipo){
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if(value!="" && !labelsArray.includes(value)){
        labelsArray.push(value);
        salvarDados();
        renderCategories(labelsArray, containerId, tipo);
        input.value="";
        atualizarTotais();
    }
}

// BOTÕES NOVA CATEGORIA
document.getElementById("add-gasto-category").addEventListener("click",()=> addCategory("new-gasto-category",gastoLabels,"gasto-categories","gasto"));
document.getElementById("add-invest-category").addEventListener("click",()=> addCategory("new-invest-category",investLabels,"invest-categories","investimentos"));

// RENDER INICIAL
renderCategories(gastoLabels,"gasto-categories","gasto");
renderCategories(investLabels,"invest-categories","investimentos");
atualizarTotais();

// ATUALIZA CORES DOS GRÁFICOS AO MUDAR MODO
function atualizarChartColors(){
    gastosChart.options.plugins.legend.labels.color = getLabelColor();
    investimentosChart.options.plugins.legend.labels.color = getLabelColor();
    gastosChart.update();
    investimentosChart.update();
}