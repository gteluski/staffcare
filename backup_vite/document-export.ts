import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat } from "docx";
import { saveAs } from "file-saver";

/**
 * Convert HTML content to a DOCX file and trigger download.
 */
export async function exportToDocx(title: string, html: string) {
  const children = htmlToDocxParagraphs(title, html);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "numbers",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 30, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 160 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 120 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${title || "documento"}.docx`);
}

function htmlToDocxParagraphs(title: string, html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun({ text: title, bold: true, size: 40 })],
    spacing: { after: 400 },
  }));

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "<p></p>", "text/html");

  const processNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "h1") {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: extractRuns(el),
        }));
      } else if (tag === "h2") {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: extractRuns(el),
        }));
      } else if (tag === "h3") {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: extractRuns(el),
        }));
      } else if (tag === "ul") {
        el.querySelectorAll(":scope > li").forEach((li) => {
          paragraphs.push(new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            children: extractRuns(li),
          }));
        });
      } else if (tag === "ol") {
        el.querySelectorAll(":scope > li").forEach((li) => {
          paragraphs.push(new Paragraph({
            numbering: { reference: "numbers", level: 0 },
            children: extractRuns(li),
          }));
        });
      } else if (tag === "p") {
        paragraphs.push(new Paragraph({
          children: extractRuns(el),
          spacing: { after: 120 },
        }));
      } else {
        // Fallback: process children
        el.childNodes.forEach(processNode);
      }
    }
  };

  doc.body.childNodes.forEach(processNode);
  return paragraphs;
}

function extractRuns(el: Element): TextRun[] {
  const runs: TextRun[] = [];

  const walk = (node: Node, bold = false, italic = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) {
        runs.push(new TextRun({ text, bold, italics: italic }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      const newBold = bold || tag === "strong" || tag === "b";
      const newItalic = italic || tag === "em" || tag === "i";
      node.childNodes.forEach((child) => walk(child, newBold, newItalic));
    }
  };

  el.childNodes.forEach((child) => walk(child));
  return runs;
}

/**
 * Export as PDF using browser print dialog on a styled window.
 */
export function exportToPdf(title: string, html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Georgia, 'Times New Roman', serif;
          max-width: 700px;
          margin: 40px auto;
          line-height: 1.8;
          color: #222;
          padding: 20px;
        }
        h1 { font-size: 28px; margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
        h2 { font-size: 22px; margin-top: 24px; margin-bottom: 12px; }
        h3 { font-size: 18px; margin-top: 20px; margin-bottom: 8px; }
        ul, ol { margin: 12px 0; padding-left: 24px; }
        li { margin-bottom: 4px; }
        p { margin-bottom: 12px; }
        @media print {
          body { margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${html}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}
