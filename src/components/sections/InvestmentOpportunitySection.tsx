"use client";

import { SectionHeader } from "./InvestmentOpportunitySection/SectionHeader";
import { MarketDataGrid } from "./InvestmentOpportunitySection/MarketDataGrid";
import { FinancialBreakdown } from "./InvestmentOpportunitySection/FinancialBreakdown";
import { SponsorshipTiers } from "./InvestmentOpportunitySection/SponsorshipTiers";
import { DocumentsSection } from "./InvestmentOpportunitySection/DocumentsSection";

const InvestmentOpportunitySection = () => {
  return (
    <section
      id="investment-opportunity"
      className="relative py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/80"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        <MarketDataGrid />
        <FinancialBreakdown />
        <SponsorshipTiers />
        <DocumentsSection />
      </div>
    </section>
  );
};

export default InvestmentOpportunitySection;
