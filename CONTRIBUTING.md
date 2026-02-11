# Contributing to ComplyKe

Thank you for your interest in contributing to ComplyKe! 🇰🇪

ComplyKe is an open-source compliance management platform designed specifically for Kenyan SMEs. We welcome contributions from developers, compliance experts, and anyone passionate about simplifying business compliance in Kenya.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Questions](#questions)

---

## 🤝 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and professional in all interactions.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members
- ❌ No harassment, trolling, or derogatory comments
- ❌ No political or off-topic discussions

---

## 🚀 How Can I Contribute?

### 1. **Code Contributions**

- Fix bugs
- Add new features
- Improve performance
- Enhance UI/UX
- Add tests

### 2. **Documentation**

- Improve README
- Write tutorials
- Create examples
- Translate documentation
- Fix typos

### 3. **Compliance Expertise**

- Verify tax calculations
- Update legal references
- Review compliance features
- Suggest improvements

### 4. **Testing**

- Test new features
- Report bugs
- Verify calculations
- Test on different devices

### 5. **Design**

- Improve UI/UX
- Create graphics
- Design badges
- Enhance accessibility

---

## 💻 Development Setup

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** for version control
- Basic knowledge of **TypeScript** and **React**

### Installation Steps

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/complyka.git
   cd complyka
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📝 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use meaningful variable names

### React Components

- Use **functional components** with hooks
- Follow the **"use client"** directive for client components
- Keep components small and focused
- Use proper prop types

### Styling

- Use **Tailwind CSS** for styling
- Follow the existing color scheme (navy blue & emerald green)
- Ensure mobile-first responsive design
- Test on different screen sizes

### File Structure

```
complyka/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                 # Utility functions
│   ├── tax-calculator.ts
│   ├── contract-generator.ts
│   └── privacy-policy-generator.ts
├── public/              # Static assets
└── README.md
```

### Naming Conventions

- **Files**: `kebab-case.tsx` (e.g., `payroll-calculator.tsx`)
- **Components**: `PascalCase` (e.g., `PayrollCalculator`)
- **Functions**: `camelCase` (e.g., `calculatePAYE`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MINIMUM_WAGES_2026`)

---

## 🔍 Tax Calculation Guidelines

**CRITICAL**: Tax calculations must be **100% accurate** and based on **verified sources**.

### Sources of Truth

1. **Kenya Revenue Authority (KRA)** - www.kra.go.ke
2. **NSSF** - www.nssf.or.ke
3. **Social Health Authority (SHA)** - www.sha.go.ke
4. **Office of Data Protection Commissioner (ODPC)** - www.odpc.go.ke

### Verification Process

1. **Cite your sources** in code comments
2. **Include legal references** (e.g., Finance Act 2023)
3. **Add test cases** for all calculations
4. **Document changes** in `TAX_REFERENCE.md`

### Example

```typescript
/**
 * NSSF (National Social Security Fund)
 * Source: NSSF Act, 2013 (Phase 4 - Effective February 1, 2026)
 * 
 * Tier I (Lower Earnings Limit - LEL): KES 9,000
 * Tier II (Upper Earnings Limit - UEL): KES 108,000
 * Contribution Rate: 6% for both employee and employer
 */
export function calculateNSSF(grossSalary: number): number {
    // Implementation with proper calculations
}
```

---

## 📤 Submitting Changes

### Pull Request Process

1. **Update documentation**
   - Update `README.md` if needed
   - Update `TAX_REFERENCE.md` for tax changes
   - Add comments to complex code

2. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add KRA PIN validation"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

### Commit Message Format

Use **conventional commits**:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

**Examples**:
- `feat: add eTIMS integration`
- `fix: correct NSSF Phase 4 calculation`
- `docs: update minimum wage 2026`

---

## 🐛 Reporting Bugs

### Before Submitting

1. **Check existing issues** - Your bug might already be reported
2. **Test on latest version** - Ensure you're using the latest code
3. **Verify it's a bug** - Not a configuration issue

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Enter value '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 0.1.0]

**Additional context**
Any other context about the problem.
```

---

## 💡 Suggesting Features

We love feature suggestions! Here's how to suggest one:

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context, screenshots, or examples.

**Compliance Impact**
Does this affect tax calculations or compliance?
```

### Priority Features

We're particularly interested in:
- ✅ KRA eTIMS integration
- ✅ iTax automation
- ✅ M-Pesa payment integration
- ✅ Bulk employee management
- ✅ Mobile app (React Native)

---

## ❓ Questions

### Where to Ask

- **GitHub Discussions** - For general questions
- **GitHub Issues** - For bug reports and feature requests
- **Email** - geoffominde8@gmail.com

### Common Questions

**Q: Can I use this for my business?**  
A: Yes! ComplyKe is open source (MIT License) and free to use.

**Q: How do I verify tax calculations?**  
A: Check `TAX_REFERENCE.md` for sources and legal references.

**Q: Can I contribute if I'm not a developer?**  
A: Absolutely! We need compliance experts, designers, and testers too.

**Q: How often are tax rates updated?**  
A: We monitor KRA announcements and update as soon as changes are official.

---

## 🏆 Recognition

Contributors will be:
- ✅ Listed in `CONTRIBUTORS.md`
- ✅ Credited in release notes
- ✅ Acknowledged in the README

---

## 📄 License

By contributing to ComplyKe, you agree that your contributions will be licensed under the **MIT License**.

---

## 🙏 Thank You!

Thank you for contributing to ComplyKe! Together, we're making compliance easier for Kenyan SMEs.

**Built with ❤️ for Kenyan Entrepreneurs**

---

**Last Updated**: February 10, 2026
