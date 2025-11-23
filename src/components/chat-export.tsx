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
      markdown += `**Exported from TOMO**\n`;
      markdown += `**Date:** ${formatDate()}\n`;
      markdown += `**Total Messages:** ${messages.length}\n\n`;
      markdown += `---\n\n`;

      messages.forEach((message, index) => {
        const role = message.role === "user" ? "You" : "TOMO";
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
      markdown += `*This chat was exported from TOMO - Your AI Assistant*\n`;
      markdown += `*Visit: https://tomo.com*\n`;

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tomo-chat-${Date.now()}.md`;
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

      // Add AJ Logo image
      try {
        const logoImg = await fetch('/aj-logo.jpg').then(res => res.blob()).then(blob => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        });
        doc.addImage(logoImg as string, 'JPEG', margin, yPosition - 5, 10, 10);
      } catch (e) {
        console.warn('Logo load failed, using fallback');
      }
      
      doc.setTextColor(31, 41, 55); // Dark gray
      doc.setFontSize(18);
      doc.setFont("helvetica", "normal");
      doc.text("TOMO Chat", margin + 14, yPosition);
      
      yPosition += 15;

      // Main title - exactly like image
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39); // Near black
      const titleText = chatTitle || "Chat Export from TOMO";
      doc.text(titleText, margin, yPosition);
      yPosition += 7;

      // Subtitle - gray descriptive text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99); // Medium gray
      doc.text(`Here is your exported conversation.`, margin, yPosition);
      yPosition += 15;

      // Process messages - each as numbered section
      let messageCount = 0;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        // Only show non-empty messages
        const textContent =
          message.parts
            ?.filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("\n\n") || "";

        if (!textContent.trim()) continue;
        
        messageCount++;

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Section number/header - bold, black
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        const role = message.role === "user" ? "Question" : "Response";
        doc.text(`${messageCount}) ${role}`, margin, yPosition);
        yPosition += 8;

        // Detect if content contains code
        const hasCodeBlock = textContent.includes('```') || 
                            textContent.includes('public class') ||
                            textContent.includes('function') ||
                            textContent.includes('import ') ||
                            textContent.includes('{') && textContent.includes('}');

        if (hasCodeBlock) {
          // Remove markdown code fences if present
          let codeContent = textContent.replace(/```[\w]*\n?/g, '').trim();
          
          const lines = doc.splitTextToSize(codeContent, contentWidth - 12);
          const boxHeight = lines.length * 4.2 + 10;

          // Dark code block background (like VS Code)
          doc.setFillColor(249, 250, 251); // Light gray background
          doc.setDrawColor(229, 231, 235); // Border
          doc.roundedRect(margin, yPosition - 2, contentWidth, boxHeight, 2, 2, "FD");

          // Code text with syntax-like coloring
          doc.setFontSize(7.5);
          doc.setFont("courier", "normal");

          let lineY = yPosition + 3;
          for (const line of lines) {
            if (lineY > pageHeight - 30) {
              doc.addPage();
              lineY = margin;
            }
            
            // Color keywords differently
            if (line.match(/\b(public|class|static|void|import|return|if|else|for|while|int|String|new)\b/)) {
              doc.setTextColor(124, 58, 237); // Purple for keywords
            } else if (line.match(/["'].*["']/)) {
              doc.setTextColor(5, 150, 105); // Green for strings
            } else if (line.match(/\/\/.*/)) {
              doc.setTextColor(107, 114, 128); // Gray for comments
            } else {
              doc.setTextColor(31, 41, 55); // Dark gray default
            }
            
            doc.text(line, margin + 6, lineY);
            lineY += 4.2;
          }

          yPosition = lineY + 5;
        } else {
          // Regular text (non-code) - cleaner formatting
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(31, 41, 55);
          
          const lines = doc.splitTextToSize(textContent, contentWidth - 4);
          
          let lineY = yPosition;
          for (const line of lines) {
            if (lineY > pageHeight - 30) {
              doc.addPage();
              lineY = margin;
            }
            doc.text(line, margin, lineY);
            lineY += 5;
          }

          yPosition = lineY + 8;
        }
      }

      // Footer section - exactly like perplexity
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 10;

      // Suggestion text (like "If you say which level...")
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Exported from TOMO Chat on ${formatDate()}. Total messages: ${messageCount}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Separator line
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Decorative clover icon
      doc.setTextColor(156, 163, 175); // Light gray
      doc.setFontSize(16);
      doc.text("☘", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Reference-style footer links (smaller text)
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      const footerLinks = [
        "1. https://tomo-chat.com",
        "2. Generated with TOMO AI Assistant",
        "3. Visit us for more conversations"
      ];
      
      footerLinks.forEach((link, idx) => {
        doc.text(link, margin, yPosition);
        yPosition += 5;
      });

      // Save PDF
      doc.save(`tomo-chat-export-${Date.now()}.pdf`);

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
