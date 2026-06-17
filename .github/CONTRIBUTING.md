# Contributing to AureTrix

Thank you for your interest in contributing to AureTrix! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Branching Strategy](#branching-strategy)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Contributing Keyboard Layouts](#contributing-keyboard-layouts)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Branching Strategy

- **`main`** — Stable, production-ready code. This branch is protected.
- **`develop`** — Active development branch (**default branch**). All contributions should target `develop`.

Changes are reviewed and tested on `develop` before being merged into `main`.

## Code of Conduct

This project follows a [Code of Conduct](https://github.com/AureTrix-Solutions/AureTrix_driver?tab=coc-ov-file). By participating, you are expected to uphold this code. Please report unacceptable behavior via GitHub Issues.

## Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **pnpm** v9 or higher (recommended) or npm
- A compatible hall effect keyboard with SparkLink SDK support (for testing hardware features)
- A **Chromium-based browser** with WebHID support (Chrome, Edge, Brave)

### Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AureTrix_driver.git
   cd AureTrix_driver
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/AureTrix-Solutions/AureTrix_driver.git
   ```
4. Checkout the `develop` branch:
   ```bash
   git checkout develop
   ```

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:5000`

3. Run tests:
   ```bash
   pnpm test
   ```

4. Build for production:
   ```bash
   pnpm build
   ```

## Project Structure

```bash
src/
├── pages/                  # Route-level Vue components
├── components/             # Reusable UI components
├── services/               # Hardware abstraction layer (KeyboardService, etc.)
├── store/                  # Pinia state management
├── composables/            # Reusable composition functions
├── utils/                  # Shared utilities and layout configs
├── types/                  # TypeScript type definitions
├── router/                 # Vue Router configuration
├── styles/                 # Global SCSS styles
└── assets/                 # Static assets
```

## Code Standards

- Use TypeScript strict mode
- Use Composition API with `<script setup lang="ts">`
- Follow existing patterns in the codebase
- Use SCSS variables from `src/styles/variables.scss`
- Write clear, descriptive commit messages

## Contributing Keyboard Layouts

Community keyboard layouts are stored in `src/utils/sharedLayout.ts`. To contribute a layout:
1. Open AureTrix and navigate to **Layout Creator**
2. Connect your keyboard or manually configure row counts
3. Adjust key sizes and gaps to match your keyboard's physical layout
4. Click the **Share** button — this opens a pre-filled GitHub issue
5. Review and submit the issue

## Pull Request Process

**All Pull Requests must target the `develop` branch.**

### Steps to Contribute

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them.

3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a **Pull Request** on GitHub targeting the **`develop`** branch (GitHub should suggest `develop` automatically because it is the default branch).

### PR Checklist
- [ ] Code follows the project's TypeScript and Vue conventions
- [ ] Changes are tested (manually and/or with unit tests)
- [ ] No console errors or warnings
- [ ] Documentation is updated if needed
- [ ] Clear PR description with motivation and testing steps

We will review and test your contribution on `develop` before merging into `main`.

## Issue Guidelines

- Use the provided issue templates when available
- Be clear and provide reproduction steps for bugs
- Include keyboard model, browser, and OS information when relevant

---

**Thank you for contributing!**  
Your help makes AureTrix better for the entire hall effect keyboard community.
