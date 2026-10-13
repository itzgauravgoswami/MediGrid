# Contributing to MediGrid

Thank you for your interest in contributing to MediGrid. This document outlines the technical standards, contribution guidelines, and governance processes for the repository.

MediGrid is a mission-critical digital health infrastructure platform. We maintain high standards of code hygiene, security, clinical privacy adherence, and test coverage.

---

## Code of Conduct

All contributors are expected to uphold the standards defined in the [Code of Conduct](CODE_OF_CONDUCT.md). Disrespectful, harassing, or unethical conduct will not be tolerated.

---

## Development Workflow

### 1. Issue Tracking

Before initiating non-trivial changes, open an issue on GitHub to discuss the proposed enhancement, bug report, or architectural modification. This ensures alignment with the project roadmap and prevents duplicate engineering effort.

### 2. Branching Strategy

Follow standard Git feature-branch conventions:

- Primary development branch: `main`
- Feature branches: `feat/<short-description>`
- Bug fix branches: `fix/<short-description>`
- Documentation branches: `docs/<short-description>`
- Refactor / Performance branches: `refactor/<short-description>` or `perf/<short-description>`

Create your branch from an up-to-date `main` branch:

```bash
git checkout main
git pull origin main
git checkout -b feat/vitals-stream-optimization
```

---

## Commit Message Standards

MediGrid enforces the Conventional Commits specification. All commit messages must be structured as follows:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Allowed Types

- `feat`: A new user-facing or technical capability.
- `fix`: A defect correction or bug resolution.
- `docs`: Documentation updates only.
- `style`: Changes that do not affect the meaning of the code (formatting, white-space).
- `refactor`: Code restructure that neither fixes a bug nor adds a feature.
- `perf`: Code changes improving computational performance or network latency.
- `test`: Adding missing unit, integration, or end-to-end tests.
- `chore`: Build system changes, dependency updates, configuration adjustments.

### Examples

- `feat(reports): implement dual-engine pdf and image ocr pipeline`
- `fix(auth): enforce strict jwt verification in onboarding route guard`
- `docs(readme): add environment variable specification table`

---

## Code Standards and Architecture Guidelines

### Frontend (React + Vite + Tailwind CSS)

1. **State Management**: Keep component state scoped appropriately. Avoid unnecessary global re-renders.
2. **Security**: Never expose private keys, webhook secrets, or administrative credentials to the client bundle. Only `VITE_`-prefixed environment variables intended for public client consumption may be accessed.
3. **Accessibility (a11y)**: Ensure interactive elements have valid semantic tags, `aria` labels, and support keyboard navigation.
4. **Error Handling**: Gracefully handle network failures and API downtime. Provide clear, non-cryptic error boundaries and fallback states.
5. **Theme Support**: Maintain full parity between light and dark themes using Tailwind CSS dark classes.

### Backend (Node.js + Express + MongoDB)

1. **Centralized Configuration**: All environment variable interactions must be routed through `backend/config/env.js`. Direct invocations of `process.env` outside startup scripts are disallowed.
2. **Security Headers**: Ensure API endpoints respect Helmet CSP policies and custom permissions policies.
3. **Input Sanitization**: Sanitize all incoming user payload parameters to protect against SQL/NoSQL injection, cross-site scripting (XSS), and malicious control sequences.
4. **Prompt Security**: All AI/LLM prompts must include prompt injection safeguards and strict clinical non-diagnosis disclaimers.
5. **Persistence Resilience**: Maintain dual-mode persistence compatibility (MongoDB primary with local JSON fallback) where applicable for development environments.

---

## Pull Request Process

1. Ensure your local branch is rebased onto the latest `main` commit.
2. Verify that both the backend and frontend services start cleanly without errors:
   - Frontend: `npm run lint` and `npm run build`
   - Backend: `npm start`
3. Submit a Pull Request targeting `main`.
4. Fill in the Pull Request template with:
   - Problem statement and context.
   - Summary of code modifications.
   - Verification steps and screenshots/logs demonstrating correctness.
   - Reference to corresponding GitHub Issue numbers.
5. Request review from repository maintainers. Address any feedback with focused, squashed commits.
6. Once approved and continuous integration passes, maintainers will merge the Pull Request.

---

## Security Vulnerabilities

Do not report security vulnerabilities through public GitHub issues. Follow the disclosure procedures detailed in [SECURITY.md](SECURITY.md).
