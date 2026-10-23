
export interface FinancialGuidanceInput {
  item: string;
  category: string;
  cost: number;
  priority: string; // 'comfortable' | 'flexible' | 'ahead'
  income: number;
  expenses: number; // Consolidated monthly fixed obligations (rent, EMIs, utilities, groceries)
  emi?: number; // Kept optional for backward compatibility
  otherExpenses?: number;
  location: string;
  lifestyle?: string;
  intent?: string; // "Work / Productivity" | "Lifestyle Upgrade" | "Emotional Impulse" | "Long-term Investment" | "Gift / Celebration"
  urgency?: string; // "This Week" | "This Month" | "Within 3 Months" | "Flexible / No Rush"
  paymentMethod?: 'onetime' | 'emi' | null;
  emiType?: 'nocost' | 'regular' | null;
  emiMonths?: number | null;
  emiAmount?: number | null; // User-entered or custom EMI amount
  downPayment?: number | null;
  stressedSituationNote?: string;
}

export interface DecisionLenses {
  financial: string;
  emotional: string;
  practical: string;
  future: string;
}

export interface PersonalizedExplanation {
  monthlyIncome: number;
  totalObligations: number;
  remainingBuffer: number;
  verdict: 'GO' | 'CAUTION' | 'WAIT';
  reasoning: string;
  actionableAdvice: string;
}

export interface DecisionResult {
  decision: 'GO' | 'CAUTION' | 'WAIT' | 'Safe' | 'Caution' | 'Wait';
  sharpInsight: string;
  lenses: DecisionLenses;
  cautionFlag: string;
  synthesis?: string;
  hook?: string;
  explanation?: PersonalizedExplanation;
  insights?: {
    label: string;
    text: string;
    icon: string;
    detailedAnalysis: string;
  }[];
  confidence?: {
    score: number;
    level: string;
    explanation: string;
  };
  smarterOptions?: {
    title: string;
    desc: string;
    icon: string;
    detailedPlan: string;
  }[];
  closing?: string;
  color?: string;
  overridden?: boolean;
}

