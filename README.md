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
- **Dark Mode & Customization**: A sleek, eye-friendly dark theme and options for language (EN/DE) and currency (EUR/USD/GBP).
- **AI-Powered Insights (Firebase Hosting Only)**: Get smart financial recommendations powered by Google's Gemini API. This feature requires a server and is only available when deployed to a compatible host like Firebase App Hosting.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Charting**: [Recharts](https://recharts.org/)
- **AI**: [Genkit](https://firebase.google.com/docs/genkit)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) or static hosts like [GitHub Pages](https://pages.github.com/).

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
- [npm](https://www.npmjs.com/) or another package manager
- [Firebase CLI](https://firebase.google.com/docs/cli) (required for Firebase deployment)

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
    Open [http://localhost:9002](http://localhost:9002) to see the result. The AI features will be disabled in the local environment unless you provide an API key.

## Deployment

You have two main options for deploying this application.

### Option 1: Static Site (GitHub Pages) - Simple, No AI

This option is great for a simple, client-only version of the app without the AI-powered "Smart Insights".

1.  **Build the static site:**
    ```bash
    npm run build
    ```
    This command creates a static version of the app in the `out` directory.

2.  **Deploy to GitHub Pages:**
    Follow the [official GitHub Pages documentation](https://pages.github.com/) to deploy the contents of the `out` directory. The included GitHub Action workflow (`.github/workflows/nextjs.yml`) is already configured to do this for you automatically whenever you push to the `master` branch.

### Option 2: Full-Featured (Firebase App Hosting) - Recommended, With AI

To use the AI-powered "Smart Insights", you must deploy to a host that provides a secure server environment. This project is pre-configured for Firebase App Hosting.

#### One-Time Setup: Securing your API Key

Your Google AI API key must be stored as a secret in Google Cloud Secret Manager. This is a secure, standard practice.

1.  **Make sure you have the `gcloud` CLI installed and authenticated.** If not, follow the official installation guide and then run `gcloud auth login`.

2.  **Enable the Secret Manager API** for your Google Cloud project (the same as your Firebase project ID):
    ```bash
    gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT_ID
    ```

3.  **Create the secret.** The name `GOOGLE_API_KEY` is required, as the application is configured to look for this specific name.
    ```bash
    printf "YOUR_API_KEY_HERE" | gcloud secrets create GOOGLE_API_KEY --data-file=- --project=YOUR_PROJECT_ID
    ```
    *Replace `YOUR_API_KEY_HERE` with your actual Google AI key and `YOUR_PROJECT_ID` with your project ID.*

4.  **Grant your service account access to the secret.** This allows Firebase to securely access the key.
    ```bash
    gcloud secrets add-iam-policy-binding GOOGLE_API_KEY \
      --member="serviceAccount:$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
      --role="roles/secretmanager.secretAccessor" \
      --project=YOUR_PROJECT_ID
    ```
    *Remember to replace `YOUR_PROJECT_ID`.*

#### Deploy the Application

Once your secret is configured, you can deploy the full application using the Firebase CLI:

```bash
firebase deploy
```

Your live application on Firebase App Hosting will now have the "Smart Insights" feature fully enabled, with the API key kept safely on the server, never exposed to the public.
