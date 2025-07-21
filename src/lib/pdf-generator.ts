
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import type { ProfileData, SavingsGoal, SavingsAccount } from "@/types/fintrack";
import { format, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';

type FullReportData = {
    profileData: ProfileData;
    summaryData: {
        currentBalance: number;
        totalMonthlyIncome: number;
        totalMonthlyExpenses: number;
        netMonthlySavings: number;
    }
}

type ChartRefs = {
    [key: string]: HTMLElement | null;
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

const addChart = async (doc: jsPDF, chartRef: HTMLElement, title: string, startY: number) => {
    const canvas = await html2canvas(chartRef, {
        scale: 2,
        backgroundColor: null
    });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let y = startY;
    if (y + pdfHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(14);
    doc.text(title, 14, y);
    doc.addImage(imgData, 'PNG', 14, y + 5, pdfWidth - 28, pdfHeight - 10);
    return y + pdfHeight + 10;
};

export const generatePdfReport = async (
    data: FullReportData,
    chartRefs: ChartRefs,
    profileName: string,
    t: TFunction,
    formatCurrency: FormatCurrencyFunction
) => {
    const { income, expenses, payments, oneTimePayments, savingsGoals, savingsAccounts } = data.profileData;
    const doc = new jsPDF('p', 'mm', 'a4');

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

    doc.addPage();
    currentY = 20;

    if (chartRefs.expenseChartRef) {
        currentY = await addChart(doc, chartRefs.expenseChartRef, t('expenseChart.title'), currentY);
    }
    if (chartRefs.incomeChartRef) {
        currentY = await addChart(doc, chartRefs.incomeChartRef, t('incomeChart.title'), currentY);
    }
    
    doc.addPage();
    currentY = 20;

    if (chartRefs.cashflowChartRef) {
        currentY = await addChart(doc, chartRefs.cashflowChartRef, t('cashflowChart.title'), currentY);
    }
     if (chartRefs.projectionChartRef) {
        currentY = await addChart(doc, chartRefs.projectionChartRef, t('projectionChart.title'), currentY);
    }


    doc.output('dataurlnewwindow');
};