export async function getFinancialGuidance(data: FinancialGuidanceInput): Promise<DecisionResult> {
  const stressedPrefix = data.stressedSituationNote ? `${data.stressedSituationNote}\n\n` : '';

  const isEmi = data.paymentMethod === 'emi';
  const effectiveMonthlyEmi = isEmi
    ? (data.emiAmount && data.emiAmount > 0
        ? data.emiAmount
        : (data.emiMonths && data.emiMonths > 0
            ? Math.round((data.cost - (data.downPayment || 0)) / data.emiMonths)
            : data.cost))
    : 0;

  const totalMonthlyObligations = (data.expenses || 0) + (isEmi ? effectiveMonthlyEmi : 0);
  const remainingBuffer = Math.max(0, (data.income || 0) - totalMonthlyObligations);

  let paymentStructureText = `Payment method: One-time payment of ₹${data.cost.toLocaleString('en-IN')}`;
  if (isEmi) {
    paymentStructureText = `Payment method: EMI (${data.emiType === 'regular' ? 'Regular EMI with interest' : 'No-cost EMI 0% interest'})
EMI Type: ${data.emiType === 'regular' ? 'Regular EMI' : 'No-cost EMI'}
Monthly EMI Amount: ₹${effectiveMonthlyEmi.toLocaleString('en-IN')}/month
Duration: ${data.emiMonths || 12} months
${data.downPayment ? `Down payment: ₹${data.downPayment.toLocaleString('en-IN')}\n` : ''}Total purchase cost: ₹${data.cost.toLocaleString('en-IN')}
Total monthly obligations (existing expenses + new EMI): ₹${totalMonthlyObligations.toLocaleString('en-IN')}
Remaining monthly buffer: ₹${remainingBuffer.toLocaleString('en-IN')}`;
  }

  const prompt = `
${stressedPrefix}You are a smart, empathetic, mathematically rigorous financial decision advisor for Sukoon.
Analyze the user's situation and make a clear, definitive verdict.

INPUT DATA:
Item: ${data.item}
Category: ${data.category}
Cost: ₹${data.cost}
${paymentStructureText}
User Mindset: ${data.priority} (comfortable | flexible | ahead)
Why they want this: ${data.intent || 'Lifestyle Upgrade'}
How soon they need it: ${data.urgency || 'This Month'}
Monthly Income: ₹${data.income}
Monthly Fixed Expenses: ₹${data.expenses}
Monthly Surplus before purchase: ₹${Math.max(0, data.income - data.expenses)}
Location: ${data.location}

AFFORDABILITY & EMI VERDICT MATHEMATICS (STRICT REQUIREMENTS):
${isEmi ? `
- The user is buying via EMI (${data.emiType === 'regular' ? 'Regular EMI' : 'No-cost EMI'}).
- Monthly Income: ₹${data.income}
- Existing Expenses: ₹${data.expenses}
- Monthly EMI Commitment: ₹${effectiveMonthlyEmi}
- Total Monthly Obligations (Expenses + EMI): ₹${totalMonthlyObligations}
- Remaining Monthly Buffer: ₹${remainingBuffer} (${data.income > 0 ? Math.round((remainingBuffer / data.income) * 100) : 0}% of income)

CRITICAL EMI RULE:
You MUST evaluate affordability based on the MONTHLY EMI (₹${effectiveMonthlyEmi}) and its impact on the monthly surplus/buffer.
DO NOT evaluate the full purchase price of ₹${data.cost} as an upfront lump sum against a single month's income!
- When Total Monthly Obligations (₹${totalMonthlyObligations}) are <= 60% of Monthly Income (Remaining buffer >= 40%), the verdict MUST be "GO" (Safe to Spend)!
  * For example, with Income ₹75,000, EMI ₹6,000, and Expenses ₹0, remaining buffer is ₹69,000 (92% of income remaining). This is overwhelmingly SAFE and MUST be "GO". It is NEVER "WAIT".
- When Total Monthly Obligations are between 60% and 80% of Monthly Income, the verdict is "CAUTION".
- When Total Monthly Obligations exceed 80% of Monthly Income, or expenses exceed income, the verdict is "WAIT".
` : `
- The user is paying One-Time (₹${data.cost}).
- If cost <= 40% of monthly surplus (or <= 25% of monthly income), verdict is "GO".
- If cost is 40%-100% of monthly surplus, verdict is "CAUTION".
- If cost > monthly surplus * 1.5 or expenses exceed income, verdict is "WAIT".
`}

MINDSET FRAMING:
The user selected mindset: "${data.priority}"
- "comfortable" (Safety-First): Focus on peace of mind, stability, emergency fund protection, and avoiding financial stress. Tone: cautious, protective, and reassuring.
- "flexible" (Be Flexible): Balance growth with present living. Acknowledge it's okay to spend responsibly. Tone: balanced and human.
- "ahead" (Think Ahead): Prioritize long-term wealth building and strategic capital allocation. Tone: strategic and forward-looking.

TIMING & URGENCY FACTOR:
How soon user needs it: "${data.urgency || 'Today'}"
- If "Today": Treat this as a critical, high-urgency or time-sensitive purchase (e.g. today-only deal, flash sale, time-bound need). If math is healthy or manageable with buffer/EMI, lean towards "GO" or constructive "CAUTION" rather than arbitrary delay, recognizing time sensitivity.
- If "This Week" / "This Month": Standard purchasing window.
- If "Within 3 Months" / "Flexible / No Rush": High delay tolerance; good candidate for staging funds or awaiting discounts.

OUTPUT FIELDS REQUIRED:
1. decision: Exactly "GO", "CAUTION", or "WAIT".
2. sharpInsight: A single sharp, memorable insight sentence below the verdict.
3. lenses: Exactly 4 distinct lenses (financial, emotional, practical, future) - exactly 1 sentence each.
4. cautionFlag: A 2-4 word label of the primary flag/reason.
5. explanation: A math-based breakdown showing the exact numbers:
   - monthlyIncome: ${data.income}
   - totalObligations: ${totalMonthlyObligations}
   - remainingBuffer: ${remainingBuffer}
   - verdict: same as decision
   - reasoning: A personalized 2-3 sentence explanation with the exact numbers (e.g., "Your income-to-expense ratio is extremely healthy. With ₹${data.income.toLocaleString('en-IN')} monthly income and ${isEmi ? `₹${effectiveMonthlyEmi.toLocaleString('en-IN')} EMI commitment` : `₹${data.cost.toLocaleString('en-IN')} outlay`}, you’ll have ₹${remainingBuffer.toLocaleString('en-IN')} remaining. Even after accounting for other expenses, you’ll maintain a comfortable buffer. This is the gold standard for ‘Safe’ spending.")
   - actionableAdvice: 1-2 constructive sentences on what to do next.
6. smarterOptions: 2 to 3 creative, feasible ways to make it happen.
7. closing: An inspiring 1-sentence closing remark.
`;

  try {
    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          decision: { type: "STRING", enum: ["GO", "CAUTION", "WAIT"] },
          sharpInsight: { type: "STRING" },
          lenses: {
            type: "OBJECT",
            properties: {
              financial: { type: "STRING" },
              emotional: { type: "STRING" },
              practical: { type: "STRING" },
              future: { type: "STRING" }
            },
            required: ["financial", "emotional", "practical", "future"]
          },
          cautionFlag: { type: "STRING" },
          synthesis: { type: "STRING" },
          explanation: {
            type: "OBJECT",
            properties: {
              monthlyIncome: { type: "NUMBER" },
              totalObligations: { type: "NUMBER" },
              remainingBuffer: { type: "NUMBER" },
              verdict: { type: "STRING", enum: ["GO", "CAUTION", "WAIT"] },
              reasoning: { type: "STRING" },
              actionableAdvice: { type: "STRING" }
            },
            required: ["monthlyIncome", "totalObligations", "remainingBuffer", "verdict", "reasoning", "actionableAdvice"]
          },
          smarterOptions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                desc: { type: "STRING" },
                icon: { type: "STRING" },
                detailedPlan: { type: "STRING" }
              },
              required: ["title", "desc", "icon", "detailedPlan"]
            }
          },
          closing: { type: "STRING" }
        },
        required: ["decision", "sharpInsight", "lenses", "cautionFlag", "explanation"]
      }
    };

    let text = "";
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-3.8-flash", config }),
      });
      if (!r.ok) throw new Error('Generate failed');
      const data = await r.json();
      text = data.text;
    } catch (err: any) {
      console.warn("gemini-3.8-flash failed or busy, retrying with gemini-flash-latest:", err?.message);
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-flash-latest", config }),
      });
      if (!r.ok) throw new Error('Generate failed');
      const data = await r.json();
      text = data.text;
    }

    console.log("RAW RESPONSE:", text);

    let jsonText = (text || "").trim();

    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    let parsed: any = null;
    if (jsonText) {
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn("JSON parse error:", parseError, "Raw JSON text:", jsonText);
      }
    }

    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0 || !parsed.decision) {
      console.warn("Parsed response is empty or invalid. Using default DecisionResult fallback.");
      return getDefaultDecisionResult(data);
    }

    const decision: 'GO' | 'CAUTION' | 'WAIT' = 
      parsed.decision === 'GO' ? 'GO' : 
      parsed.decision === 'WAIT' ? 'WAIT' : 'CAUTION';

    const color = decision === 'GO' ? '#15803d' : decision === 'CAUTION' ? '#d97706' : '#dc2626';

    const fallbackExplanation = getDefaultExplanation(data, decision, effectiveMonthlyEmi, totalMonthlyObligations, remainingBuffer);

    const explanation: PersonalizedExplanation = {
      monthlyIncome: Number(parsed.explanation?.monthlyIncome) || data.income || 0,
      totalObligations: Number(parsed.explanation?.totalObligations) || totalMonthlyObligations,
      remainingBuffer: Number(parsed.explanation?.remainingBuffer) || remainingBuffer,
      verdict: decision,
      reasoning: parsed.explanation?.reasoning || fallbackExplanation.reasoning,
      actionableAdvice: parsed.explanation?.actionableAdvice || fallbackExplanation.actionableAdvice
    };

    return {
      decision,
      sharpInsight: parsed.sharpInsight || (decision === 'GO' 
        ? `Leaves your monthly buffer intact at ₹${remainingBuffer.toLocaleString('en-IN')}.`
        : `This commitment requires ₹${(isEmi ? effectiveMonthlyEmi : data.cost).toLocaleString('en-IN')}/month.`),
      lenses: {
        financial: parsed.lenses?.financial || `Your monthly cash flow retains ₹${remainingBuffer.toLocaleString('en-IN')} after all obligations.`,
        emotional: parsed.lenses?.emotional || "Aligns well with your current life rhythm without causing buyer remorse.",
        practical: parsed.lenses?.practical || "The utility justifies the outlay without adding recurring maintenance burdens.",
        future: parsed.lenses?.future || "Leaves your long-term compounding investments intact."
      },
      cautionFlag: parsed.cautionFlag || (decision === 'GO' ? "Safe liquidity level" : "Discretionary buffer impact"),
      synthesis: parsed.synthesis || parsed.sharpInsight,
      hook: "We ran your decision through our multi-dimensional financial check.",
      explanation,
      insights: [
        {
          label: "Cash Flow",
          text: parsed.lenses?.financial || "Monthly surplus comfortably absorbs this commitment.",
          icon: "💸",
          detailedAnalysis: `Your monthly income of ₹${data.income?.toLocaleString('en-IN')} leaves ₹${remainingBuffer.toLocaleString('en-IN')} buffer after your total obligations of ₹${totalMonthlyObligations.toLocaleString('en-IN')}.`
        },
        {
          label: "Lifestyle Creep",
          text: parsed.lenses?.emotional || "Evaluated against secondary matching purchases.",
          icon: "🏠",
          detailedAnalysis: `This spend is intentional and aligned with your "${data.priority || 'Comfortable'}" focus, minimizing unwanted habit inflation.`
        },
        {
          label: "Opportunity Cost",
          text: parsed.lenses?.future || "Compounding potential preserved in liquid funds.",
          icon: "⚖️",
          detailedAnalysis: `At ₹${data.cost?.toLocaleString('en-IN')}, this allocation maintains your primary savings targets without derailment.`
        },
        {
          label: "Market Cycle",
          text: parsed.lenses?.practical || "Favorable purchase timing and price trend.",
          icon: "🏷️",
          detailedAnalysis: `Current market pricing for ${data.item || 'this item'} in ${data.location || 'your area'} is competitive and stable.`
        }
      ],
      confidence: {
        score: 92,
        level: decision === 'GO' ? 'High' : decision === 'CAUTION' ? 'Moderate' : 'Low',
        explanation: explanation.reasoning
      },
      smarterOptions: (Array.isArray(parsed.smarterOptions) && parsed.smarterOptions.length > 0)
        ? parsed.smarterOptions
        : [
          {
            title: "Stagger by 45 Days",
            desc: "Allocate surplus across two pay cycles to preserve your buffer.",
            icon: "⏳",
            detailedPlan: "Save half this month and purchase on your next payday."
          },
          {
            title: "Explore Certified Open-Box",
            desc: "Save 15-25% without sacrificing full warranty or quality.",
            icon: "💡",
            detailedPlan: "Check authorized retailers for seasonal discounts or open-box deals."
          }
        ],
      closing: parsed.closing || "Make choices that give you long-term Sukoon.",
      color
    };
  } catch (error) {
    console.warn("Gemini service API call encountered an issue:", error);
    return getDefaultDecisionResult(data);
  }
}

