# OpenWhispr Design System

Sistema de design padronizado para OpenWhispr com cores personalizadas, componentes acessíveis e boas práticas de desenvolvimento.

## 🎨 Sistema de Cores

### Paleta de Cores

O projeto usa um sistema de cores com suporte a light/dark mode:

#### **Text (Verde)**
- Usado para textos e elementos de leitura
- Light: `#0f2415` (900) → `#edf7f0` (50)
- Dark: `#eef7f1` (950) → `#08110b` (50)

#### **Background (Verde Claro)**
- Usado para fundos e containers
- Light: `#edf7f0` (50) → `#08120a` (950)
- Dark: `#edf7f0` (950) → `#08120a` (50)

#### **Primary (Verde Principal)**
- Cor principal da marca
- Light: `#4ab561` (500)
- Dark: `#4ab561` (500)

#### **Secondary (Azul)**
- Cor secundária para elementos de suporte
- Light: `#4a7ab5` (500)
- Dark: `#4a7cb5` (500)

#### **Accent (Roxo)**
- Cor de destaque para CTAs e elementos interativos
- Light: `#4a4cb5` (500)
- Dark: `#4a4cb5` (500)

### Uso no Código

```tsx
// Usando Tailwind classes
<div className="bg-primary-500 text-text-950">
  Primary button
</div>

// Usando CSS variables
<div style={{ backgroundColor: 'var(--primary-500)' }}>
  Custom component
</div>
```

## 📦 Componentes

### Button Variants

O componente Button suporta múltiplas variantes:

```tsx
import { Button } from './components/ui/button';

// Variantes disponíveis
<Button variant="default">Primary Action</Button>
<Button variant="success">Complete</Button>
<Button variant="warning">Warning</Button>
<Button variant="destructive">Delete</Button>
<Button variant="destructive-outline">Remove</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link Style</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Card Variants

Cards com variantes predefinidas:

```tsx
import { cardVariants } from './components/ui/card.variants';

const Card = ({ variant = 'default', padding = 'md', hover = 'none' }) => (
  <div className={cardVariants({ variant, padding, hover })}>
    {/* Content */}
  </div>
);

// Uso
<Card variant="elevated" padding="lg" hover="lift" />
<Card variant="success" />
<Card variant="ghost" />
```

### Tabs Component

Tabs acessíveis com Radix UI:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## 🛠️ Scripts Disponíveis

### Formatação de Código

```bash
# Formatar todo o código
npm run format

# Verificar formatação sem alterar
npm run format:check
```

### Linting

```bash
# Rodar ESLint
npm run lint

# Corrigir erros automaticamente
npm run lint:fix
```

### Desenvolvimento

```bash
# Iniciar em modo dev
npm run dev

# Build para produção
npm run build
```

## ♿ Acessibilidade

O projeto usa `eslint-plugin-jsx-a11y` para garantir acessibilidade:

- ✅ Alt text obrigatório em imagens
- ✅ ARIA props validados
- ✅ Eventos de teclado em elementos clicáveis
- ✅ Roles corretas em elementos

### Checklist de Acessibilidade

- [ ] Todos os botões têm labels descritivos
- [ ] Imagens têm alt text
- [ ] Formulários têm labels associados
- [ ] Navegação funciona por teclado
- [ ] Contraste de cores adequado (WCAG AA)

## 📝 Design Tokens

Tokens centralizados em `src/styles/design-tokens.ts`:

```typescript
import { designTokens } from './styles/design-tokens';

// Cores
designTokens.colors.primary[500]

// Espaçamentos
designTokens.spacing.md // 16px

// Border radius
designTokens.borderRadius.lg // 12px

// Transições
designTokens.transitions.base // 200ms
```

## 🎯 Boas Práticas

### 1. Sempre use variantes de componentes

❌ **Evitar:**
```tsx
<button className="bg-[#007AFF] hover:bg-[#0051D5] px-4 py-2 rounded-lg">
  Click me
</button>
```

✅ **Preferir:**
```tsx
<Button variant="default">Click me</Button>
```

### 2. Use design tokens ao invés de valores hardcoded

❌ **Evitar:**
```tsx
<div className="rounded-[12px] p-[16px]">
```

✅ **Preferir:**
```tsx
<div className="rounded-xl p-4">
```

### 3. Prefira classes Tailwind a estilos inline

❌ **Evitar:**
```tsx
<div style={{ backgroundColor: '#4ab561', padding: '16px' }}>
```

✅ **Preferir:**
```tsx
<div className="bg-primary-500 p-4">
```

### 4. Mantenha consistência nos espaçamentos

Use o sistema de espaçamentos do Tailwind:
- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

## 🔧 Configuração do Editor

### VS Code

Instalar extensões recomendadas:
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense

### Configuração `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"\`]([^\"\`]*)[\"\`]"]
  ]
}
```

## 📚 Recursos Adicionais

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [CVA (Class Variance Authority)](https://cva.style/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🚀 Próximos Passos

- [ ] Implementar dark mode toggle
- [ ] Criar mais variantes de componentes
- [ ] Adicionar Storybook para documentação visual
- [ ] Criar testes de acessibilidade automatizados
- [ ] Expandir palette de cores com mais tons

---

**Mantido por:** OpenWhispr Team
**Última atualização:** 2025-10-25
