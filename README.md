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
- **AI-Powered Insights**: Get smart financial recommendations powered by Google's Gemini API, securely processed on the server.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Charting**: [Recharts](https://recharts.org/)
- **AI**: [Genkit](https://firebase.google.com/docs/genkit)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
- [npm](https://www.npmjs.com/) or another package manager
- [Firebase CLI](https://firebase.google.com/docs/cli) (for deployment)

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

3.  **Set up your local environment:**
    Create a file named `.env.local` in the root of your project and add your Google AI API key:
    ```
    GOOGLE_API_KEY=DEIN_API_SCHLÜSSEL_HIER
    ```
    *You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to see the result.

## Deployment to Firebase App Hosting

To deploy the application securely with your API key, follow these steps.

### 1. Set up your Firebase Project

If you haven't already, create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).

### 2. Add your API Key as a Secret

Your Google AI API key must be stored as a secret in Google Cloud Secret Manager. This is a one-time setup.

1.  Make sure you have the `gcloud` CLI installed and authenticated (`gcloud auth login`).
2.  Enable the Secret Manager API:
    ```bash
    gcloud services enable secretmanager.googleapis.com
    ```
3.  Create the secret. **The name `GOOGLE_API_KEY` is required.**
    ```bash
    printf "DEIN_API_SCHLÜSSEL_HIER" | gcloud secrets create GOOGLE_API_KEY --data-file=-
    ```
4.  Grant your Firebase App Hosting service account access to the secret:
    ```bash
    gcloud secrets add-iam-policy-binding GOOGLE_API_KEY --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
    ```

### 3. Deploy the Application

Once your secret is configured, you can deploy the application using the Firebase CLI:

```bash
firebase deploy
```

The CLI will build your Next.js application and deploy it to Firebase App Hosting. Your live application will securely use the API key from Secret Manager, keeping it safe and private.
