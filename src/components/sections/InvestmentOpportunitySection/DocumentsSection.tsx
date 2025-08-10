"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PublicDocument } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  FileText,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { getIconComponent } from "./data";

type DocumentData = PublicDocument;

export function DocumentsSection() {
  const [activeDocument, setActiveDocument] = useState(0);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    void fetchDocuments();
    // Listen for admin-side updates via BroadcastChannel (cross-tab) and fallback event
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("documents");
      bc.onmessage = (e) => {
        if (e?.data?.type === "updated") void fetchDocuments();
      };
    } catch {}
    const onUpdated = () => void fetchDocuments();
    window.addEventListener("documents-updated", onUpdated);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("documents-updated", onUpdated);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents/public");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      // Fallback to static documents if API fails
      setDocuments([
        {
          id: "fallback-1",
          title: "Executive Business Plan",
          description:
            "Comprehensive business strategy with market analysis, financial projections, and risk assessments",
          pages: "47 pages",
          type: "Business Strategy",
          icon: "FileText",
          preview:
            "Detailed market opportunity analysis for Indonesia-Germany trade relationship worth €7.32 Billion annually...",
          restricted: true,
          ai_generated: false,
        },
        {
          id: "fallback-2",
          title: "Financial Projections & ROI Analysis",
          description:
            "Conservative financial modeling with stress-tested scenarios and profitability analysis",
          pages: "23 pages",
          type: "Financial Analysis",
          icon: "BarChart3",
          preview:
            "Net profit of €65,186 with conservative assumptions. Multiple scenario modeling...",
          restricted: true,
          ai_generated: false,
        },
        {
          id: "fallback-3",
          title: "Technical Innovation Overview",
          description:
            "AI-powered matchmaking platform specifications and competitive advantage analysis",
          pages: "15 pages",
          type: "Technology",
          icon: "Zap",
          preview:
            "First-of-kind cultural intelligence algorithms for B2B networking. Custom development by Indonesian team...",
          restricted: false,
          ai_generated: false,
        },
        {
          id: "fallback-4",
          title: "Market Research & Validation",
          description:
            "Primary research including diaspora demographics and competitive landscape analysis",
          pages: "31 pages",
          type: "Market Research",
          icon: "Users",
          preview:
            "Primary research with 21,559 Indonesian community and 30,000+ professionals in German market...",
          restricted: true,
          ai_generated: false,
        },
      ]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocumentAction = (doc: DocumentData) => {
    if (doc.external_url) {
      window.open(doc.external_url, "_blank", "noopener,noreferrer");
    } else if (doc.file_url) {
      window.open(doc.file_url, "_blank", "noopener,noreferrer");
    } else {
      const subject = encodeURIComponent(`Access Request: ${doc.title}`);
      const body = encodeURIComponent(
        `I would like to request access to the document "${doc.title}" for Paguyuban Messe 2026 partnership evaluation.`
      );
      window.open(
        `mailto:nusantaraexpoofficial@gmail.com?subject=${subject}&body=${body}`
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-8 border border-white/10"
    >
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
          <FileText className="w-8 h-8 mr-3 text-blue-400" />
          Executive Documentation
        </h3>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Access comprehensive business analysis, financial projections, and
          strategic planning documents. Request full access to detailed investor
          materials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentsLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative p-6 rounded-xl border bg-white/5 border-white/10 animate-pulse"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="h-12 bg-gray-700 rounded mb-4"></div>
                <div className="flex space-x-3">
                  <div className="flex-1 h-8 bg-gray-700 rounded"></div>
                  <div className="w-8 h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))
          : documents.map((doc, index) => {
              const IconComponent = getIconComponent(doc.icon);
              return (
                <div
                  key={doc.id}
                  className={`relative p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    activeDocument === index
                      ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
                      : "bg-white/5 border-white/10 hover:border-blue-500/30"
                  }`}
                  onClick={() => setActiveDocument(index)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{doc.title}</h4>
                          {doc.ai_generated && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{doc.pages}</span>
                          <span>•</span>
                          <span>{doc.type}</span>
                        </div>
                      </div>
                    </div>
                    {doc.restricted ? (
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <Unlock className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4">
                    {doc.description}
                  </p>

                  <div className="p-3 bg-white/5 rounded-lg mb-4">
                    <p className="text-xs text-gray-400 italic">
                      &ldquo;{doc.preview}&rdquo;
                    </p>
                  </div>

                  {Array.isArray(doc.marketing_highlights) &&
                    doc.marketing_highlights.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-white mb-2">
                          Highlights
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                          {doc.marketing_highlights?.slice(0, 5).map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div className="flex space-x-3">
                    {doc.restricted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentAction(doc);
                        }}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 rounded-lg hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Request Access
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentAction(doc);
                        }}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-blue-200 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {doc.external_url ? "View" : "Download"}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentAction(doc);
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="mt-8 text-center">
        <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto">
          <FileText className="w-5 h-5 mr-3" />
          Request Complete Documentation Package
          <ArrowRight className="w-5 h-5 ml-3" />
        </button>
        <p className="mt-3 text-sm text-gray-400">
          Full investor package includes confidential financials, legal
          documentation, and partnership agreements
        </p>
      </div>
    </motion.div>
  );
}
