# Contributing to BIZRA APEX HUD

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or pnpm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/BizraInfo/bizra-repo.git
   cd bizra-repo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```
feat(auth): add login functionality
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

### Pre-commit Checks

Before committing, the following checks run automatically:
- ESLint validation
- TypeScript type checking
- Unit tests

To run manually:
```bash
npm run lint
npm run typecheck
npm run test
```

## 🧪 Testing

### Unit Tests

```bash
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:ci          # CI mode with coverage
```

### E2E Tests

```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # UI mode
npm run test:smoke       # Smoke tests only
```

### Test Coverage

Maintain at least 70% test coverage:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 🎨 Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer type inference
- Use interfaces for object shapes
- Use enums for constants

### React Components

- Use functional components with hooks
- Extract reusable logic to custom hooks
- Keep components focused and single-purpose
- Use TypeScript for props

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Maintain consistent spacing and sizing
- Use semantic HTML

## 🔍 Code Review Process

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass
4. Update documentation if needed
5. Create a Pull Request
6. Wait for CI/CD pipeline to complete
7. Address review comments
8. Once approved, merge to `develop`

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Performance considerations addressed
- [ ] Accessibility maintained

## 🚀 Deployment

### Preview Deployment

Preview deployments are automatic on Pull Requests via GitHub Actions.

### Production Deployment

Production deployments happen automatically when code is merged to `main`.

Manual deployment:
```bash
npm run deploy
```

## 📊 Performance

### Performance Budget

- First Load JS: 200KB
- First Load CSS: 50KB
- Total JS: 400KB
- Total CSS: 100KB

Check performance budget:
```bash
npm run performance:budget
```

### Lighthouse Scores

Maintain these minimum scores:
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

Run Lighthouse CI:
```bash
npm run lighthouse:ci
```

## 🔒 Security

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables
- Validate all user inputs
- Keep dependencies updated
- Run security audits regularly

### Security Audit

```bash
npm run security:audit
npm run security:fix
```

## 📚 Documentation

### Code Documentation

- Document complex logic
- Add JSDoc comments to functions
- Keep README files updated
- Document API endpoints

### Component Documentation

- Document component props
- Provide usage examples
- Document accessibility features

## 🐛 Reporting Issues

### Bug Reports

Include:
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details

### Feature Requests

Include:
- Clear description
- Use case
- Proposed solution (if any)
- Benefits

## ✅ Quality Standards

### Code Quality

- TypeScript strict mode
- ESLint compliance
- Test coverage ≥70%
- No console errors
- Proper error handling

### Performance

- Fast page loads (<3s)
- Optimized images
- Code splitting
- Lazy loading

### Accessibility

- WCAG 2.1 AA compliance
- ARIA attributes
- Keyboard navigation
- Screen reader support

## 🤝 Getting Help

- Check existing documentation
- Review similar issues/PRs
- Ask in discussions
- Contact maintainers

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to BIZRA APEX HUD! 🎉

