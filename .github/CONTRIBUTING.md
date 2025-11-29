# Contributing to AureTrix

Thank you for your interest in contributing to AureTrix! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Contributing Keyboard Layouts](#contributing-keyboard-layouts)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project follows a [Code of Conduct](.github/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior via GitHub Issues.

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9 or higher (recommended) or npm
- A compatible hall effect keyboard with SparkLink SDK support (for testing hardware features)
- A **Chromium-based browser** with WebHID support (Chrome, Edge, Brave)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AureTrix_driver.git
   cd AureTrix_driver
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/BlastHappy82/AureTrix_driver.git
   ```

## Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:5000`

3. **Run tests**:
   ```bash
   pnpm test
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

### Testing Without Hardware

Many features can be developed and tested without a physical keyboard:
- UI components and styling
- Layout Creator functionality
- State management logic
- Routing and navigation

The Debug page (development builds only) provides tools for inspecting SDK behavior when hardware is connected.

## Project Structure

```
src/
├── pages/           # Route-level Vue components
├── components/      # Reusable UI components
├── services/        # Hardware abstraction layer (KeyboardService, etc.)
├── store/           # Pinia state management
├── composables/     # Reusable composition functions
├── utils/           # Shared utilities and layout configs
├── types/           # TypeScript type definitions
├── router/          # Vue Router configuration
├── styles/          # Global SCSS styles
└── assets/          # Static assets
```

### Key Files

| File | Purpose |
|------|---------|
| `src/services/KeyboardService.ts` | Main SDK wrapper for hardware communication |
| `src/utils/layoutConfigs.ts` | Physical keyboard layout definitions |
| `src/utils/sharedLayout.ts` | Community-contributed keyboard layouts |
| `src/styles/variables.scss` | Global SCSS variables and design tokens |

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` with type guards when needed

```typescript
// Good
function calculateTravel(distance: number, unit: 'mm' | 'u'): number {
  return unit === 'mm' ? distance : distance * 19.05;
}

// Avoid
function calculateTravel(distance: any, unit: any) {
  return unit === 'mm' ? distance : distance * 19.05;
}
```

### Vue Components

- Use Composition API with `<script setup lang="ts">`
- Keep components focused and single-purpose
- Extract reusable logic into composables
- Use SCSS for component styling with scoped styles

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  keyIndex: number;
  selected: boolean;
}>();

const emit = defineEmits<{
  select: [keyIndex: number];
}>();
</script>

<template>
  <div :class="['key', { selected }]" @click="emit('select', keyIndex)">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@use '@styles/variables' as v;

.key {
  background: v.$surface-color;
  border-radius: v.$border-radius;
  
  &.selected {
    border-color: v.$accent-color;
  }
}
</style>
```

### SCSS Styling

- Use variables from `src/styles/variables.scss`
- Follow the existing color scheme and spacing conventions
- Use `@use '@styles/variables' as v;` for importing variables (access via `v.$variable-name`)
- Maintain consistent component styling across pages

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `KeyMapping.vue` |
| Composables | camelCase with `use` prefix | `useBatchProcessing.ts` |
| Services | PascalCase with `Service` suffix | `KeyboardService.ts` |
| Stores | camelCase with descriptive name | `connectionStore.ts` |
| Types/Interfaces | PascalCase | `KeyConfig`, `LayoutData` |

## Contributing Keyboard Layouts

Community keyboard layouts are stored in `src/utils/sharedLayout.ts`. To contribute a layout:

1. Open AureTrix and navigate to **Layout Creator**
2. Connect your keyboard or manually configure row counts
3. Adjust key sizes and gaps to match your keyboard's physical layout
4. Click the **Share** button - this opens a pre-filled GitHub issue
5. Review the issue and submit it

## Pull Request Process

### Branch Naming

Use descriptive branch names:
- `feature/layout-creator-export` - New features
- `fix/connection-timeout` - Bug fixes
- `docs/contributing-guide` - Documentation
- `refactor/keyboard-service` - Code refactoring

### Commit Messages

Write clear, descriptive commit messages:

```
feat: add click-and-drag selection to RGB lighting page

- Implement selection rectangle overlay
- Add Shift key for additive selection
- Handle global mouseup for drag state cleanup
```

Prefixes:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `style:` - Formatting, styling changes
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's TypeScript and Vue conventions
- [ ] Changes are tested (manually and/or with unit tests)
- [ ] No console errors or warnings in browser
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes and motivation

### Review Process

1. Submit your PR with a clear description
2. Maintainers will review and may request changes
3. Address feedback and push updates
4. Once approved, your PR will be merged

## Issue Guidelines

### Bug Reports

Use the **Bug Report** issue template and include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Keyboard model (if hardware-related)
- Console errors (if any)

### Feature Requests

Use the **Feature Request** issue template and include:
- Clear description of the feature
- Use case and motivation
- Any implementation ideas (optional)

### Questions

For questions about using AureTrix or development, open a **Discussion** or create an issue with the `question` label.

## Thank You!

Your contributions help make AureTrix better for the entire hall effect keyboard community. We appreciate your time and effort!
