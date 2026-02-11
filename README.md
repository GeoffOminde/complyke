# ComplyKe - Compliance-as-a-Service for Kenyan SMEs

![ComplyKe Logo](public/logo.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-red.svg)](https://github.com)
[![KRA Compliant](https://img.shields.io/badge/KRA-Compliant%202026-blue.svg)](TAX_REFERENCE.md)
[![ODPC Certified](https://img.shields.io/badge/ODPC-Certified-green.svg)](https://odpc.go.ke)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Protect your business from government fines.** ComplyKe is a **free, open-source** compliance management platform designed specifically for small and medium enterprises in Kenya.

## 🌟 Why ComplyKe?

- ✅ **100% Free & Open Source** - MIT Licensed
- ✅ **2026 Compliant** - Updated with latest NSSF Phase 4, SHIF, Housing Levy
- ✅ **Built for Kenya** - Designed specifically for Kenyan SMEs
- ✅ **No Technical Knowledge Required** - Simple, easy-to-use interface
- ✅ **Mobile-First** - Works on any device
- ✅ **Community-Driven** - Contributions welcome!

## ✨ Core Features

### 1. **Risk Dashboard**
- **Compliance Health Score**: Visual 0-100% score tracking
- **Critical Compliance Checklist**:
  - SHA/SHIF Registration
  - Housing Levy Compliance
  - Data Protection Policy
  - Employee Contracts
- **Real-time Risk Alerts**: Warnings when compliance score falls below 75%

### 2. **2025 Auto-Contract Generator**
Generate legally compliant employment contracts with:
- Automatic inclusion of 2024/2025 statutory deduction clauses
- Housing Levy (1.5%) compliance
- SHIF (2.75%) compliance
- Minimum wage validation (KES 15,000)
- Downloadable contract documents

### 3. **Payroll Tax Calculator**
Accurate Kenyan tax calculations including:
- **Housing Levy**: 1.5% of gross salary
- **SHIF**: 2.75% of gross salary
- **NSSF**: KES 1,080 (Tier I+II estimate)
- **PAYE**: Full 2025 tax bands with personal relief
- Detailed payslip breakdown
- Payment instructions for KRA, SHA, NSSF, and Housing Fund

### 4. **ODPC Privacy Policy Wizard**
Generate Data Protection Act 2019 compliant policies:
- Customizable based on data collection practices
- CCTV surveillance clauses
- Phone number collection policies
- ODPC complaint procedures
- Downloadable policy documents

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: Custom UI components
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel/Railway

## 🎨 Design Philosophy

### Color Palette
- **Navy Blue (#1e3a8a)**: Represents Trust and Legal Authority
- **Emerald Green (#059669)**: Represents Safety and Compliance
- **Professional & Minimalistic**: Clean, corporate aesthetic

### Mobile-First Design
- Large touch targets (minimum 48px)
- Responsive sidebar navigation
- Optimized for Kenyan mobile users
- Touch-friendly interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd complyka
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📱 Usage Guide

### Dashboard
1. Navigate to the Dashboard (home screen)
2. View your Compliance Health Score
3. Toggle checklist items as you complete them
4. Monitor risk alerts

### Generate Employment Contract
1. Click "Contract Generator" in the sidebar
2. Fill in employee details:
   - Employee Name
   - ID Number
   - Job Title
   - Gross Salary (KES)
   - Start Date
3. Review minimum wage warnings
4. Click "Generate Contract"
5. Download the contract document

### Calculate Payroll
1. Click "Payroll Calc" in the sidebar
2. Enter the gross monthly salary
3. Click "Calculate Payroll"
4. Review the detailed breakdown:
   - Housing Levy
   - SHIF
   - NSSF
   - PAYE
   - Net Pay
5. Follow payment instructions for each authority

### Create Privacy Policy
1. Click "Privacy Policy" in the sidebar
2. Enter your company name
3. Select data collection practices:
   - Phone Numbers
   - CCTV Surveillance
4. Click "Generate Policy"
5. Download the ODPC-compliant policy

## 📊 Tax Calculation Logic

### PAYE (2025 Tax Bands)
- First KES 24,000: 10%
- Next KES 8,333 (24,001 - 32,333): 25%
- Next KES 467,667 (32,334 - 500,000): 30%
- Next KES 300,000 (500,001 - 800,000): 32.5%
- Above KES 800,000: 35%
- **Personal Relief**: KES 2,400/month

### Statutory Deductions
- **Housing Levy**: 1.5% of gross salary (Finance Act 2023)
- **SHIF**: 2.75% of gross salary (Social Health Insurance Act 2024/2025)
- **NSSF**: KES 1,080 (simplified Tier I+II)

## 🔒 Compliance & Legal

This platform generates documents that comply with:
- Employment Act, 2007
- Labour Relations Act, 2007
- Data Protection Act, 2019
- Finance Act, 2023 (Housing Levy)
- Social Health Insurance Act, 2024/2025
- Income Tax Act (PAYE regulations)

**Disclaimer**: While ComplyKe generates legally compliant documents, users should seek independent legal advice for their specific circumstances.

## 🗂️ Project Structure

```
complyka/
├── app/
│   ├── globals.css          # Global styles with custom theme
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Main application shell
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── contract-generator.tsx
│   ├── payroll-calculator.tsx
│   ├── privacy-policy-wizard.tsx
│   └── risk-dashboard.tsx
├── lib/
│   ├── contract-generator.ts # Contract generation logic
│   ├── privacy-policy-generator.ts
│   ├── tax-calculator.ts     # Kenyan tax calculations
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- ✅ Risk Dashboard
- ✅ Contract Generator
- ✅ Payroll Calculator
- ✅ Privacy Policy Wizard

### Phase 2 (Planned)
- [ ] User authentication
- [ ] Document storage
- [ ] Email notifications
- [ ] Compliance deadline reminders
- [ ] Multi-language support (Swahili)

### Phase 3 (Future)
- [ ] Integration with KRA iTax
- [ ] M-Pesa payment integration
- [ ] Bulk employee management
- [ ] Compliance reporting
- [ ] Mobile app (React Native)

## 🤝 Contributing

We ❤️ contributions! ComplyKe is built by the community, for the community.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Ways to Contribute

- 🐛 **Report bugs** - Help us find and fix issues
- 💡 **Suggest features** - Share your ideas for improvements
- 📝 **Improve documentation** - Help others understand the code
- 🔍 **Verify tax calculations** - Ensure accuracy with KRA guidelines
- 🎨 **Enhance UI/UX** - Make the app more beautiful and usable
- 🌍 **Translate** - Help us support Swahili and other languages

**Read our full [Contributing Guide](CONTRIBUTING.md) for detailed instructions.**

## 🌍 Community

- **GitHub Discussions** - Ask questions, share ideas
- **Issues** - Report bugs, request features
- **Pull Requests** - Contribute code
- **GitHub Issues** - [Report a bug or request a feature](https://github.com/GeoffOminde/complyke/issues)
- **Email** - geoffominde8@gmail.com

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What does this mean?

✅ **Commercial use** - Use ComplyKe in your business  
✅ **Modification** - Customize it to your needs  
✅ **Distribution** - Share it with others  
✅ **Private use** - Use it privately  

The only requirement is to include the original license and copyright notice.

## 🙏 Acknowledgments

- Built with ❤️ for Kenyan SMEs by developers who understand local compliance challenges
- Tax calculations verified against KRA guidelines (updated February 2026)
- ODPC compliance verified against Data Protection Act 2019
- Special thanks to all our [contributors](CONTRIBUTING.md)

## 📞 Support

For support, please [open an issue](https://github.com/GeoffOminde/complyke/issues) in the repository or contact geoffominde8@gmail.com.

---

**Built with ❤️ for Kenyan Entrepreneurs**

*Protect your business. Stay compliant. Grow with confidence.*

**⭐ Star this repo if you find it helpful!**