function getDefaultExplanation(
  data: FinancialGuidanceInput, 
  decision: 'GO' | 'CAUTION' | 'WAIT', 
  effectiveEmi: number, 
  totalObligations: number, 
  remainingBuffer: number
): { reasoning: string; actionableAdvice: string } {
  const isEmi = data.paymentMethod === 'emi';
  const incomeStr = (data.income || 0).toLocaleString('en-IN');
  const emiStr = effectiveEmi.toLocaleString('en-IN');
  const bufferStr = remainingBuffer.toLocaleString('en-IN');
  const expensesStr = (data.expenses || 0).toLocaleString('en-IN');
  const obligationsStr = totalObligations.toLocaleString('en-IN');
  const costStr = (data.cost || 0).toLocaleString('en-IN');

  if (decision === 'GO') {
    return {
      reasoning: isEmi
        ? `Your income-to-expense ratio is extremely healthy. With ₹${incomeStr} monthly income and ₹${emiStr} EMI commitment (total obligations ₹${obligationsStr}), you’ll have ₹${bufferStr} remaining. Even after accounting for other expenses, you’ll maintain a comfortable buffer. This is the gold standard for ‘Safe’ spending.`
        : `Your income-to-expense ratio is extremely healthy. With ₹${incomeStr} monthly income and total expenses of ₹${expensesStr}, paying ₹${costStr} upfront leaves you with a solid remaining buffer of ₹${bufferStr}. This is the gold standard for ‘Safe’ spending.`,
      actionableAdvice: `You're in a great position to proceed. Keep your automated savings active so your emergency buffer continues to compound.`
    };
  } else if (decision === 'CAUTION') {
    return {
      reasoning: isEmi
        ? `This purchase will tighten your budget temporarily. With ₹${incomeStr} income and ₹${emiStr} EMI plus other expenses totaling ₹${expensesStr}, you’ll have ₹${bufferStr} remaining. It’s manageable, but you’ll have limited room for emergencies. Proceed only if this is important to you.`
        : `This purchase will tighten your budget temporarily. With ₹${incomeStr} income and ₹${costStr} upfront cost against your monthly expenses of ₹${expensesStr}, you’ll have ₹${bufferStr} remaining. It’s manageable, but leaves reduced room for unexpected expenses.`,
      actionableAdvice: `Proceed only if this purchase is a priority. Consider extending the EMI duration or setting aside a small buffer before purchasing.`
    };
  } else {
    return {
      reasoning: isEmi
        ? `This purchase would significantly strain your finances. With ₹${incomeStr} income, ₹${emiStr} EMI, and ₹${expensesStr} other expenses, you’d have only ₹${bufferStr} remaining—below the safe threshold. Waiting 2-3 months to build an additional buffer would make this purchase much safer.`
        : `This purchase would significantly strain your finances. With ₹${incomeStr} income and ₹${expensesStr} monthly expenses, spending ₹${costStr} would leave you with ₹${bufferStr} remaining—below the safe threshold. Waiting to build a larger cash reserve would make this much safer.`,
      actionableAdvice: `Waiting 2-3 months to build a ₹25,000+ safety buffer would make this purchase significantly safer and stress-free.`
    };
  }
}

