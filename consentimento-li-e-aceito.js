/**
 * consentimento-li-e-aceito.js
 * ElétricaPro — COFservicos
 * Modal "Li e aceito" com bloqueio de uso até aceite (LGPD)
 *
 * Como funciona:
 *  - Ao abrir o app, verifica se o usuário já aceitou a versão atual dos termos.
 *  - Se não aceitou (ou versão mudou), exibe modal bloqueando o uso.
 *  - Ao marcar o checkbox e clicar em "Confirmar", salva o aceite no localStorage.
 *  - Para forçar novo aceite no futuro: altere LEGAL_VERSION abaixo.
 *
 * Instalação:
 *  1. Coloque este arquivo na raiz do seu site (ou /js/).
 *  2. No <head> do index.html, adicione:
 *       <script src="consentimento-li-e-aceito.js" defer></script>
 *  3. Pronto — funciona automaticamente.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     CONFIGURAÇÃO — edite aqui quando precisar
  ───────────────────────────────────────── */
  var LEGAL_VERSION = '2026-03-v2';       // Mude para forçar novo aceite
  var STORAGE_KEY   = 'ep_legal_aceite';  // Chave no localStorage
  var BLOQUEAR_USO  = true;               // true = bloqueia app até aceitar

  /* ─────────────────────────────────────────
     VERIFICAÇÃO — já aceitou esta versão?
  ───────────────────────────────────────── */
  function jaAceitou() {
    try {
      var salvo = localStorage.getItem(STORAGE_KEY);
      if (!salvo) return false;
      var obj = JSON.parse(salvo);
      return obj && obj.versao === LEGAL_VERSION && obj.aceito === true;
    } catch (e) {
      return false;
    }
  }

  /* ─────────────────────────────────────────
     SALVAR ACEITE
  ───────────────────────────────────────── */
  function salvarAceite() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        aceito: true,
        versao: LEGAL_VERSION,
        data:   new Date().toISOString(),
        ua:     navigator.userAgent.substring(0, 120)
      }));
    } catch (e) {
      console.warn('[ElétricaPro] Não foi possível salvar o aceite no localStorage.', e);
    }
  }

  /* ─────────────────────────────────────────
     ESTILOS DO MODAL (injetados dinamicamente)
  ───────────────────────────────────────── */
  var CSS = `
    #ep-consent-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.88);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: ep-fadein 0.25s ease;
    }
    @keyframes ep-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #ep-consent-modal {
      background: #ffffff;
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.35);
      animation: ep-slidein 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes ep-slidein {
      from { transform: translateY(30px) scale(0.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    #ep-consent-header {
      background: #1e293b;
      color: #fff;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    #ep-consent-header .ep-logo {
      font-size: 1.6rem;
      line-height: 1;
    }
    #ep-consent-header h2 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
    }
    #ep-consent-header p {
      font-size: 0.78rem;
      color: #94a3b8;
      margin: 0.15rem 0 0;
    }
    #ep-consent-body {
      padding: 1.5rem;
    }
    #ep-consent-body .ep-intro {
      font-size: 0.88rem;
      color: #475569;
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    #ep-consent-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .ep-doc-link {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.65rem 1rem;
      text-decoration: none;
      color: #1e293b;
      font-size: 0.88rem;
      font-weight: 600;
      transition: background 0.15s, border-color 0.15s;
    }
    .ep-doc-link:hover {
      background: #f1f5f9;
      border-color: #f59e0b;
    }
    .ep-doc-link .ep-doc-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .ep-doc-link .ep-doc-arrow {
      margin-left: auto;
      color: #94a3b8;
      font-size: 0.8rem;
    }
    #ep-consent-check-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      padding: 0.9rem 1rem;
      margin-bottom: 1.25rem;
      cursor: pointer;
    }
    #ep-consent-check-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      min-width: 18px;
      accent-color: #f59e0b;
      cursor: pointer;
      margin-top: 2px;
    }
    #ep-consent-check-row label {
      font-size: 0.87rem;
      color: #374151;
      line-height: 1.5;
      cursor: pointer;
    }
    #ep-consent-footer {
      display: flex;
      gap: 0.75rem;
      padding: 0 1.5rem 1.5rem;
    }
    #ep-btn-aceitar {
      flex: 1;
      background: #f59e0b;
      color: #1e293b;
      border: none;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    #ep-btn-aceitar:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    #ep-btn-aceitar:not(:disabled):hover {
      background: #d97706;
    }
    #ep-consent-versao {
      text-align: center;
      font-size: 0.72rem;
      color: #94a3b8;
      padding: 0 1.5rem 1rem;
    }
    @media (max-width: 480px) {
      #ep-consent-body { padding: 1.25rem; }
      #ep-consent-footer { padding: 0 1.25rem 1.25rem; }
    }
  `;

  /* ─────────────────────────────────────────
     CRIAR E EXIBIR O MODAL
  ───────────────────────────────────────── */
  function criarModal() {
    // Injeta CSS
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'ep-consent-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ep-consent-title');

    // HTML interno
    overlay.innerHTML = `
      <div id="ep-consent-modal">
        <div id="ep-consent-header">
          <span class="ep-logo">⚡</span>
          <div>
            <h2 id="ep-consent-title">ElétricaPro</h2>
            <p>Antes de continuar, leia e aceite os documentos abaixo</p>
          </div>
        </div>

        <div id="ep-consent-body">
          <p class="ep-intro">
            Para usar o <strong>ElétricaPro</strong>, você precisa aceitar nossa
            Política de Privacidade e nossos Termos de Uso, em conformidade com a
            <strong>LGPD (Lei nº 13.709/2018)</strong>.
          </p>

          <div id="ep-consent-links">
            <a href="politica-de-privacidade.html" target="_blank" rel="noopener" class="ep-doc-link">
              <span class="ep-doc-icon">🔒</span>
              Política de Privacidade
              <span class="ep-doc-arrow">↗</span>
            </a>
            <a href="termos-de-uso.html" target="_blank" rel="noopener" class="ep-doc-link">
              <span class="ep-doc-icon">📋</span>
              Termos de Uso
              <span class="ep-doc-arrow">↗</span>
            </a>
            <a href="etica-e-conformidade.html" target="_blank" rel="noopener" class="ep-doc-link">
              <span class="ep-doc-icon">🤝</span>
              Ética &amp; Conformidade
              <span class="ep-doc-arrow">↗</span>
            </a>
          </div>

          <div id="ep-consent-check-row" onclick="document.getElementById('ep-consent-cb').click()">
            <input type="checkbox" id="ep-consent-cb" onclick="event.stopPropagation();" />
            <label for="ep-consent-cb">
              Li e aceito a <strong>Política de Privacidade</strong>, os
              <strong>Termos de Uso</strong> e a <strong>Ética &amp; Conformidade</strong>
              do ElétricaPro. Concordo com o tratamento dos meus dados pessoais conforme a
              LGPD.
            </label>
          </div>
        </div>

        <div id="ep-consent-footer">
          <button id="ep-btn-aceitar" disabled>✔ Confirmar e continuar</button>
        </div>

        <p id="ep-consent-versao">Versão dos documentos: ${LEGAL_VERSION} — COFservicos · CNPJ 31.577.846/0001-12</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Bloquear scroll do body
    if (BLOQUEAR_USO) {
      document.body.style.overflow = 'hidden';
    }

    // Habilitar botão ao marcar checkbox
    var cb  = document.getElementById('ep-consent-cb');
    var btn = document.getElementById('ep-btn-aceitar');

    cb.addEventListener('change', function () {
      btn.disabled = !cb.checked;
    });

    // Confirmar aceite
    btn.addEventListener('click', function () {
      if (!cb.checked) return;
      salvarAceite();
      // Animação de saída
      overlay.style.transition = 'opacity 0.25s ease';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
        document.body.style.overflow = '';
      }, 280);
    });

    // Fechar ao clicar fora (opcional — desativado pois BLOQUEAR_USO = true)
    // overlay.addEventListener('click', function(e) {
    //   if (e.target === overlay && !BLOQUEAR_USO) { ... }
    // });

    // Foco acessível no modal
    setTimeout(function () {
      var modal = document.getElementById('ep-consent-modal');
      if (modal) modal.setAttribute('tabindex', '-1'), modal.focus();
    }, 350);
  }

  /* ─────────────────────────────────────────
     INICIALIZAÇÃO
  ───────────────────────────────────────── */
  function init() {
    if (jaAceitou()) return; // Já aceitou esta versão — nada a fazer

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', criarModal);
    } else {
      criarModal();
    }
  }

  init();

})();
