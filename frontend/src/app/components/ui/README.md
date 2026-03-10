# Componentes UI - YourStreet Frontend

Esta pasta contém os componentes de interface essenciais do projeto, organizados de forma modular e reutilizável.

## 📁 Estrutura Atual (9 arquivos)

### 🎯 **InteractiveTabs.tsx**
- **Função**: Botões interativos (mapa, comunidade, ideia)
- **Props**: `activePanel`, `onPanelToggle`
- **Recursos**: Animações hover, estados ativos, acessibilidade
- **Tipo**: `TabType = "map" | "community" | "idea"`

### 📋 **InfoPanel.tsx**
- **Função**: Painéis informativos que aparecem ao clicar nos tabs
- **Props**: `type: TabType`
- **Recursos**: Animação de entrada, dados estruturados por tipo
- **Conteúdo**: Ícones, títulos, pontos-chave, citações

### ✅ **FeatureList.tsx**
- **Função**: Lista de características do produto
- **Props**: Nenhuma (dados estáticos)
- **Recursos**: Ícones de seta, espaçamento consistente
- **Conteúdo**: 3 funcionalidades principais da plataforma

### 🔐 **GoogleLoginButton.tsx**
- **Função**: Botão específico para login com Google
- **Props**: `onClick`
- **Recursos**: Ícone oficial do Google, estados hover
- **Estilo**: Design oficial do Google Material Design

### 💳 **LoginCard.tsx**
- **Função**: Card completo de login
- **Props**: `onGoogleLogin`, `logoSrc`
- **Componentes**: Logo, título, subtítulo, botão Google, textos de segurança
- **Layout**: Card com shadow, bordas arredondadas

### 📄 **LeftSection.tsx**
- **Função**: Seção esquerda completa da landing page
- **Props**: `activePanel`, `onPanelToggle`
- **Componentes**: InteractiveTabs, InfoPanel, título principal, FeatureList
- **Layout**: Gradient de fundo, imagem decorativa, responsivo

### 🏠 **RightSection.tsx**
- **Função**: Seção direita com área de login  
- **Props**: `onGoogleLogin`, `logoSrc`
- **Componentes**: LoginCard
- **Layout**: Fundo branco, centralizado

### 📦 **index.ts**
- **Função**: Exportações centralizadas de todos os componentes
- **Facilita**: Importações organizadas e limpas

### 📚 **README.md**
- **Função**: Documentação completa da estrutura de componentes

## 🔄 Fluxo de Estados

```typescript
App.tsx (state principal)
├── activePanel: TabType | null
├── handlePanelToggle()
└── handleGoogleLogin()
    │
    ├── LeftSection
    │   ├── InteractiveTabs (controla activePanel)
    │   └── InfoPanel (exibe conteúdo baseado no activePanel)
    │
    └── RightSection
        └── LoginCard
            └── GoogleLoginButton
```

## 📦 Importações

```typescript
// Importação individual
import { LeftSection } from "./components/ui/LeftSection";

// Importação múltipla via index
import { LeftSection, RightSection, TabType } from "./components/ui";
```

## ✨ Estrutura Otimizada

✅ **Apenas componentes necessários** - Removidos 50+ componentes shadcn/ui não utilizados  
✅ **Zero dependências desnecessárias** - Código mais limpo e performático  
✅ **Fácil manutenção** - Cada arquivo tem um propósito específico  
✅ **Type Safety** - Interfaces TypeScript bem definidas  
✅ **Documentação completa** - Tudo documentado e organizado  

## 🚀 Benefícios da Limpeza

1. **Performance**: Menos arquivos = build mais rápido
2. **Clareza**: Foco apenas no que realmente importa  
3. **Manutenção**: Sem confusão com componentes não utilizados
4. **Colaboração**: Desenvolvedores encontram rapidamente o que precisam
5. **Bundle size**: Aplicação mais leve em produção