"use client";

import { Download, Share, ArrowRight } from "lucide-react";

interface DownloadPanelProps {
  onDownloadReport: () => void;
  onShareResults: () => void;
}

export default function DownloadPanel({
  onDownloadReport,
  onShareResults,
}: DownloadPanelProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={onDownloadReport}
        className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
      >
        <Download className="w-5 h-5 mr-2" />
        Download Report
      </button>
      <button
        onClick={onShareResults}
        className="flex-1 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 font-medium rounded-xl transition-colors flex items-center justify-center"
      >
        <Share className="w-5 h-5 mr-2" />
        Share Results
      </button>
      <button className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
        <ArrowRight className="w-5 h-5 mr-2" />
        Contact Sales
      </button>
    </div>
  );
}
