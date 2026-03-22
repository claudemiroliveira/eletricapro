// Sistema de Trial de 7 dias

function pdfSafe(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^\x00-\x7F]/g, "");   // remove emoji e unicode
}
function updateTrialBanner() {
    const trialData = JSON.parse(localStorage.getItem(TRIAL_KEY));
    const startDate = new Date(trialData.startDate);
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = TRIAL_DAYS - diffDays;
    
    const banner = document.getElementById('trialBanner');
    const daysLeftSpan = document.getElementById('daysLeft');
    
    if (trialData.isPro) {
        banner.innerHTML = '🌟 Versão PRO Ativada';
        banner.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
    } else if (daysLeft > 0) {
        daysLeftSpan.textContent = daysLeft;
    } else {
        banner.innerHTML = '⚠️ Período de teste expirado - <a href="#" onclick="ativarPro()" style="color:white;text-decoration:underline;">Ativar versão PRO</a>';
        banner.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
    }
}

function checkTrialExpired() {
    const trialData = JSON.parse(localStorage.getItem(TRIAL_KEY));
    if (trialData.isPro) return false;
    
    const startDate = new Date(trialData.startDate);
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= TRIAL_DAYS) {
        alert('⚠️ Seu período de teste expirou! Ative a versão PRO para continuar usando.');
        return true;
    }
    return false;
}

function ativarPro() {
    if (confirm('🌟 Deseja ativar a versão PRO?\n\n✅ Acesso ilimitado a todas as funcionalidades\n✅ Sem anúncios\n✅ Suporte prioritário')) {
        const trialData = JSON.parse(localStorage.getItem(TRIAL_KEY));
        trialData.isPro = true;
        localStorage.setItem(TRIAL_KEY, JSON.stringify(trialData));
        updateTrialBanner();
        alert('🎉 Versão PRO ativada com sucesso!');
    }
}

