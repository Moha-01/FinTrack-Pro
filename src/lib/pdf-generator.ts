
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment, SavingsGoal, SavingsAccount } from "@/types/fintrack";
import { format, parseISO } from 'date-fns';

type FullReportData = {
    profileData: ProfileData;
    summaryData: {
        currentBalance: number;
        totalMonthlyIncome: number;
        totalMonthlyExpenses: number;
        netMonthlySavings: number;
    }
}

type TFunction = (key: string, replacements?: { [key: string]: string | number }) => string;
type FormatCurrencyFunction = (amount: number) => string;

const addHeader = (doc: jsPDF, profileName: string, t: TFunction) => {
    doc.setFontSize(20);
    doc.text(t('pdf.title', { profileName }), 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pdf.generatedOn')}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 28);
};

const addSummary = (doc: jsPDF, data: FullReportData, t: TFunction, formatCurrency: FormatCurrencyFunction, startY: number) => {
    const summaryItems = [
        [t('summary.currentBalance'), formatCurrency(data.summaryData.currentBalance)],
        [t('summary.monthlyIncome'), formatCurrency(data.summaryData.totalMonthlyIncome)],
        [t('summary.monthlyExpenses'), formatCurrency(data.summaryData.totalMonthlyExpenses)],
        [t('summary.netSavings'), formatCurrency(data.summaryData.netMonthlySavings)]
    ];

    autoTable(doc, {
        startY,
        head: [[t('pdf.financialSummary')]],
        body: summaryItems,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    });

    return (doc as any).lastAutoTable.finalY + 10;
};

const addTable = (doc: jsPDF, title: string, head: string[][], body: any[][], startY: number) => {
    if (body.length > 0) {
        autoTable(doc, {
            startY,
            head,
            body,
            theme: 'grid',
            headStyles: { fillColor: [74, 85, 104] },
        });
        return (doc as any).lastAutoTable.finalY + 10;
    }
    return startY;
};

export const generatePdfReport = (
    data: FullReportData,
    profileName: string,
    t: TFunction,
    formatCurrency: FormatCurrencyFunction
) => {
    const { income, expenses, payments, oneTimePayments, savingsGoals, savingsAccounts } = data.profileData;
    const doc = new jsPDF();

    addHeader(doc, profileName, t);
    let currentY = addSummary(doc, data, t, formatCurrency, 35);
    
    // Income
    currentY = addTable(doc, t('common.income'),
        [[t('dataTabs.source'), t('dataTabs.amount'), t('dataTabs.recurrence')]],
        income.map(i => [i.source, formatCurrency(i.amount), t(`dataTabs.${i.recurrence}`)]),
        currentY
    );
    
    // Expenses
    currentY = addTable(doc, t('common.expenses'),
        [[t('dataTabs.category'), t('dataTabs.amount'), t('dataTabs.recurrence')]],
        expenses.map(e => [e.category, formatCurrency(e.amount), t(`dataTabs.${e.recurrence}`)]),
        currentY
    );
    
    // Recurring Payments
    currentY = addTable(doc, t('common.recurringPayment'),
        [[t('dataTabs.name'), t('dataTabs.monthlyAmount'), t('dataTabs.startDate'), t('dataTabs.endDate'), '#' + t('dataTabs.numberOfInstallments')]],
        payments.map(p => [p.name, formatCurrency(p.amount), format(parseISO(p.startDate), 'P'), format(parseISO(p.completionDate), 'P'), p.numberOfPayments]),
        currentY
    );

    // One-Time Payments
    currentY = addTable(doc, t('common.oneTimePayment'),
        [[t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.dueDate')]],
        oneTimePayments.map(p => [p.name, formatCurrency(p.amount), format(parseISO(p.dueDate), 'P')]),
        currentY
    );

    // Savings Accounts
    currentY = addTable(doc, t('savingsAccounts.title'),
        [[t('savingsAccounts.accountName'), t('common.amount'), t('savingsAccounts.interestRate')]],
        savingsAccounts.map(a => [a.name, formatCurrency(a.amount), a.interestRate ? `${a.interestRate.toFixed(2)}%` : '-']),
        currentY
    );

    // Savings Goals
    currentY = addTable(doc, t('savingsGoals.title'),
        [[t('savingsGoals.goalName'), t('savingsGoals.targetAmount'), t('savingsGoals.currentAmount'), t('savingsGoals.linkToAccount')]],
        savingsGoals.map(g => {
            const linkedTo = g.linkedAccountId === 'main_balance' ? t('summary.currentBalance') : savingsAccounts.find(a => a.id === g.linkedAccountId)?.name || t('savingsGoals.dontLink');
            return [g.name, formatCurrency(g.targetAmount), formatCurrency(g.currentAmount), linkedTo];
        }),
        currentY
    );

    doc.output('dataurlnewwindow');
};
