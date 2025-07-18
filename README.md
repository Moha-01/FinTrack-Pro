# FinTrack Pro

FinTrack Pro is a comprehensive, client-side personal finance management application designed to help you take control of your financial life. Built with modern web technologies, it provides a clean, intuitive interface for tracking income, expenses, and payments, all while keeping your data securely stored on your own device.


## Key Features

- **Dashboard Overview**: Get an instant snapshot of your financial health with cards for current balance, monthly income, expenses, and net savings.
- **Multi-Profile Management**: Seamlessly create, switch between, and manage multiple financial profiles (e.g., Personal, Business) without needing an account.
- **Detailed Data Management**: Easily add, view, and delete transactions across four categories: income, expenses, recurring payments, and one-time payments.
- **Visual Reporting**:
    - **5-Year Projection Chart**: Visualize your long-term financial trajectory based on current habits.
    - **Expense Breakdown Chart**: Understand where your money is going with a clear, horizontal bar chart of your monthly expenditures.
- **Interactive Payment Calendar**: Never miss a bill again. A full-month calendar visually marks your payment due dates. Click on any day to see a list of scheduled payments.
- **Upcoming Payments Card**: See a focused list of all payments due in the current month, sorted by date.
- **Secure Local Storage**: All your financial data is stored directly and securely in your browser's local storage. No data is ever sent to a server.
- **Data Portability**: Easily import and export your complete financial profile as a `.json` file for backup or migration purposes.
- **Dark Mode**: A sleek, eye-friendly dark theme that respects your system settings.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Charting**: [Recharts](https://recharts.org/)
- **AI (Future)**: [Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- [npm](https://www.npmjs.com/) or another package manager like [Yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Development Server

To run the app in development mode with hot-reloading:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

### Running Locally (Production Mode)

To run a production version of this app locally, you can use the following commands:

1.  **Build the application:**
    ```bash
    npm run build
    ```

2.  **Start the production server:**
    ```bash
    npm run start
    ```

This will start the server, and you can typically access the app at `http://localhost:3000`.
