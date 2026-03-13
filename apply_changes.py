import re
from pathlib import Path

BASE = Path('/mnt/user-data/outputs/eletricapro_update')

# ---------------- index.html ----------------
index_path = BASE / 'index.html'
html = index_path.read_text(encoding='utf-8')

# 1) Add FREE limit (2/day) checks in calc functions
calc_map = {
  'calcularLeiOhm':      ('leiOhm', 'Lei de Ohm'),
  'calcularPotencia':    ('potencia', 'Potência'),
  'calcularQuedaTensao': ('quedaTensao', 'Queda de Tensão'),
  'dimensionarCondutor': ('dimensionamento', 'Dimensionamento'),
  'calcularConsumo':     ('consumo', 'Consumo'),
  'calcularDrDps':       ('drdps', 'DR/DPS'),
  'calcularEletroduto':  ('eletroduto', 'Eletroduto'),
  'calcularQuedaTrifasico': ('quedaTri', 'Queda Trifásico'),
  'calcularBitolaMotor': ('motor', 'Bitola Motor'),
  'calcularEnergiaMensal': ('energiaMes', 'Custo Energia'),
  'calcularConversao':   ('conversao', 'Conversão'),
  'calcularIluminacao':  ('iluminacao', 'Iluminação'),
  'calcularCurtoCircuito': ('curto', 'Curto-Circuito'),
  'calcularFatorDemanda': ('fatorDemanda', 'Fator de Demanda'),
}

def inject_guard_after_signature(text: str, fn: str, guard_line: str) -> str:
    # Find function signature and inject guard right after opening brace
    # Matches: function fn(...) { or function fn(...){
    pattern = re.compile(rf"(function\s+{re.escape(fn)}\s*\([^\)]*\)\s*\{{)\s*\n", re.M)
    def repl(m):
        sig = m.group(1)
        return sig + "\n" + guard_line + "\n"
    new_text, n = pattern.subn(repl, text, count=1)
    if n == 0:
        raise RuntimeError(f"Não achei assinatura da função: {fn}")
    return new_text

for fn, (key, label) in calc_map.items():
    guard = f"      if(!canUseFree('{key}', '{label}')) return;"
    html = inject_guard_after_signature(html, fn, guard)

# 2) PRO-only for PDF + WhatsApp
html = inject_guard_after_signature(html, 'gerarPDFCalc', "      if(!requirePro('Gerar PDF')) return;")
html = inject_guard_after_signature(html, 'gerarPDFTabela', "      if(!requirePro('Gerar PDF')) return;")
html = inject_guard_after_signature(html, 'gerarPDFOrcamento', "      if(!requirePro('Gerar PDF')) return;")
html = inject_guard_after_signature(html, 'enviarWhatsApp', "      if(!requirePro('Enviar por WhatsApp')) return;")

# 3) Histórico: salvar cálculo silencioso (PRO only), salvar orçamento com modal
# salvarCalculoHistorico(tipo, resumo) -> early return if not pro
html = re.sub(
    r"function\s+salvarCalculoHistorico\s*\(\s*tipo\s*,\s*resumo\s*\)\s*\{\s*\n",
    "function salvarCalculoHistorico(tipo, resumo){\n      if(!isProActive()) return; // Histórico é PRO\n",
    html,
    count=1,
    flags=re.M,
)

# salvarOrcamentoHistorico() -> require PRO (modal)
html = re.sub(
    r"function\s+salvarOrcamentoHistorico\s*\(\s*\)\s*\{\s*\n",
    "function salvarOrcamentoHistorico(){\n      if(!requirePro('Salvar no Histórico')) return;\n",
    html,
    count=1,
    flags=re.M,
)

# Extra safety: gate limpar/excluir/carregar
for fn in ['limparHistorico','excluirHistorico','carregarOrcamentoHistorico']:
    try:
        html = inject_guard_after_signature(html, fn, "      if(!requirePro('Histórico')) return;")
    except RuntimeError:
        # function might not exist in file, ignore
        pass

index_path.write_text(html, encoding='utf-8')

# ---------------- login.html ----------------
login_path = BASE / 'login.html'
login = login_path.read_text(encoding='utf-8')

# 1) Add countdown UI inside lifetime card (id=card-lifetime)
# Insert right after the lifetime price block (after </div> that closes plan-price)
# We'll target the line that contains '<div class="period">pagamento único</div>' within lifetime card.
needle = '<div class="period">pagamento único</div>'
if needle not in login:
    raise RuntimeError('Não achei o bloco do preço vitalício (period) no login.html')

login = login.replace(
    needle,
    needle + "\n        <div id=\"spicyCountdown\" class=\"spicy-countdown\">🔥 Oferta do <strong>Vitalício</strong> termina em <span id=\"spicyTime\">--:--:--</span></div>",
    1
)

# 2) Add CSS for spicy countdown before </style>
style_close = '</style>'
if style_close not in login:
    raise RuntimeError('Não achei </style> no login.html')

css = "\n    /* ── SPICY COUNTDOWN (Vitalício) ── */\n    .spicy-countdown{\n      margin-top:10px;\n      padding:10px 12px;\n      border-radius:12px;\n      background:linear-gradient(135deg, rgba(244,63,94,.18), rgba(168,85,247,.16));\n      border:1px solid rgba(244,63,94,.35);\n      color:#ffe4e6;\n      font-weight:700;\n      font-size:13px;\n      letter-spacing:.2px;\n      box-shadow:0 10px 26px rgba(244,63,94,.18);\n      animation: spicyPulse 1.2s ease-in-out infinite;\n    }\n    .spicy-countdown span{\n      font-variant-numeric: tabular-nums;\n      color:#fff;\n      background:rgba(0,0,0,.25);\n      padding:2px 8px;\n      border-radius:999px;\n      border:1px solid rgba(255,255,255,.15);\n      margin-left:6px;\n    }\n    @keyframes spicyPulse{\n      0%,100%{ transform:translateY(0); filter:saturate(1); }\n      50%{ transform:translateY(-1px); filter:saturate(1.25); }\n    }\n"

login = login.replace(style_close, css + "\n" + style_close, 1)

# 3) Add JS countdown near the end (before closing </script> of main module would be messy)
# We'll append a small script block before the final cloudflare beacon script tag.
marker = '<script defer src="https://static.cloudflareinsights.com/beacon.min.js'
if marker not in login:
    raise RuntimeError('Não achei o marcador do beacon para inserir o script do contador')

countdown_js = """
<script>
  // ── SPICY COUNTDOWN (Vitalício) ─────────────────────────────────────────
  // Observação: contador local (front-end) para dar urgência no plano vitalício.
  (function(){
    const el = document.getElementById('spicyTime');
    const box = document.getElementById('spicyCountdown');
    if(!el || !box) return;

    // Define um prazo persistente (ex.: 2h a partir do primeiro acesso)
    const KEY = 'eletricapro_lifetime_countdown_end';
    let end = Number(localStorage.getItem(KEY) || 0);
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    if(!end || end < now){
      end = now + TWO_HOURS;
      localStorage.setItem(KEY, String(end));
    }

    function pad(n){ return String(n).padStart(2,'0'); }
    function tick(){
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      if(diff <= 0){
        // reinicia com outro prazo curto
        end = Date.now() + TWO_HOURS;
        localStorage.setItem(KEY, String(end));
      }
    }
    tick();
    setInterval(tick, 1000);
  })();
</script>
"""

login = login.replace(marker, countdown_js + "\n" + marker, 1)

login_path.write_text(login, encoding='utf-8')

print('OK')
