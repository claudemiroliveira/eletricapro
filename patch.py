import re
from pathlib import Path

BASE = Path('/home/user/eletricapro')


def patch_manifest():
    p = BASE/'manifest.json'
    s = p.read_text(encoding='utf-8')
    # start_url to login screen
    s = re.sub(r'"start_url"\s*:\s*"[^"]*"', '"start_url": "/eletricapro/login.html?start=1"', s)
    p.write_text(s, encoding='utf-8')


def patch_sw():
    p = BASE/'sw.js'
    s = p.read_text(encoding='utf-8')
    # bump cache version
    s = re.sub(r'const CACHE_NAME = "eletricapro-v(\d+)";', lambda m: f'const CACHE_NAME = "eletricapro-v{int(m.group(1))+1}";', s)
    # ensure cache includes required files
    if '"./consentimento-li-e-aceito.js"' not in s:
        s = s.replace('  "./app.js",', '  "./app.js",\n  "./consentimento-li-e-aceito.js",\n  "./politica-de-privacidade.html",\n  "./termos-de-uso.html",\n  "./etica-e-conformidade.html",')
    p.write_text(s, encoding='utf-8')


def patch_index():
    p = BASE/'index.html'
    s = p.read_text(encoding='utf-8')

    # Update PRO button link to open plans
    s = s.replace("onclick=\"window.location.href='login.html'\"", "onclick=\"window.location.href='login.html?planos=1'\"", 1)

    # Fix 'etica.html' link
    s = s.replace('href="etica.html"', 'href="etica-e-conformidade.html"')

    # Add auth guard + pro status subscription by replacing the firebase module script block near the end.
    # Find module script that imports firebase-app and firebase-auth only.
    pattern = re.compile(r"<script type=\"module\">\s*import \{ initializeApp \} from \"https://www\.gstatic\.com/firebasejs/12\.10\.0/firebase-app\.js\";\s*import \{ getAuth, onAuthStateChanged \} from \"https://www\.gstatic\.com/firebasejs/12\.10\.0/firebase-auth\.js\";.*?</script>", re.S)

    repl = '''<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCibrDhAmeTg-2W9TiXhomotfLEM5EqwgE",
  authDomain: "eletrica-pro.firebaseapp.com",
  projectId: "eletrica-pro",
  storageBucket: "eletrica-pro.firebasestorage.app",
  messagingSenderId: "318733768519",
  appId: "1:318733768519:web:93e0bdcdecd49b9570de62"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Guard: app só abre logado ──────────────────────────────────
const container = document.querySelector('.container');
const header = document.getElementById('appHeader');

function setLockedUI(){
  // evita “flash” do app antes do redirect
  if(container) container.style.display = 'none';
  if(header) header.style.display = 'none';
}

function setUnlockedUI(){
  if(container) container.style.display = '';
  if(header) header.style.display = '';
}

setLockedUI();

function setProBadge(isPro, proType){
  const btn = document.getElementById('upgradeBtnHome');
  if(!btn) return;
  if(isPro){
    const label = ({monthly:'Mensal', annual:'Anual', lifetime:'Vitalício'})[proType] || 'PRO';
    btn.style.background = 'linear-gradient(135deg, #f5c518 0%, #f59e0b 55%, #ffe29a 100%)';
    btn.style.borderColor = '#f5c518';
    btn.querySelector('.pro-badge').textContent = 'PRO';
    btn.querySelector('.pro-btn-text strong').textContent = `👑 PRO Ativo — ${label}`;
    btn.querySelector('.pro-btn-text small').textContent = 'Acesso liberado nesta conta';
    btn.querySelector('.pro-arrow').textContent = '✓';
  } else {
    btn.removeAttribute('style');
    btn.querySelector('.pro-badge').textContent = 'PRO';
    btn.querySelector('.pro-btn-text strong').textContent = 'Ativar Versão PRO';
    btn.querySelector('.pro-btn-text small').textContent = 'Mensal R$19,90 · Anual R$59,90 · Vitalício R$99,90';
    btn.querySelector('.pro-arrow').textContent = '→';
  }
}

function setUserChip(user){
  const nameEl = document.getElementById('userNameShort');
  const avatar = document.getElementById('userAvatarIcon');
  if(!nameEl || !avatar) return;
  const name = (user.displayName || user.email || 'Conta');
  nameEl.textContent = name.length > 14 ? name.slice(0, 14) + '…' : name;
  avatar.textContent = '✅';
}

onAuthStateChanged(auth, (user) => {
  if(!user){
    setLockedUI();
    // abre sempre no login
    window.location.replace('login.html?start=1');
    return;
  }

  setUserChip(user);
  setUnlockedUI();

  // acompanha status PRO em tempo real
  const ref = doc(db, 'users', user.uid);
  onSnapshot(ref, (snap) => {
    if(!snap.exists()) { setProBadge(false); return; }
    const data = snap.data() || {};
    setProBadge(!!data.pro, data.proType);
  });
});
</script>'''

    s, n = pattern.subn(repl, s)
    if n != 1:
        raise SystemExit(f'Não consegui substituir o bloco Firebase do index.html (ocorrências={n}).')

    # ── Add new calculator tiles to Calculadoras home (after Custo Energia tile)
    tile_insertion_marker = "<div class=\"sub-tile\" onclick=\"openScreen('calcEnergiaMes','Custo de Energia Mensal')\">"
    idx = s.find(tile_insertion_marker)
    if idx == -1:
        raise SystemExit('Não encontrei marcador da tile calcEnergiaMes no index.html')

    # Insert after the closing div of calcEnergiaMes tile
    # Find end of that tile block
    after = s.find('</div>\n      </div>\n    </div>\n\n    <!-- ========== CALC:', idx)
    # This "after" points to start of next calc screen. We'll instead insert tiles just before the end of sub-grid.
    # Safer: insert before "</div>\n    </div>\n\n    <!-- ========== CALC: LEI DE OHM"
    marker2 = "      </div>\n    </div>\n\n    <!-- ========== CALC: LEI DE OHM ========== -->"
    pos2 = s.find(marker2)
    if pos2 == -1:
        raise SystemExit('Não encontrei marcador final do grid de calculadoras')

    extra_tiles = '''
        <!-- Novas calculadoras (2026) -->
        <div class="sub-tile" onclick="openScreen('calcCorrente','Corrente do Circuito')">
          <div class="s-icon">🧷</div>
          <div class="s-text"><strong>Corrente</strong><span>Monofásico / Trifásico</span></div>
        </div>
        <div class="sub-tile" onclick="openScreen('calcCapacitores','Correção de FP')">
          <div class="s-icon">🟦</div>
          <div class="s-text"><strong>Banco de Capacitores</strong><span>kVAr necessário</span></div>
        </div>
        <div class="sub-tile" onclick="openScreen('calcCaboPerdas','Perdas no Cabo')">
          <div class="s-icon">🔥</div>
          <div class="s-text"><strong>Perdas</strong><span>ΔV + W no cabo</span></div>
        </div>
        <div class="sub-tile" onclick="openScreen('calcBtu','BTU ↔ W')">
          <div class="s-icon">🌡️</div>
          <div class="s-text"><strong>BTU/h</strong><span>Conversão para W</span></div>
        </div>
'''

    s = s[:pos2] + extra_tiles + s[pos2:]

    # Add new calculator screens before the Lei de Ohm screen marker
    screen_marker = "    <!-- ========== CALC: LEI DE OHM ========== -->"
    pos = s.find(screen_marker)
    if pos == -1:
        raise SystemExit('Não encontrei marcador de início da Lei de Ohm')

    new_screens = '''

    <!-- ========== CALC: CORRENTE (NOVO) ========== -->
    <div id="calcCorrente" class="screen">
      <div class="screen-title"><div class="dot"></div>Corrente do Circuito</div>
      <div class="calc-card">
        <h3>🧷 Corrente (I)</h3>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Útil para estimar a corrente do circuito e auxiliar no dimensionamento do disjuntor.</p>
        <div class="form-group"><label>Potência (kW):</label><input type="number" id="potKwCorr" placeholder="Ex: 5.5" step="0.01"></div>
        <div class="form-group"><label>Tensão (V):</label><input type="number" id="tensaoCorr" placeholder="Ex: 220" value="220"></div>
        <div class="form-group"><label>Fator de Potência (cos φ):</label><input type="number" id="fpCorr" placeholder="Ex: 0.92" step="0.01" value="0.92"></div>
        <div class="form-group"><label>Rendimento (η) (opcional):</label><input type="number" id="etaCorr" placeholder="Ex: 0.90" step="0.01" value="1"></div>
        <div class="form-group"><label>Tipo de Circuito:</label>
          <select id="tipoCorr">
            <option value="mono">Monofásico</option>
            <option value="tri">Trifásico</option>
          </select>
        </div>
        <button class="btn" onclick="calcularCorrenteCircuito()">⚡ Calcular</button>
        <button class="btn btn-yellow" onclick="gerarPDFCalc('Corrente do Circuito')">📄 PDF</button>
        <div id="resultCorrente"></div>
      </div>
    </div>

    <!-- ========== CALC: BANCO DE CAPACITORES (NOVO) ========== -->
    <div id="calcCapacitores" class="screen">
      <div class="screen-title"><div class="dot"></div>Correção de Fator de Potência</div>
      <div class="calc-card">
        <h3>🟦 Banco de Capacitores (kVAr)</h3>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Calcula o reativo (kVAr) aproximado para elevar o FP de um valor atual para um desejado.</p>
        <div class="form-group"><label>Potência ativa (kW):</label><input type="number" id="potKwCap" placeholder="Ex: 10" step="0.01"></div>
        <div class="form-group"><label>FP atual (cos φ1):</label><input type="number" id="fpAtualCap" placeholder="Ex: 0.72" step="0.01" value="0.72"></div>
        <div class="form-group"><label>FP desejado (cos φ2):</label><input type="number" id="fpDesejCap" placeholder="Ex: 0.92" step="0.01" value="0.92"></div>
        <button class="btn" onclick="calcularBancoCapacitores()">⚡ Calcular</button>
        <button class="btn btn-yellow" onclick="gerarPDFCalc('Correção de FP')">📄 PDF</button>
        <div id="resultCapacitores"></div>
      </div>
    </div>

    <!-- ========== CALC: PERDAS NO CABO (NOVO) ========== -->
    <div id="calcCaboPerdas" class="screen">
      <div class="screen-title"><div class="dot"></div>Perdas no Cabo</div>
      <div class="calc-card">
        <h3>🔥 Perdas (ΔV e W) no cabo</h3>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Estimativa rápida com resistividade típica (20°C). Para projetos críticos, use dados do fabricante e correções de temperatura.</p>
        <div class="form-group"><label>Material:</label>
          <select id="matCabo">
            <option value="cu">Cobre</option>
            <option value="al">Alumínio</option>
          </select>
        </div>
        <div class="form-group"><label>Seção (mm²):</label><input type="number" id="secCabo" placeholder="Ex: 6" step="0.1" value="6"></div>
        <div class="form-group"><label>Comprimento (m) (ida):</label><input type="number" id="lenCabo" placeholder="Ex: 30" value="30"></div>
        <div class="form-group"><label>Corrente (A):</label><input type="number" id="iCabo" placeholder="Ex: 25" value="25"></div>
        <div class="form-group"><label>Tensão do circuito (V):</label><input type="number" id="vCabo" placeholder="Ex: 220" value="220"></div>
        <button class="btn" onclick="calcularPerdasCabo()">⚡ Calcular</button>
        <button class="btn btn-yellow" onclick="gerarPDFCalc('Perdas no Cabo')">📄 PDF</button>
        <div id="resultCaboPerdas"></div>
      </div>
    </div>

    <!-- ========== CALC: BTU ↔ W (NOVO) ========== -->
    <div id="calcBtu" class="screen">
      <div class="screen-title"><div class="dot"></div>BTU/h ↔ W</div>
      <div class="calc-card">
        <h3>🌡️ Conversor BTU/h ↔ W</h3>
        <div class="form-group"><label>Valor:</label><input type="number" id="valorBtu" placeholder="Ex: 9000" step="1"></div>
        <div class="form-group"><label>Converter:</label>
          <select id="tipoBtu">
            <option value="btu2w">BTU/h → W</option>
            <option value="w2btu">W → BTU/h</option>
          </select>
        </div>
        <button class="btn" onclick="calcularBTU()">⚡ Converter</button>
        <button class="btn btn-yellow" onclick="gerarPDFCalc('BTU ↔ W')">📄 PDF</button>
        <div id="resultBtu"></div>
      </div>
    </div>
'''

    s = s[:pos] + new_screens + s[pos:]

    # Add JS functions right after calcularLeiOhm definition marker? We'll append before INIT section.
    init_marker = "    /* ======================== INIT ======================== */"
    posj = s.find(init_marker)
    if posj == -1:
        raise SystemExit('Não encontrei marcador INIT no index.html')

    new_js = '''

    // ─────────────────────────────────────────────────────────
    // NOVAS CALCULADORAS (2026)
    // ─────────────────────────────────────────────────────────

    function calcularCorrenteCircuito(){
      const PkW = parseFloat(document.getElementById('potKwCorr').value);
      const V   = parseFloat(document.getElementById('tensaoCorr').value);
      const fp  = parseFloat(document.getElementById('fpCorr').value || '1');
      const eta = parseFloat(document.getElementById('etaCorr').value || '1');
      const tipo= document.getElementById('tipoCorr').value;

      if(!PkW || !V){
        document.getElementById('resultCorrente').innerHTML = `<div class="result-box err">⚠️ Informe pelo menos Potência e Tensão.</div>`;
        return;
      }

      const P = PkW * 1000;
      const denom = (tipo === 'tri') ? (Math.sqrt(3) * V * fp * eta) : (V * fp * eta);
      const I = P / denom;

      const disj = Math.ceil(I/5)*5; // arredonda p/ múltiplo de 5A
      document.getElementById('resultCorrente').innerHTML = `
        <div class="result-box ok">
          <strong>Corrente estimada:</strong> ${I.toFixed(2)} A<br/>
          <span style="opacity:.85">Sugestão rápida de disjuntor (aprox.):</span> ${disj} A
        </div>`;
      salvarHistorico('Corrente do Circuito', `I ≈ ${I.toFixed(2)} A | Sug. disj.: ${disj} A`);
    }

    function calcularBancoCapacitores(){
      const PkW = parseFloat(document.getElementById('potKwCap').value);
      const fp1 = parseFloat(document.getElementById('fpAtualCap').value);
      const fp2 = parseFloat(document.getElementById('fpDesejCap').value);

      if(!PkW || !fp1 || !fp2){
        document.getElementById('resultCapacitores').innerHTML = `<div class="result-box err">⚠️ Preencha todos os campos.</div>`;
        return;
      }
      if(fp1 >= 1 || fp2 >= 1 || fp1 <= 0 || fp2 <= 0){
        document.getElementById('resultCapacitores').innerHTML = `<div class="result-box err">⚠️ FP deve estar entre 0 e 1.</div>`;
        return;
      }
      if(fp2 <= fp1){
        document.getElementById('resultCapacitores').innerHTML = `<div class="result-box err">⚠️ O FP desejado deve ser maior que o atual.</div>`;
        return;
      }

      const phi1 = Math.acos(fp1);
      const phi2 = Math.acos(fp2);
      const kvar = PkW * (Math.tan(phi1) - Math.tan(phi2));

      document.getElementById('resultCapacitores').innerHTML = `
        <div class="result-box ok">
          <strong>Reativo necessário:</strong> ${kvar.toFixed(2)} kVAr<br/>
          <span style="opacity:.85">(Valor aproximado para correção de FP)</span>
        </div>`;
      salvarHistorico('Correção de FP', `kVAr ≈ ${kvar.toFixed(2)}`);
    }

    function calcularPerdasCabo(){
      const mat = document.getElementById('matCabo').value;
      const A   = parseFloat(document.getElementById('secCabo').value);
      const L   = parseFloat(document.getElementById('lenCabo').value);
      const I   = parseFloat(document.getElementById('iCabo').value);
      const V   = parseFloat(document.getElementById('vCabo').value);

      if(!A || !L || !I || !V){
        document.getElementById('resultCaboPerdas').innerHTML = `<div class="result-box err">⚠️ Preencha seção, comprimento, corrente e tensão.</div>`;
        return;
      }

      // Resistividade típica (Ω·mm²/m)
      const rho = (mat === 'al') ? 0.0282 : 0.0172;
      const R = rho * (2*L) / A; // ida e volta
      const dV = I * R;
      const dVperc = (dV / V) * 100;
      const perdasW = (I**2) * R;

      document.getElementById('resultCaboPerdas').innerHTML = `
        <div class="result-box ok">
          <strong>Resistência do trecho (ida+volta):</strong> ${R.toFixed(4)} Ω<br/>
          <strong>Queda de tensão:</strong> ${dV.toFixed(2)} V (${dVperc.toFixed(2)}%)<br/>
          <strong>Perdas:</strong> ${perdasW.toFixed(1)} W
        </div>`;
      salvarHistorico('Perdas no Cabo', `ΔV ≈ ${dV.toFixed(2)} V (${dVperc.toFixed(2)}%) | P≈${perdasW.toFixed(1)}W`);
    }

    function calcularBTU(){
      const val = parseFloat(document.getElementById('valorBtu').value);
      const tipo = document.getElementById('tipoBtu').value;
      if(!val){
        document.getElementById('resultBtu').innerHTML = `<div class="result-box err">⚠️ Informe um valor.</div>`;
        return;
      }
      // 1 BTU/h ≈ 0,29307107 W
      let out, unit;
      if(tipo === 'btu2w'){
        out = val * 0.29307107;
        unit = 'W';
      } else {
        out = val / 0.29307107;
        unit = 'BTU/h';
      }
      document.getElementById('resultBtu').innerHTML = `<div class="result-box ok"><strong>Resultado:</strong> ${out.toFixed(2)} ${unit}</div>`;
      salvarHistorico('BTU ↔ W', `${out.toFixed(2)} ${unit}`);
    }
'''

    s = s[:posj] + new_js + s[posj:]

    p.write_text(s, encoding='utf-8')