// Navegação entre telas
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Navegação entre calculadoras
function showCalc(calcId) {
    const calcs = document.querySelectorAll('.calc-content');
    calcs.forEach(calc => calc.style.display = 'none');
    document.getElementById('calc' + calcId.charAt(0).toUpperCase() + calcId.slice(1)).style.display = 'block';
    
    const tabs = document.querySelectorAll('#calculadorasScreen .tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

// Navegação entre tabelas
function showTable(tableId) {
    const tables = document.querySelectorAll('.table-content');
    tables.forEach(table => table.style.display = 'none');
    document.getElementById('table' + tableId.charAt(0).toUpperCase() + tableId.slice(1)).style.display = 'block';
    
    const tabs = document.querySelectorAll('#tabelasScreen .tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

// CALCULADORAS

// Lei de Ohm
let lastCalcResults = {};

function calcularLeiOhm() {
    if (checkTrialExpired()) return;
    
    const tensao = parseFloat(document.getElementById('tensaoOhm').value) || 0;
    const corrente = parseFloat(document.getElementById('correnteOhm').value) || 0;
    const resistencia = parseFloat(document.getElementById('resistenciaOhm').value) || 0;
    
    let results = {};
    
    if (tensao && corrente && !resistencia) {
        results.resistencia = (tensao / corrente).toFixed(2);
    } else if (tensao && resistencia && !corrente) {
        results.corrente = (tensao / resistencia).toFixed(2);
    } else if (corrente && resistencia && !tensao) {
        results.tensao = (corrente * resistencia).toFixed(2);
    } else {
        alert('Preencha apenas 2 dos 3 campos!');
        return;
    }
    
    lastCalcResults.leiOhm = {
        tensao: tensao || results.tensao,
        corrente: corrente || results.corrente,
        resistencia: resistencia || results.resistencia
    };
    
    const resultDiv = document.getElementById('resultLeiOhm');
    resultDiv.innerHTML = `
        <div class="result-box">
            <h4>📊 Resultados</h4>
            <div class="result-item">
                <span>Tensão (V):</span>
                <strong>${lastCalcResults.leiOhm.tensao} V</strong>
            </div>
            <div class="result-item">
                <span>Corrente (I):</span>
                <strong>${lastCalcResults.leiOhm.corrente} A</strong>
            </div>
            <div class="result-item">
                <span>Resistência (R):</span>
                <strong>${lastCalcResults.leiOhm.resistencia} Ω</strong>
            </div>
        </div>
    `;
}

// Potência
function calcularPotencia() {
    if (checkTrialExpired()) return;
    
    const tensao = parseFloat(document.getElementById('tensaoPot').value);
    const corrente = parseFloat(document.getElementById('correntePot').value);
    const fator = parseFloat(document.getElementById('fatorPot').value);
    const tipo = document.getElementById('tipoCircuito').value;
    
    if (!tensao || !corrente || !fator) {
        alert('Preencha todos os campos!');
        return;
    }
    
    let potenciaAtiva, potenciaAparente, potenciaReativa;
    
    if (tipo === 'monofasico') {
        potenciaAparente = tensao * corrente;
        potenciaAtiva = potenciaAparente * fator;
        potenciaReativa = Math.sqrt(Math.pow(potenciaAparente, 2) - Math.pow(potenciaAtiva, 2));
    } else {
        potenciaAparente = Math.sqrt(3) * tensao * corrente;
        potenciaAtiva = potenciaAparente * fator;
        potenciaReativa = Math.sqrt(Math.pow(potenciaAparente, 2) - Math.pow(potenciaAtiva, 2));
    }
    
    lastCalcResults.potencia = {
        tipo: tipo === 'monofasico' ? 'Monofásico' : 'Trifásico',
        tensao: tensao,
        corrente: corrente,
        fator: fator,
        potenciaAtiva: potenciaAtiva.toFixed(2),
        potenciaAparente: potenciaAparente.toFixed(2),
        potenciaReativa: potenciaReativa.toFixed(2)
    };
    
    const resultDiv = document.getElementById('resultPotencia');
    resultDiv.innerHTML = `
        <div class="result-box">
            <h4>📊 Resultados - ${lastCalcResults.potencia.tipo}</h4>
            <div class="result-item">
                <span>Potência Ativa (P):</span>
                <strong>${lastCalcResults.potencia.potenciaAtiva} W</strong>
            </div>
            <div class="result-item">
                <span>Potência Aparente (S):</span>
                <strong>${lastCalcResults.potencia.potenciaAparente} VA</strong>
            </div>
            <div class="result-item">
                <span>Potência Reativa (Q):</span>
                <strong>${lastCalcResults.potencia.potenciaReativa} VAr</strong>
            </div>
        </div>
    `;
}

// Queda de Tensão
function calcularQuedaTensao() {
    if (checkTrialExpired()) return;
    
    const corrente = parseFloat(document.getElementById('correnteQueda').value);
    const distancia = parseFloat(document.getElementById('distanciaQueda').value);
    const secao = parseFloat(document.getElementById('secaoQueda').value);
    const tensao = parseFloat(document.getElementById('tensaoQueda').value);
    
    if (!corrente || !distancia || !secao || !tensao) {
        alert('Preencha todos os campos!');
        return;
    }
    
    // Resistividade do cobre a 20°C = 0.0172 Ω·mm²/m
    const resistividade = 0.0172;
    const resistencia = (resistividade * 2 * distancia) / secao;
    const quedaTensao = corrente * resistencia;
    const percentualQueda = (quedaTensao / tensao) * 100;
    
    let status = '';
    let statusClass = '';
    if (percentualQueda <= 4) {
        status = '✅ Dentro do limite (≤ 4%)';
        statusClass = 'success';
    } else {
        status = '❌ Acima do limite recomendado';
        statusClass = 'danger';
    }
    
    lastCalcResults.quedaTensao = {
        corrente: corrente,
        distancia: distancia,
        secao: secao,
        tensao: tensao,
        quedaTensao: quedaTensao.toFixed(2),
        percentual: percentualQueda.toFixed(2),
        status: status
    };
    
    const resultDiv = document.getElementById('resultQuedaTensao');
    resultDiv.innerHTML = `
        <div class="result-box">
            <h4>📊 Resultados</h4>
            <div class="result-item">
                <span>Queda de Tensão:</span>
                <strong>${lastCalcResults.quedaTensao.quedaTensao} V</strong>
            </div>
            <div class="result-item">
                <span>Percentual:</span>
                <strong>${lastCalcResults.quedaTensao.percentual}%</strong>
            </div>
            <div class="result-item">
                <span>Status:</span>
                <strong style="color: ${statusClass === 'success' ? 'green' : 'red'}">${status}</strong>
            </div>
        </div>
    `;
}

// Dimensionamento de Condutor
function dimensionarCondutor() {
    if (checkTrialExpired()) return;
    
    const potencia = parseFloat(document.getElementById('potenciaCondutor').value);
    const tensao = parseFloat(document.getElementById('tensaoCondutor').value);
    const distancia = parseFloat(document.getElementById('distanciaCondutor').value);
    const tipo = document.getElementById('tipoInstalacao').value;
    
    if (!potencia || !tensao || !distancia) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const corrente = potencia / tensao;
    
    // Tabela simplificada de capacidade de corrente
    const capacidades = {
        'B1': [
            {secao: 1.5, corrente: 15.5},
            {secao: 2.5, corrente: 21},
            {secao: 4, corrente: 28},
            {secao: 6, corrente: 36},
            {secao: 10, corrente: 50},
            {secao: 16, corrente: 68},
            {secao: 25, corrente: 89},
            {secao: 35, corrente: 110},
            {secao: 50, corrente: 134}
        ],
        'B2': [
            {secao: 1.5, corrente: 17.5},
            {secao: 2.5, corrente: 24},
            {secao: 4, corrente: 32},
            {secao: 6, corrente: 41},
            {secao: 10, corrente: 57},
            {secao: 16, corrente: 76},
            {secao: 25, corrente: 101},
            {secao: 35, corrente: 125},
            {secao: 50, corrente: 151}
        ],
        'C': [
            {secao: 1.5, corrente: 19.5},
            {secao: 2.5, corrente: 27},
            {secao: 4, corrente: 36},
            {secao: 6, corrente: 46},
            {secao: 10, corrente: 63},
            {secao: 16, corrente: 85},
            {secao: 25, corrente: 112},
            {secao: 35, corrente: 138},
            {secao: 50, corrente: 168}
        ]
    };
    
    let secaoRecomendada = null;
    const correnteComSeguranca = corrente * 1.25; // Fator de segurança
    
    for (let cap of capacidades[tipo]) {
        if (cap.corrente >= correnteComSeguranca) {
            secaoRecomendada = cap.secao;
            break;
        }
    }
    
    if (!secaoRecomendada) {
        secaoRecomendada = 50;
    }
    
    // Verificar queda de tensão
    const resistividade = 0.0172;
    const resistencia = (resistividade * 2 * distancia) / secaoRecomendada;
    const quedaTensao = corrente * resistencia;
    const percentualQueda = (quedaTensao / tensao) * 100;
    
    let recomendacao = '';
    if (percentualQueda > 4) {
        // Recalcular seção para atender queda de tensão
        const secaoMinQueda = (resistividade * 2 * distancia * corrente) / (tensao * 0.04);
        if (secaoMinQueda > secaoRecomendada) {
            const secoesDisponiveis = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
            for (let s of secoesDisponiveis) {
                if (s >= secaoMinQueda) {
                    secaoRecomendada = s;
                    break;
                }
            }
        }
        recomendacao = 'Seção ajustada para atender limite de queda de tensão de 4%';
    }
    
    const disjuntor = corrente <= 10 ? 10 : corrente <= 16 ? 16 : corrente <= 20 ? 20 : corrente <= 25 ? 25 : corrente <= 32 ? 32 : corrente <= 40 ? 40 : corrente <= 50 ? 50 : 63;
    
    lastCalcResults.condutor = {
        potencia: potencia,
        tensao: tensao,
        corrente: corrente.toFixed(2),
        secao: secaoRecomendada,
        disjuntor: disjuntor,
        quedaTensao: percentualQueda.toFixed(2),
        recomendacao: recomendacao
    };
    
    const resultDiv = document.getElementById('resultCondutor');
    resultDiv.innerHTML = `
        <div class="result-box">
            <h4>📊 Dimensionamento</h4>
            <div class="result-item">
                <span>Corrente calculada:</span>
                <strong>${lastCalcResults.condutor.corrente} A</strong>
            </div>
            <div class="result-item">
                <span>Seção recomendada:</span>
                <strong>${lastCalcResults.condutor.secao} mm²</strong>
            </div>
            <div class="result-item">
                <span>Disjuntor recomendado:</span>
                <strong>${lastCalcResults.condutor.disjuntor} A</strong>
            </div>
            <div class="result-item">
                <span>Queda de tensão:</span>
                <strong>${lastCalcResults.condutor.quedaTensao}%</strong>
            </div>
            ${recomendacao ? `<div style="margin-top:1rem;color:#ff9800;">⚠️ ${recomendacao}</div>` : ''}
        </div>
    `;
}

// ORÇAMENTOS
let itensOrcamento = [];

function adicionarItem() {
    if (checkTrialExpired()) return;
    
    const descricao = document.getElementById('itemDescricao').value;
    const quantidade = parseFloat(document.getElementById('itemQuantidade').value);
    const valor = parseFloat(document.getElementById('itemValor').value);
    
    if (!descricao || !quantidade || !valor) {
        alert('Preencha todos os campos do item!');
        return;
    }
    
    const item = {
        id: Date.now(),
        descricao: descricao,
        quantidade: quantidade,
        valorUnitario: valor,
        valorTotal: quantidade * valor
    };
    
    itensOrcamento.push(item);
    atualizarListaItens();
    
    // Limpar campos
    document.getElementById('itemDescricao').value = '';
    document.getElementById('itemQuantidade').value = '1';
    document.getElementById('itemValor').value = '';
}

function removerItem(id) {
    itensOrcamento = itensOrcamento.filter(item => item.id !== id);
    atualizarListaItens();
}

function atualizarListaItens() {
    const lista = document.getElementById('listaItens');
    const total = itensOrcamento.reduce((sum, item) => sum + item.valorTotal, 0);
    
    if (itensOrcamento.length === 0) {
        lista.innerHTML = '<p style="color:#757575;">Nenhum item adicionado</p>';
    } else {
        lista.innerHTML = itensOrcamento.map(item => `
            <div class="orcamento-item">
                <div>
                    <strong>${item.descricao}</strong><br>
                    <small>${item.quantidade} x R$ ${item.valorUnitario.toFixed(2)} = R$ ${item.valorTotal.toFixed(2)}</small>
                </div>
                <button onclick="removerItem(${item.id})">🗑️ Remover</button>
            </div>
        `).join('');
    }
    
    document.getElementById('totalOrcamento').textContent = `Total: R$ ${total.toFixed(2)}`;
}

// GERAÇÃO DE PDF
function gerarPDFCalc(tipo) {
    if (checkTrialExpired()) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(pdfSafe('⚡ Elétrico Pro'), 20, 20);
    doc.setFontSize(12);
    doc.text(pdfSafe('Relatório de Cálculo'), 20, 30);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(pdfSafe(`Cálculo: ${tipo}`), 20, 55);
    
    doc.setFontSize(10);
    doc.text(pdfSafe(`Data: ${new Date().toLocaleDateString('pt-BR')}`), 20, 62);
    doc.text(pdfSafe(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`), 20, 68);
    
    let yPos = 80;
    
    if (tipo === 'Lei de Ohm' && lastCalcResults.leiOhm) {
        const r = lastCalcResults.leiOhm;
        doc.text(pdfSafe(`Tensão (V): ${r.tensao} V`), 20, yPos);
        doc.text(pdfSafe(`Corrente (I): ${r.corrente} A`), 20, yPos + 7);
        doc.text(pdfSafe(`Resistência (R): ${r.resistencia} Ω`), 20, yPos + 14);
        doc.text(pdfSafe(`Fórmula: V = I × R`), 20, yPos + 25);
    } else if (tipo === 'Potência' && lastCalcResults.potencia) {
        const r = lastCalcResults.potencia;
        doc.text(pdfSafe(`Tipo de Circuito: ${r.tipo}`), 20, yPos);
        doc.text(pdfSafe(`Tensão: ${r.tensao} V`), 20, yPos + 7);
        doc.text(pdfSafe(`Corrente: ${r.corrente} A`), 20, yPos + 14);
        doc.text(pdfSafe(`Fator de Potência: ${r.fator}`), 20, yPos + 21);
        doc.text(pdfSafe(`Potência Ativa: ${r.potenciaAtiva} W`), 20, yPos + 28);
        doc.text(pdfSafe(`Potência Aparente: ${r.potenciaAparente} VA`), 20, yPos + 35);
        doc.text(pdfSafe(`Potência Reativa: ${r.potenciaReativa} VAr`), 20, yPos + 42);
    } else if (tipo === 'Queda de Tensão' && lastCalcResults.quedaTensao) {
        const r = lastCalcResults.quedaTensao;
        doc.text(pdfSafe(`Corrente: ${r.corrente} A`), 20, yPos);
        doc.text(pdfSafe(`Distância: ${r.distancia} m`), 20, yPos + 7);
        doc.text(pdfSafe(`Seção do condutor: ${r.secao} mm²`), 20, yPos + 14);
        doc.text(pdfSafe(`Tensão do circuito: ${r.tensao} V`), 20, yPos + 21);
        doc.text(pdfSafe(`Queda de Tensão: ${r.quedaTensao} V`), 20, yPos + 28);
        doc.text(pdfSafe(`Percentual: ${r.percentual}%`), 20, yPos + 35);
        doc.text(pdfSafe(`Status: ${r.status}`), 20, yPos + 42);
    } else if (tipo === 'Dimensionamento' && lastCalcResults.condutor) {
        const r = lastCalcResults.condutor;
        doc.text(pdfSafe(`Potência: ${r.potencia} W`), 20, yPos);
        doc.text(pdfSafe(`Tensão: ${r.tensao} V`), 20, yPos + 7);
        doc.text(pdfSafe(`Corrente calculada: ${r.corrente} A`), 20, yPos + 14);
        doc.text(pdfSafe(`Seção recomendada: ${r.secao} mm²`), 20, yPos + 21);
        doc.text(pdfSafe(`Disjuntor recomendado: ${r.disjuntor} A`), 20, yPos + 28);
        doc.text(pdfSafe(`Queda de tensão: ${r.quedaTensao}%`), 20, yPos + 35);
        if (r.recomendacao) {
            doc.text(pdfSafe(`Obs: ${r.recomendacao}`), 20, yPos + 42);
        }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(pdfSafe('Gerado por Elétrico Pro - www.eletricopro.com'), 105, 285, { align: 'center' });
    
    doc.save(`calculo_${tipo.replace(/ /g, '_')}_${Date.now()}.pdf`);
}

function gerarPDFTabela(tipo) {
    if (checkTrialExpired()) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(pdfSafe('⚡ Elétrico Pro'), 20, 20);
    doc.setFontSize(12);
    doc.text(pdfSafe('Tabelas Técnicas'), 20, 30);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(pdfSafe(`Tabela: ${tipo}`), 20, 55);
    
    doc.setFontSize(10);
    doc.text(pdfSafe(`Data: ${new Date().toLocaleDateString('pt-BR')}`), 20, 62);
    
    if (tipo === 'Condutores') {
        doc.autoTable({
            startY: 75,
            head: [['Seção (mm²)', 'Diâmetro (mm)', 'Peso (kg/km)', 'Resistência (Ω/km)']],
            body: [
                ['1,5', '1,38', '13,3', '12,1'],
                ['2,5', '1,78', '22,2', '7,41'],
                ['4', '2,25', '35,5', '4,61'],
                ['6', '2,76', '53,3', '3,08'],
                ['10', '3,57', '88,8', '1,83'],
                ['16', '4,51', '142', '1,15'],
                ['25', '5,64', '222', '0,727'],
                ['35', '6,68', '311', '0,524'],
                ['50', '7,98', '444', '0,387']
            ],
            headStyles: { fillColor: [25, 118, 210] }
        });
    } else if (tipo === 'Disjuntores') {
        doc.autoTable({
            startY: 75,
            head: [['Corrente (A)', 'Condutor Mín. (mm²)', 'Potência 127V (W)', 'Potência 220V (W)']],
            body: [
                ['10', '1,5', '1.270', '2.200'],
                ['16', '2,5', '2.032', '3.520'],
                ['20', '4', '2.540', '4.400'],
                ['25', '4', '3.175', '5.500'],
                ['32', '6', '4.064', '7.040'],
                ['40', '10', '5.080', '8.800'],
                ['50', '10', '6.350', '11.000'],
                ['63', '16', '8.001', '13.860'],
                ['70', '25', '8.890', '15.400']
            ],
            headStyles: { fillColor: [25, 118, 210] }
        });
    } else if (tipo === 'Capacidade de Corrente') {
        doc.autoTable({
            startY: 75,
            head: [['Seção (mm²)', 'Método B1 (A)', 'Método B2 (A)', 'Método C (A)']],
            body: [
                ['1,5', '15,5', '17,5', '19,5'],
                ['2,5', '21', '24', '27'],
                ['4', '28', '32', '36'],
                ['6', '36', '41', '46'],
                ['10', '50', '57', '63'],
                ['16', '68', '76', '85'],
                ['25', '89', '101', '112'],
                ['35', '110', '125', '138'],
                ['50', '134', '151', '168']
            ],
            headStyles: { fillColor: [25, 118, 210] }
        });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(pdfSafe('Gerado por Elétrico Pro - www.eletricopro.com'), 105, 285, { align: 'center' });
    
    doc.save(`tabela_${tipo.replace(/ /g, '_')}_${Date.now()}.pdf`);
}

function gerarPDFOrcamento() {
    if (checkTrialExpired()) return;
    
    const nomeCliente = document.getElementById('nomeCliente').value;
    const telefoneCliente = document.getElementById('telefoneCliente').value;
    const enderecoCliente = document.getElementById('enderecoCliente').value;
    
    if (!nomeCliente || itensOrcamento.length === 0) {
        alert('Preencha o nome do cliente e adicione pelo menos um item!');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text(pdfSafe('⚡ Elétrico Pro'), 20, 25);
    doc.setFontSize(14);
    doc.text('ORÇAMENTO', 20, 38);
    
    // Dados do Cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(pdfSafe('Dados do Cliente:'), 20, 65);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(pdfSafe(`Nome: ${nomeCliente}`), 20, 73);
    doc.text(pdfSafe(`Telefone: ${telefoneCliente}`), 20, 80);
    doc.text(pdfSafe(`Endereço: ${enderecoCliente}`), 20, 87);
    doc.text(pdfSafe(`Data: ${new Date().toLocaleDateString('pt-BR')}`), 20, 94);
    
    // Tabela de itens
    const tableData = itensOrcamento.map(item => [
        item.descricao,
        item.quantidade.toString(),
        `R$ ${item.valorUnitario.toFixed(2)}`,
        `R$ ${item.valorTotal.toFixed(2)}`
    ]);
    
    const total = itensOrcamento.reduce((sum, item) => sum + item.valorTotal, 0);
    
    doc.autoTable({
        startY: 105,
        head: [['Descrição', 'Qtd', 'Valor Unit.', 'Valor Total']],
        body: tableData,
        foot: [['', '', 'TOTAL:', `R$ ${total.toFixed(2)}`]],
        headStyles: { fillColor: [25, 118, 210] },
        footStyles: { fillColor: [76, 175, 80], fontStyle: 'bold', fontSize: 12 }
    });
    
    // Observações
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text(pdfSafe('Observações:'), 20, finalY);
    doc.text(pdfSafe('**'), 20, finalY + 7);
    doc.text(pdfSafe('- Condições de pagamento: A combinar'), 20, finalY + 14);
    doc.text(pdfSafe('**'), 20, finalY + 21);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(pdfSafe('Gerado por Elétrico Pro - www.eletricopro.com'), 105, 285, { align: 'center' });
    
    doc.save(`orcamento_${nomeCliente.replace(/ /g, '_')}_${Date.now()}.pdf`);

}

/* =========================
   FUNÇÃO DE TROCA DE TELAS
========================= */
function openScreen(screenId) {

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.getElementById(screenId).classList.add('active');
}

/* TORNA GLOBAL (IMPORTANTE) */
window.openScreen = openScreen;


/* =========================
   INICIALIZAÇÃO DO APP
========================= */
window.addEventListener('load', () => {
    initTrial();
});
fb.onAuthStateChanged(auth, async (user) => {

  if (user) {

    const userRef = fb.doc(db, "usuarios", user.uid);
    const snap = await fb.getDoc(userRef);

    if (snap.exists()) {

      const data = snap.data();

      if (data.pro === true) {

        localStorage.setItem("eletricapro_pro", "true");
        console.log("Usuário PRO liberado");

      }

    }

  }

});
