"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "ui/dropdown-menu";
import { UIMessage } from "ai";
import jsPDF from "jspdf";

interface ChatExportProps {
  messages: UIMessage[];
  chatTitle?: string;
}

export function ChatExport({ messages, chatTitle }: ChatExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToMarkdown = async () => {
    setIsExporting(true);
    try {
      let markdown = `# ${chatTitle || "Chat Export"}\n\n`;
      markdown += `**Exported from AJ STUDIOZ**\n`;
      markdown += `**Date:** ${formatDate()}\n`;
      markdown += `**Total Messages:** ${messages.length}\n\n`;
      markdown += `---\n\n`;

      messages.forEach((message, index) => {
        const role = message.role === "user" ? "You" : "AJ STUDIOZ";
        markdown += `## ${role}\n\n`;

        // Extract text from parts
        const textContent = message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("\n\n");

        markdown += `${textContent || ""}\n\n`;

        if (index < messages.length - 1) {
          markdown += `---\n\n`;
        }
      });

      markdown += `\n---\n\n`;
      markdown += `*This chat was exported from AJ STUDIOZ - Your AI Assistant*\n`;
      markdown += `*Visit: https://aj-studioz.com*\n`;

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aj-studioz-chat-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error("Markdown export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = 20;

      // Header with branding
      doc.setFillColor(59, 130, 246); // Primary blue
      doc.rect(0, 0, pageWidth, 40, "F");

      // Logo text (you can replace with actual logo image)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("AJ STUDIOZ", margin, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Your AI Assistant", margin, 32);

      yPosition = 55;

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(chatTitle || "Chat Export", margin, yPosition);
      yPosition += 10;

      // Metadata
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${formatDate()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Messages: ${messages.length}`, margin, yPosition);
      yPosition += 15;

      // Messages
      doc.setTextColor(0, 0, 0);

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const role = message.role === "user" ? "You" : "AJ STUDIOZ";

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Role header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        if (message.role === "user") {
          doc.setTextColor(59, 130, 246); // Blue for user
        } else {
          doc.setTextColor(34, 197, 94); // Green for assistant
        }
        doc.text(role, margin, yPosition);
        yPosition += 8;

        // Message content
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Extract text from parts
        const textContent =
          message.parts
            ?.filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("\n\n") || "";

        const lines = doc.splitTextToSize(textContent, contentWidth);
        for (const line of lines) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        }

        yPosition += 10; // Space between messages

        // Divider
        if (i < messages.length - 1) {
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;
        }
      }

      // Footer on last page
      yPosition = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Powered by AJ STUDIOZ - Visit us at https://aj-studioz.com",
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );

      // Save PDF
      doc.save(`aj-studioz-chat-${Date.now()}.pdf`);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isExporting || messages.length === 0}
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : exportSuccess ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={exportToPDF}
          className="gap-2 cursor-pointer"
        >
          <FileDown className="size-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={exportToMarkdown}
          className="gap-2 cursor-pointer"
        >
          <FileText className="size-4" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