def patch_login():
    p = BASE/'login.html'
    s = p.read_text(encoding='utf-8')

    # Fix lifetime button typo and price label consistency
    s = s.replace('id="btnLifetime">♾ Pagarfont 99,90', 'id="btnLifetime">♾ Pagar R$ 99,90')
    s = s.replace('Vitalício (R$ 89,90)', 'Vitalício (R$ 99,90)')

    # Add a small payment confirmation CTA after opening PicPay
    # Insert placeholder section right after the plans grid closing (before the "BOTÃO CONTINUAR" comment)
    marker = '<!-- BOTÃO CONTINUAR PARA O APP -->'
    if marker not in s:
        raise SystemExit('Não encontrei marcador para inserir seção de confirmação no login.html')

    confirm_block = '''

  <!-- ── CONFIRMAÇÃO APÓS PAGAMENTO (para liberação automática via Firebase Functions) ── -->
  <div id="afterPayBox" style="display:none;max-width:860px;margin:18px auto 0;padding:0 20px;">
    <div style="border:1px solid var(--border);background:linear-gradient(135deg,var(--surface),var(--surface2));border-radius:var(--radius);padding:14px 14px;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="font-size:22px;">✅</div>
        <div style="flex:1;">
          <strong style="display:block;">Pagamento aberto</strong>
          <span style="color:var(--muted);font-size:13px;line-height:1.45;">
            Após concluir o pagamento no PicPay, clique em <b>"Já paguei"</b> para registrar a ativação.
            Se o projeto estiver com a <b>Cloud Function</b> habilitada, o PRO é liberado automaticamente em segundos.
          </span>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button id="btnJaPaguei" class="plan-btn annual" style="flex:1;">✅ Já paguei</button>
        <button id="btnFecharAfterPay" class="plan-btn" style="flex:1;background:#2e3350;color:#e2e8f0;">Fechar</button>
      </div>
    </div>
  </div>

'''
    s = s.replace(marker, confirm_block + marker)

    # Replace payment link direct open handlers with selecting plan and showing afterPayBox
    # We'll keep PAYMENT_LINKS but change onclicks.
    s = re.sub(r'\$\("btnMonthly"\)\.onclick\s*=\s*\(\)\s*=>\s*window\.open\(PAYMENT_LINKS\.monthly,\s*"_blank"\);', '$("btnMonthly").onclick  = () => openPayment("monthly");', s)
    s = re.sub(r'\$\("btnAnnual"\)\.onclick\s*=\s*\(\)\s*=>\s*window\.open\(PAYMENT_LINKS\.annual,\s*"_blank"\);', '$("btnAnnual").onclick   = () => openPayment("annual");', s)
    s = re.sub(r'\$\("btnLifetime"\)\.onclick\s*=\s*\(\)\s*=>\s*window\.open\(PAYMENT_LINKS\.lifetime,\s*"_blank"\);', '$("btnLifetime").onclick = () => openPayment("lifetime");', s)

    # Add openPayment() + auto redirect logic
    insert_point = s.find('// ── PAYMENT LINKS')
    if insert_point == -1:
        raise SystemExit('Não encontrei bloco PAYMENT LINKS no login.html')

    add_js = '''

// ── CONTROLE DE FLUXO (start / planos) ───────────────────────
const params = new URLSearchParams(location.search);
const OPEN_PLANS = params.get('planos') === '1';

function maybeAutoRedirect(){
  // Se o app foi aberto para login normal (PWA/start), redireciona para o app assim que logar.
  if(!OPEN_PLANS){
    setTimeout(() => {
      // evita loop se o usuário quiser ficar aqui
      if (currentUser) window.location.replace('index.html');
    }, 450);
  }
}

let selectedPlan = null;
function openPayment(plan){
  selectedPlan = plan;
  window.open(PAYMENT_LINKS[plan], '_blank');
  const box = document.getElementById('afterPayBox');
  if(box) box.style.display = 'block';
  toast('Abra o PicPay e conclua o pagamento.');
}

// "Já paguei" cria a solicitação no Firestore.
// Se você tiver a Cloud Function de auto-aprovação, isso ativa o PRO automaticamente.
$("btnJaPaguei") && ($("btnJaPaguei").onclick = () => {
  if(!selectedPlan) return toast('Selecione um plano primeiro.', true);
  requestPro(selectedPlan);
});
$("btnFecharAfterPay") && ($("btnFecharAfterPay").onclick = () => {
  const box = document.getElementById('afterPayBox');
  if(box) box.style.display = 'none';
});
'''

    # place add_js right before PAYMENT LINKS block to ensure functions exist
    s = s[:insert_point] + add_js + s[insert_point:]

    # Trigger auto redirect inside onAuthStateChanged when user logged and OPEN_PLANS is false
    # We'll inject call after subscribeUser(user.uid);
    s = s.replace('    subscribeUser(user.uid);', '    subscribeUser(user.uid);\n    maybeAutoRedirect();')

    p.write_text(s, encoding='utf-8')