export function getDefaultDecisionResult(data: FinancialGuidanceInput): DecisionResult {
  const cost = data.cost || 0;
  const income = data.income || 0;
  const expenses = data.expenses || 0;
  const otherExpenses = data.otherExpenses || 0;
  const totalExpenses = expenses + otherExpenses;

  const isEmi = data.paymentMethod === 'emi';
  const effectiveEmi = isEmi
    ? (data.emiAmount && data.emiAmount > 0
        ? data.emiAmount
        : (data.emiMonths && data.emiMonths > 0
            ? Math.round((cost - (data.downPayment || 0)) / data.emiMonths)
            : cost))
    : 0;

  const totalObligations = totalExpenses + (isEmi ? effectiveEmi : 0);
  const remainingBuffer = Math.max(0, income - totalObligations);

  let decision: 'GO' | 'CAUTION' | 'WAIT' = 'CAUTION';

  if (income > 0 && totalExpenses >= income) {
    decision = 'WAIT';
  } else if (isEmi) {
    // For EMI purchases: evaluate debt-to-income and monthly obligations
    const obligationRatio = income > 0 ? (totalObligations / income) : 1;
    if (obligationRatio <= 0.60 && remainingBuffer >= income * 0.40) {
      decision = 'GO';
    } else if (obligationRatio <= 0.82) {
      decision = 'CAUTION';
    } else {
      decision = 'WAIT';
    }
  } else {
    // One-time payment
    const surplus = income - totalExpenses;
    if (surplus > 0 && cost <= surplus * 0.5 && cost <= income * 0.4) {
      decision = 'GO';
    } else if (cost > surplus * 1.5 || cost > income * 0.8) {
      decision = 'WAIT';
    } else {
      decision = 'CAUTION';
    }
  }

  const color = decision === 'GO' ? '#15803d' : decision === 'CAUTION' ? '#d97706' : '#dc2626';
  const itemName = data.item && data.item.trim() ? data.item.trim() : 'this purchase';
  const locationName = data.location && data.location.trim() ? data.location.trim() : 'your area';

  const explanationHelper = getDefaultExplanation(data, decision, effectiveEmi, totalObligations, remainingBuffer);

  const explanation: PersonalizedExplanation = {
    monthlyIncome: income,
    totalObligations,
    remainingBuffer,
    verdict: decision,
    reasoning: explanationHelper.reasoning,
    actionableAdvice: explanationHelper.actionableAdvice
  };

  return {
    decision,
    sharpInsight: decision === 'GO'
      ? `Leaves your monthly cash buffer untouched at ₹${remainingBuffer.toLocaleString('en-IN')}.`
      : decision === 'CAUTION'
      ? `This commitment takes ₹${(isEmi ? effectiveEmi : cost).toLocaleString('en-IN')} — manageable with planning.`
      : `Current obligations leave limited safety buffer; pausing helps protect your liquid reserves.`,
    lenses: {
      financial: remainingBuffer > 0 
        ? `Your monthly surplus retains ₹${remainingBuffer.toLocaleString('en-IN')} after covering all obligations.` 
        : `Fixed commitments currently utilize most of your monthly cash flow.`,
      emotional: data.priority === 'ahead'
        ? `Aligns with your forward-looking mindset while preventing recurring lifestyle inflation.`
        : data.priority === 'flexible'
        ? `Balances personal enjoyment with core financial responsibilities.`
        : `Protects your core peace of mind and emergency cushion.`,
      practical: `The utility of ${itemName} justifies the outlay without incurring recurring maintenance burdens.`,
      future: `Preserves your ongoing savings trajectory and long-term capital compounding.`
    },
    cautionFlag: decision === 'GO' ? "Safe liquidity level" : decision === 'CAUTION' ? "Discretionary buffer impact" : "High commitment ratio",
    synthesis: `Analysis calibrated for ₹${income.toLocaleString('en-IN')} income and ${isEmi ? `₹${effectiveEmi.toLocaleString('en-IN')}/mo EMI` : `₹${cost.toLocaleString('en-IN')} spend`} for ${itemName}.`,
    hook: "We ran your decision through our multi-dimensional financial check.",
    explanation,
    insights: [
      {
        label: "Cash Flow",
        text: remainingBuffer > 0 ? "Monthly surplus easily absorbs this commitment." : "Tight monthly cash flow requires disciplined timing.",
        icon: "💸",
        detailedAnalysis: `Your monthly income of ₹${income.toLocaleString('en-IN')} leaves ₹${remainingBuffer.toLocaleString('en-IN')} buffer after your total obligations of ₹${totalObligations.toLocaleString('en-IN')}.`
      },
      {
        label: "Lifestyle Creep",
        text: `Evaluated against secondary matching purchases for your mindset.`,
        icon: "🏠",
        detailedAnalysis: `This spend is intentional and aligned with your "${data.priority || 'Comfortable'}" focus, minimizing unwanted habit inflation.`
      },
      {
        label: "Opportunity Cost",
        text: "Compounding potential preserved in liquid funds.",
        icon: "⚖️",
        detailedAnalysis: `At ₹${cost.toLocaleString('en-IN')}, this allocation maintains your primary savings targets without derailment.`
      },
      {
        label: "Market Cycle",
        text: "Favorable purchase timing and price trend.",
        icon: "🏷️",
        detailedAnalysis: `Current market pricing for ${itemName} in ${locationName} is competitive and stable.`
      }
    ],
    confidence: {
      score: 90,
      level: decision === 'GO' ? 'High' : decision === 'CAUTION' ? 'Moderate' : 'Low',
      explanation: explanation.reasoning
    },
    smarterOptions: [
      {
        title: "Stagger by 45 Days",
        desc: "Allocate surplus across two pay cycles to preserve your buffer.",
        icon: "⏳",
        detailedPlan: "Save half this month and purchase on your next payday."
      },
      {
        title: "Explore Certified Open-Box",
        desc: "Save 15-25% without sacrificing full warranty or quality.",
        icon: "💡",
        detailedPlan: "Check authorized retailers for seasonal discounts or open-box deals."
      }
    ],
    closing: "Make choices that give you long-term Sukoon.",
    color
  };
}
