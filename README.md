# ⚡ Elétrico Pro - PWA

## 📱 Sobre o Projeto

Elétrico Pro é um Progressive Web App (PWA) profissional para eletricistas e engenheiros elétricos, oferecendo calculadoras elétricas, tabelas técnicas e sistema completo de orçamentos com geração de PDFs.

## 🎯 Funcionalidades

### 📊 Calculadoras
- **Lei de Ohm**: Cálculo de tensão, corrente e resistência
- **Potência**: Cálculo de potência ativa, aparente e reativa (monofásico e trifásico)
- **Queda de Tensão**: Verificação de queda de tensão em circuitos
- **Dimensionamento de Condutores**: Dimensionamento completo com verificação de capacidade e queda de tensão

### 📋 Tabelas Técnicas
- **Condutores**: Seções, diâmetros, peso e resistência
- **Disjuntores**: Correntes nominais e potências correspondentes
- **Capacidade de Corrente**: Métodos de instalação B1, B2 e C

### 💰 Orçamentos
- Cadastro de clientes
- Adição de múltiplos itens
- Cálculo automático de totais
- Geração de PDF profissional

## 🎁 Sistema de Trial

- **7 dias grátis** para testar todas as funcionalidades
- Contador de dias restantes visível
- Sistema de upgrade para versão PRO
- Dados salvos localmente (localStorage)

## 📄 Geração de PDF

Todos os cálculos, tabelas e orçamentos podem ser exportados em PDF profissional com:
- Cabeçalho personalizado
- Layout profissional
- Data e hora de geração
- Branding do app

## 🚀 Como Usar

### Instalação Local

1. Extraia o arquivo ZIP
2. Abra o arquivo `index.html` em um navegador moderno
3. Para instalar como PWA:
   - Chrome/Edge: Clique no ícone de instalação na barra de endereços
   - Safari iOS: Toque em "Compartilhar" > "Adicionar à Tela de Início"

### Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos
3. Vá em Settings > Pages
4. Selecione a branch `main` e pasta `/ (root)`
5. Salve e aguarde o deploy
6. Acesse pelo link fornecido

### Deploy em Servidor Web

1. Faça upload de todos os arquivos para seu servidor
2. Configure HTTPS (obrigatório para PWA)
3. Acesse pelo domínio configurado

## 📱 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo com CSS Grid e Flexbox
- **JavaScript**: Lógica de negócio e interatividade
- **PWA**: Service Worker, Manifest, Cache API
- **jsPDF**: Geração de PDFs
- **LocalStorage**: Persistência de dados

## 🎨 Design

- Interface moderna e intuitiva
- Design responsivo (mobile-first)
- Tema de cores profissional (azul e laranja)
- Animações suaves
- Ícones visuais para melhor UX

## 📦 Estrutura de Arquivos

```
pwa-eletrico/
│
├── index.html          # Página principal
├── app.js             # Lógica da aplicação
├── sw.js              # Service Worker
├── manifest.json      # Manifesto PWA
├── README.md          # Documentação
│
└── icons/             # Ícones do PWA
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

## 🔧 Funcionalidades Técnicas

### Cálculos Implementados

1. **Lei de Ohm**: V = I × R
2. **Potência**:
   - Monofásico: S = V × I
   - Trifásico: S = √3 × V × I
   - P = S × cos φ
   - Q = √(S² - P²)

3. **Queda de Tensão**:
   - ΔV = 2 × ρ × L × I / S
   - Limite: 4% (NBR 5410)

4. **Dimensionamento**:
   - Cálculo de corrente
   - Seleção por capacidade de condução
   - Verificação de queda de tensão
   - Recomendação de disjuntor

## 📱 Compatibilidade

- ✅ Chrome/Edge (Desktop e Mobile)
- ✅ Firefox
- ✅ Safari (iOS e macOS)
- ✅ Opera
- ✅ Samsung Internet

## 🔒 Privacidade

- Todos os dados são armazenados localmente no dispositivo
- Nenhuma informação é enviada para servidores externos
- Funciona 100% offline após primeira instalação

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através do site do projeto.

## 📄 Licença

Este projeto é de uso livre para fins educacionais e profissionais.

## 🎯 Próximas Funcionalidades (Roadmap)

- [ ] Mais calculadoras (curto-circuito, fator de demanda)
- [ ] Salvar orçamentos no dispositivo
- [ ] Exportar orçamentos em Excel
- [ ] Modo escuro
- [ ] Múltiplos idiomas
- [ ] Sincronização em nuvem (versão PRO)

---

**Desenvolvido com ⚡ para profissionais da elétrica**