def write_cloud_functions():
    # Firestore-triggered auto approval (no PicPay validation). Optional.
    func_dir = BASE/'firebase-functions'
    func_dir.mkdir(exist_ok=True)

    (func_dir/'package.json').write_text('''{
  "name": "eletricapro-functions",
  "private": true,
  "engines": { "node": "18" },
  "dependencies": {
    "firebase-admin": "^12.1.0",
    "firebase-functions": "^5.0.1"
  }
}
''', encoding='utf-8')

    (func_dir/'index.js').write_text('''/*
  ElétricaPro — Liberação PRO automática (opcional)

  COMO FUNCIONA:
  1) O usuário paga no PicPay (link abre pelo front)
  2) O usuário clica em "Já paguei" no login.html
  3) O front cria um documento em Firestore: pro_requests/{id} com status "pending"
  4) Esta Cloud Function aprova automaticamente e atualiza users/{uid}

  IMPORTANTE:
  - Este fluxo NÃO valida o pagamento no PicPay (é um auto-aprovação).
  - Para validação real, seria necessário integrar API/webhook do PicPay.
*/

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

function addDays(date, days){
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

exports.autoApprovePro = onDocumentCreated('pro_requests/{requestId}', async (event) => {
  const snap = event.data;
  if(!snap) return;
  const req = snap.data() || {};

  const { uid, plan, status } = req;
  if(!uid || !plan) return;
  if(status && status !== 'pending') return;

  const now = new Date();
  let proUntil = null;

  if(plan === 'monthly') proUntil = addDays(now, 30);
  if(plan === 'annual')  proUntil = addDays(now, 365);
  if(plan === 'lifetime') proUntil = null;

  const userRef = admin.firestore().doc(`users/${uid}`);
  const reqRef  = snap.ref;

  await admin.firestore().runTransaction(async (tx) => {
    tx.set(userRef, {
      pro: true,
      proType: plan,
      proUntil: proUntil ? admin.firestore.Timestamp.fromDate(proUntil) : null,
      proActivatedAt: admin.firestore.Timestamp.fromDate(now)
    }, { merge: true });

    tx.set(reqRef, {
      status: 'approved',
      approvedAt: admin.firestore.Timestamp.fromDate(now)
    }, { merge: true });
  });
});
''', encoding='utf-8')

    (func_dir/'README.txt').write_text('''ElétricaPro — Firebase Functions (opcional)

Objetivo:
- Aprovar automaticamente solicitações PRO criadas em Firestore (coleção pro_requests)

Como usar (resumo):
1) Dentro do seu projeto Firebase, inicialize Functions:
   firebase init functions
2) Copie esta pasta "firebase-functions" para a pasta "functions" do seu projeto.
3) Instale dependências e faça deploy:
   npm install
   firebase deploy --only functions

Observação:
- Este exemplo NÃO valida pagamento no PicPay.
- É uma auto-aprovação baseada no clique "Já paguei".
''', encoding='utf-8')


def main():
    patch_manifest()
    patch_sw()
    patch_index()
    patch_login()
    write_cloud_functions()
    print('OK')

if __name__ == '__main__':
    main()
