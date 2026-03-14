================================================================================
  README-IMPLEMENTACAO.txt
  ElétricaPro — Pacote Legal LGPD
  COFservicos · CNPJ 31.577.846/0001-12 · Iguape/SP
  Versão dos documentos: 2026-03-v1
================================================================================

ARQUIVOS INCLUÍDOS NESTE PACOTE
────────────────────────────────
  politica-de-privacidade.html   → Política de Privacidade (LGPD)
  termos-de-uso.html             → Termos de Uso
  etica-e-conformidade.html      → Ética & Conformidade
  consentimento-li-e-aceito.js   → Modal "Li e aceito" (bloqueio + localStorage)
  snippet-head.html              → Trecho para colar no <head> do index.html
  snippet-footer-links.html      → Rodapé legal para colar antes de </body>
  README-IMPLEMENTACAO.txt       → Este arquivo


COMO INSTALAR (PASSO A PASSO)
────────────────────────────────

PASSO 1 — Copie os arquivos para o seu site
  Coloque TODOS os arquivos na RAIZ do seu site:
  
    /eletricapro/
    ├── index.html                     ← já existe
    ├── manifest.json                  ← já existe
    ├── sw.js                          ← já existe
    ├── politica-de-privacidade.html   ← NOVO
    ├── termos-de-uso.html             ← NOVO
    ├── etica-e-conformidade.html      ← NOVO
    └── consentimento-li-e-aceito.js   ← NOVO

  Se quiser organizar em subpastas, ajuste os caminhos nos
  href/src de acordo.


PASSO 2 — Edite o index.html (ADICIONAR NO <head>)
  Abra seu index.html e localize a tag </head>.
  Cole ANTES dela:

    <!-- ElétricaPro · LGPD Consent Script -->
    <script src="consentimento-li-e-aceito.js" defer></script>
    <meta name="referrer" content="strict-origin-when-cross-origin">

  (O conteúdo completo está no arquivo snippet-head.html)


PASSO 3 — Edite o index.html (ADICIONAR NO RODAPÉ)
  Localize a tag </body> no index.html.
  Cole ANTES dela o conteúdo de snippet-footer-links.html.

  O rodapé ficará assim (exemplo):

    ...
    <footer class="ep-legal-footer">
      <div class="ep-legal-brand">⚡ ElétricaPro</div>
      <div class="ep-legal-links">
        <a href="politica-de-privacidade.html">🔒 Política de Privacidade</a>
        <a href="termos-de-uso.html">📋 Termos de Uso</a>
        <a href="etica-e-conformidade.html">🤝 Ética & Conformidade</a>
        <a href="mailto:eletricaproapp@gmail.com">✉ Suporte</a>
      </div>
      <div class="ep-legal-copy">
        © 2026 COFservicos · CNPJ 31.577.846/0001-12 · Iguape/SP
      </div>
    </footer>
    </body>
    </html>


PASSO 4 — Publique no GitHub Pages
  Faça commit e push de todos os novos arquivos:

    git add politica-de-privacidade.html termos-de-uso.html \
            etica-e-conformidade.html consentimento-li-e-aceito.js
    git commit -m "feat: adiciona documentos legais LGPD + modal aceite"
    git push origin main

  Aguarde ~1 min e acesse seu site — o modal aparecerá!


COMO FUNCIONA O MODAL "LI E ACEITO"
────────────────────────────────────
  • Ao abrir o app, o script verifica se o usuário já aceitou a versão
    atual dos termos (LEGAL_VERSION = '2026-03-v1').
  
  • Se ainda não aceitou → exibe modal bloqueando o uso até aceitar.
  
  • O usuário lê os links, marca o checkbox e clica em "Confirmar".
  
  • O aceite é salvo no localStorage com:
      - aceito: true
      - versao: '2026-03-v1'
      - data: (ISO 8601)
      - ua: (User-Agent resumido)
  
  • Na próxima abertura, o modal não aparece mais.
  
  PARA FORÇAR NOVO ACEITE (ex: quando atualizar os textos):
    Abra consentimento-li-e-aceito.js e altere a linha:
      var LEGAL_VERSION = '2026-03-v1';
    Para algo como:
      var LEGAL_VERSION = '2026-06-v2';
    Faça deploy — todos os usuários verão o modal novamente.


COMPATIBILIDADE COM PWA (manifest.json + sw.js)
────────────────────────────────────────────────
  O script foi desenvolvido para PWA:
  
  • Funciona ANTES do Firebase Auth ser carregado (defer garante isso).
  • Não interfere no Service Worker (sw.js).
  • O localStorage é a melhor forma de salvar consentimento em PWA
    (cookies podem ser bloqueados em alguns contextos standalone).
  • Quando o app é adicionado à tela inicial (standalone mode),
    o modal funciona normalmente.


COMPATIBILIDADE COM FIREBASE AUTH (CDN)
─────────────────────────────────────────
  O Firebase Auth é carregado no final do index.html via CDN.
  O script de consentimento usa "defer" → executa APÓS o DOM estar
  pronto, mas não bloqueia o carregamento do Firebase.
  
  Ordem de execução:
    1. HTML/CSS carregados
    2. consentimento-li-e-aceito.js executado (modal aparece se necessário)
    3. Firebase Auth CDN carregado
    4. Usuário aceita os termos → app fica disponível


DADOS DO CONTROLADOR (para referência)
────────────────────────────────────────
  Razão Social:  COFservicos
  CNPJ:          31.577.846/0001-12
  Responsável:   CPF 338.951.628-09
  Cidade/UF:     Iguape/SP
  E-mail:        eletricaproapp@gmail.com
  Versão legal:  2026-03-v1


DÚVIDAS?
────────
  Entre em contato: eletricaproapp@gmail.com

================================================================================
  Gerado em: março de 2026
  © COFservicos — Todos os direitos reservados
================================================================================
