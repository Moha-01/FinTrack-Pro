
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import type { ProfileData, InterestRateEntry, Transaction } from "@/types/fintrack";
import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { de, enUS, ar } from 'date-fns/locale';

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
type Language = 'en' | 'de' | 'ar';

const getCurrentInterestRate = (history: InterestRateEntry[]): InterestRateEntry | null => {
    if (!history || history.length === 0) return null;
    const now = new Date();
    const sortedHistory = [...history].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return sortedHistory.find(entry => parseISO(entry.date) <= now) || null;
}

const addHeader = (doc: jsPDF, profileName: string, t: TFunction, locale: Locale) => {
    doc.setFontSize(20);
    doc.text(t('pdf.title', { profileName }), 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pdf.generatedOn')}: ${format(new Date(), 'PPP p', { locale })}`, 14, 28);
};

const addSummary = (doc: jsPDF, data: FullReportData, t: TFunction, formatCurrency: FormatCurrencyFunction, startY: number) => {
    doc.setFontSize(14);
    doc.text(t('pdf.financialSummary'), 14, startY);
    
    const summaryItems = [
        [t('summary.currentBalance'), formatCurrency(data.summaryData.currentBalance)],
        [t('summary.monthlyIncome'), formatCurrency(data.summaryData.totalMonthlyIncome)],
        [t('summary.monthlyExpenses'), formatCurrency(data.summaryData.totalMonthlyExpenses)],
        [t('summary.netSavings'), formatCurrency(data.summaryData.netMonthlySavings)]
    ];

    autoTable(doc, {
        startY: startY + 5,
        body: summaryItems,
        theme: 'striped',
    });

    return (doc as any).lastAutoTable.finalY + 10;
};

const addTable = (doc: jsPDF, title: string, head: string[][], body: any[][], startY: number) => {
    if (body.length > 0) {
        doc.setFontSize(14);
        doc.text(title, 14, startY);
        autoTable(doc, {
            startY: startY + 5,
            head,
            body,
            theme: 'grid',
            headStyles: { fillColor: [74, 85, 104] },
        });
        return (doc as any).lastAutoTable.finalY + 10;
    }
    return startY;
};

export const generatePdfReport = async (
    data: FullReportData,
    profileName: string,
    t: TFunction,
    formatCurrency: FormatCurrencyFunction,
    language: Language
) => {
    const { transactions, savingsGoals, savingsAccounts } = data.profileData;
    const doc = new jsPDF('p', 'mm', 'a4');
    const locales: Record<Language, Locale> = { en: enUS, de, ar };
    const locale = locales[language];
    
    const recurrenceMap: Record<Transaction['recurrence'], string> = {
      once: t('common.oneTimePayment'),
      monthly: t('dataTabs.monthly'),
      yearly: t('dataTabs.yearly'),
    };

    addHeader(doc, profileName, t, locale);
    let currentY = addSummary(doc, data, t, formatCurrency, 35);
    
    const income = transactions.filter(tx => tx.category === 'income');
    const expenses = transactions.filter(tx => tx.category === 'expense');
    const recurringPayments = transactions.filter(tx => tx.category === 'payment' && tx.recurrence !== 'once');
    const oneTimePayments = transactions.filter(tx => tx.category === 'payment' && tx.recurrence === 'once');

    currentY = addTable(doc, t('common.income'),
        [[t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.recurrence'), t('dataTabs.date')]],
        income.map(i => [i.name, formatCurrency(i.amount), recurrenceMap[i.recurrence], format(parseISO(i.date), 'P', { locale })]),
        currentY
    );

    if (currentY > 200) { doc.addPage(); currentY = 20; }
    currentY = addTable(doc, t('common.expenses'),
        [[t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.recurrence'), t('dataTabs.date')]],
        expenses.map(e => [e.name, formatCurrency(e.amount), recurrenceMap[e.recurrence], format(parseISO(e.date), 'P', { locale })]),
        currentY
    );
    
    if (currentY > 200) { doc.addPage(); currentY = 20; }
     currentY = addTable(doc, t('common.recurringPayment'),
        [[t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.recurrence'), t('dataTabs.date')]],
        recurringPayments.map(p => [
            p.name, 
            formatCurrency(p.amount), 
            p.installmentDetails ? `${t('dataTabs.monthly')} (${p.installmentDetails.numberOfPayments}x)` : recurrenceMap[p.recurrence], 
            format(parseISO(p.date), 'P', { locale })
        ]),
        currentY
    );

    if (currentY > 200) { doc.addPage(); currentY = 20; }
    currentY = addTable(doc, t('common.oneTimePayment'),
        [[t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.date'), t('detailsDialog.paymentStatus')]],
        oneTimePayments.map(p => [
            p.name, 
            formatCurrency(p.amount), 
            format(parseISO(p.date), 'P', { locale }),
            p.status || 'N/A'
        ]),
        currentY
    );
    
    if(savingsAccounts.length > 0 || savingsGoals.length > 0) {
         if (currentY > 180) { doc.addPage(); currentY = 20; }
    }

    currentY = addTable(doc, t('savingsAccounts.title'),
        [[t('savingsAccounts.accountName'), t('common.amount'), t('savingsAccounts.interestRateShort')]],
        savingsAccounts.map(a => {
            const currentRate = getCurrentInterestRate(a.interestHistory);
            return [a.name, formatCurrency(a.amount), currentRate ? `${currentRate.rate.toFixed(2)}%` : '-'];
        }),
        currentY
    );

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
