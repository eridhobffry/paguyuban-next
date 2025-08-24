// Test financial data integration with knowledge system
const { dynamicKnowledgeBuilder } = require('./src/lib/knowledge/builder.ts');

async function testFinancialIntegration() {
  try {
    console.log('Testing financial data integration...');

    const knowledge = await dynamicKnowledgeBuilder.buildKnowledge();

    console.log('Financial data in knowledge:', {
      hasFinancial: 'financial' in knowledge,
      financialKeys: knowledge.financial ? Object.keys(knowledge.financial) : 'none',
      revenueCount: knowledge.financial?.revenues?.length || 0,
      costCount: knowledge.financial?.costs?.length || 0,
      totals: knowledge.financial?.totals || {},
    });

    if (knowledge.financial) {
      console.log('Sample revenue:', knowledge.financial.revenues?.[0]);
      console.log('Sample cost:', knowledge.financial.costs?.[0]);
    }

    return knowledge;
  } catch (error) {
    console.error('Error testing financial integration:', error);
    return null;
  }
}

testFinancialIntegration();
