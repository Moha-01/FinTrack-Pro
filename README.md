
# FinTrack Pro

FinTrack Pro is a comprehensive, client-side personal finance management application designed to help you take control of your financial life. Built with modern web technologies, it provides a clean, intuitive interface for tracking income, expenses, payments, and savings, all while keeping your data securely stored on your own device.

## Key Features

- **Dashboard Overview**: Get an instant snapshot of your financial health with cards for current balance, monthly income, expenses, and net savings.
- **Multi-Profile Management**: Seamlessly create, switch between, and manage multiple financial profiles (e.g., Personal, Business) without needing an account.
- **Detailed Data Management**: Easily add, view, edit, and delete transactions across four categories: income, expenses, recurring payments, and one-time payments.
- **Advanced Savings Management**:
    - **Savings Accounts**: Track separate savings pots like cash holdings or high-yield savings accounts, with optional interest rate tracking.
    - **Savings Goals**: Create financial goals (e.g., "Dream Vacation") and link them directly to your main balance or specific savings accounts.
    - **Smart Allocation**: The app automatically calculates goal progress based on a "first-come, first-served" priority, showing how funds are allocated across multiple goals linked to a single account.
- **AI-Powered Smart Insights**: With a Gemini API key, get personalized, actionable financial advice based on your data with the click of a button.
- **Comprehensive Visual Reporting**:
    - **Cashflow Trend Chart**: Compare your income vs. expenses over the last 12 months.
    - **Income & Expense Breakdowns**: Understand where your money comes from and where it goes with detailed pie and bar charts.
    - **5-Year Financial Projection**: Visualize your long-term financial trajectory based on current habits.
- **Interactive Payment Calendar**: Never miss a bill again. A full-month calendar visually marks your payment due dates.
- **Upcoming Payments Card**: See a focused list of all payments due in the current month, sorted by date.
- **Secure Local Storage**: All your financial data is stored directly and securely in your browser's local storage. No data is ever sent to a server.
- **Data Portability**: Easily import and export your complete financial profile as a `.json` file for backup or migration purposes.
- **Dark Mode & Customization**: A sleek, eye-friendly dark theme and options for language (EN/DE) and currency (EUR/USD/GBP).

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Charting**: [Recharts](https://recharts.org/)
- **Hosting**: Static hosts like [GitHub Pages](https://pages.github.com/).

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
- [npm](https://www.npmjs.com/) or another package manager

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to see the result.

## Deployment

This application is designed to be deployed as a static site.

1.  **Build the static site:**
    ```bash
    npm run build
    ```
    This command creates a static version of the app in the `out` directory.

2.  **Deploy to GitHub Pages:**
    Follow the [official GitHub Pages documentation](https://pages.github.com/) to deploy the contents of the `out` directory. The included GitHub Action workflow (`.github/workflows/nextjs.yml`) is already configured to do this for you automatically whenever you push to the `master` branch.
