import { GoogleGenAI } from '@google/genai';
import { db } from './db';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export async function processCrmAiQuery(prompt: string, userRole = 'super_admin'): Promise<{ answer: string; relatedEntity?: any; suggestions?: string[] }> {
  const ai = getAiClient();
  const leads = db.getLeads();
  const customers = db.getCustomers();
  const deals = db.getDeals();
  const invoices = db.getInvoices();
  const payments = db.getPayments();
  const metrics = db.getDashboardMetrics();

  // Create a structured CRM context summary
  const crmContext = {
    totalRevenue: metrics.totalRevenue,
    monthlyRevenue: metrics.monthlyRevenue,
    totalLeadsCount: leads.length,
    leadsSummary: leads.map((l) => ({
      name: l.fullName,
      company: l.company,
      status: l.status,
      priority: l.priority,
      expectedValue: l.expectedValue,
      score: l.leadScore,
      assignedTo: l.assignedUserName,
      nextFollowUp: l.nextFollowUp,
      lastUpdated: l.updatedAt,
    })),
    dealsSummary: deals.map((d) => ({
      name: d.name,
      customer: d.customerName,
      value: d.value,
      stage: d.stage,
      probability: d.probability,
      assignedTo: d.assignedUserName,
    })),
    overdueInvoices: invoices
      .filter((i) => i.status === 'overdue' || i.balanceDue > 0)
      .map((i) => ({
        invoiceNumber: i.invoiceNumber,
        customer: i.customerName,
        balanceDue: i.balanceDue,
        dueDate: i.dueDate,
        status: i.status,
      })),
    customersCount: customers.length,
  };

  if (!ai) {
    // Intelligent rule-based engine when API key is unconfigured
    const lower = prompt.toLowerCase();
    if (lower.includes('not contacted') || lower.includes('uncontacted')) {
      const uncontacted = leads.filter((l) => l.status === 'new');
      return {
        answer: `Found ${uncontacted.length} leads in 'New' status that need initial contact: ${uncontacted.map((l) => `${l.fullName} (${l.company}, Value: $${l.expectedValue.toLocaleString()})`).join('; ')}.`,
        suggestions: ['Schedule follow-up call with highest value lead', 'Assign leads to sales reps'],
      };
    }
    if (lower.includes('high priority') || lower.includes('priority')) {
      const highPriority = leads.filter((l) => l.priority === 'urgent' || l.priority === 'high');
      return {
        answer: `There are ${highPriority.length} high/urgent priority leads in the pipeline: ${highPriority.map((l) => `${l.fullName} at ${l.company} (Score: ${l.leadScore}/100, Expected: $${l.expectedValue.toLocaleString()})`).join('; ')}.`,
        suggestions: ['Review proposal for Rahul Sharma', 'Check negotiation terms with Ananya Deshmukh'],
      };
    }
    if (lower.includes('revenue') || lower.includes('collected') || lower.includes('money')) {
      return {
        answer: `Total all-time verified revenue collected is $${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Current month collected revenue stands at $${metrics.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} across verified payment receipts.`,
        suggestions: ['View outstanding invoices', 'Review sales pipeline projection'],
      };
    }
    if (lower.includes('overdue') || lower.includes('invoice')) {
      const overdue = invoices.filter((i) => i.status === 'overdue');
      return {
        answer: `There is currently ${overdue.length} overdue invoice: ${overdue.map((i) => `${i.invoiceNumber} for ${i.customerName} with an outstanding balance of $${i.balanceDue.toLocaleString()}`).join(', ')}.`,
        suggestions: ['Send payment reminder email', 'Log follow-up communication'],
      };
    }

    return {
      answer: `Based on ORVEXA CRM live data, you have ${leads.length} active leads with $${metrics.pipelineTotalValue.toLocaleString()} in sales pipeline, and $${metrics.totalRevenue.toLocaleString()} in verified revenue collected.`,
      suggestions: [
        'Show me leads not contacted in 7 days',
        'Which leads are high priority?',
        'How much revenue did we collect this month?',
        'Show overdue invoices',
      ],
    };
  }

  try {
    const systemPrompt = `You are ORVEXA CRM's intelligent executive AI co-pilot.
You analyze real, live CRM data and provide accurate, crisp, actionable SaaS intelligence.
Never fabricate data or hallucinate customers/numbers not present in the CRM database context.
Ground every answer strictly in the provided JSON data.
Keep answers professional, quantitative, executive-ready, and concise.

CRM Database Context:
${JSON.stringify(crmContext, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    return {
      answer: response.text || 'Unable to generate response from CRM records.',
      suggestions: [
        'Which leads have the highest lead score?',
        'Summarize this quarter’s pipeline conversion',
        'List pending payments and overdue invoices',
      ],
    };
  } catch (err: any) {
    console.error('[AI Assistant Error]:', err);
    return {
      answer: `CRM Analytics Summary: Currently managing ${leads.length} leads across $${metrics.pipelineTotalValue.toLocaleString()} in pipeline opportunities. Total verified revenue stands at $${metrics.totalRevenue.toLocaleString()}. (AI model service temporarily reached fallback mode).`,
      suggestions: [
        'Show me leads not contacted in 7 days',
        'Which leads are high priority?',
        'How much revenue did we collect this month?',
      ],
    };
  }
}
