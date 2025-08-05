import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ROICalculatorSection from "../ROICalculatorSection";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatNumber = (num: number) =>
  new Intl.NumberFormat("de-DE").format(Math.round(num));

const getSampleCalcValues = () => {
  const investment = 120000;
  const tier = { impressions: 4000000, networking: 50, visibility: 100 };
  const sponsorMetrics = {
    cpmRate: 2.5,
    leadConversionRate: 0.65,
    avgLeadValue: 3500,
    brandLiftRate: 0.2,
    businessPipelineMin: 200000,
    businessPipelineMax: 650000,
  };

  const mediaValue = (tier.impressions / 1000) * sponsorMetrics.cpmRate;
  const estimatedLeads = Math.round(
    tier.networking * sponsorMetrics.leadConversionRate
  );
  const leadValue = estimatedLeads * sponsorMetrics.avgLeadValue;
  const brandLiftValue = investment * sponsorMetrics.brandLiftRate;
  const pipelineMin =
    sponsorMetrics.businessPipelineMin * (tier.visibility / 100);
  const pipelineMax =
    sponsorMetrics.businessPipelineMax * (tier.visibility / 100);
  const avgPipeline = (pipelineMin + pipelineMax) / 2;
  const totalValue = mediaValue + leadValue + brandLiftValue + avgPipeline;
  const roi = ((totalValue - investment) / investment) * 100;
  const payback = investment / (totalValue / 12);

  return {
    totalValue: formatCurrency(totalValue),
    roi: formatNumber(roi),
    payback: formatNumber(payback),
  };
};

describe("ROICalculatorSection actions", () => {
  test("Download Report opens print dialog with report content", async () => {
    const { totalValue } = getSampleCalcValues();

    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();
    const openMock = vi
      .spyOn(window, "open")
      .mockImplementation(() => ({
        document: { write: mockWrite, close: mockClose } as unknown as Document,
        print: mockPrint,
        close: mockClose,
        focus: mockFocus,
      } as unknown as Window));

    render(<ROICalculatorSection />);
    await screen.findByText(totalValue);

    fireEvent.click(screen.getByRole("button", { name: /download report/i }));

    expect(openMock).toHaveBeenCalled();
    expect(mockWrite.mock.calls[0][0]).toContain("Total Sponsorship Value");
    expect(mockWrite.mock.calls[0][0]).toContain(totalValue);
    expect(mockPrint).toHaveBeenCalled();
  });

  test("Share Results uses Web Share API when available", async () => {
    const { totalValue, roi, payback } = getSampleCalcValues();
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      configurable: true,
    });

    render(<ROICalculatorSection />);
    await screen.findByText(totalValue);

    fireEvent.click(screen.getByRole("button", { name: /share results/i }));

    expect(mockShare).toHaveBeenCalledWith({
      title: "ROI Calculation Results",
      text: `Total Sponsorship Value: ${totalValue}\nROI: ${roi}%\nPayback Period: ${payback} months`,
      url: window.location.href,
    });
  });

  test("Share Results falls back to clipboard and alert", async () => {
    const { totalValue, roi, payback } = getSampleCalcValues();
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<ROICalculatorSection />);
    await screen.findByText(totalValue);

    fireEvent.click(screen.getByRole("button", { name: /share results/i }));

    expect(writeText).toHaveBeenCalledWith(
      `Total Sponsorship Value: ${totalValue}\nROI: ${roi}%\nPayback Period: ${payback} months\n${window.location.href}`
    );
    expect(alertSpy).toHaveBeenCalledWith("Results copied to clipboard");
  });
});

