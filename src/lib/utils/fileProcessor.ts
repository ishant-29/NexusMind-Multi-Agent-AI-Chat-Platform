import { readFile } from "fs/promises";
import { join } from "path";

export async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<string | null> {
  try {
    let buffer: Buffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote attachment: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const fullPath = join(process.cwd(), "public", filePath);
      buffer = await readFile(fullPath);
    }

    // Extract text based on file type
    if (fileType === "application/pdf") {
      // pdf-parse v2 exposes a class API (v1's pdfParse(buffer) is gone)
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      // Scanned/image-only PDFs yield just "-- N of M --" page markers;
      // treat that as no text so the caller can say so explicitly
      const meaningful = result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").trim();
      return meaningful.length > 0 ? result.text : null;
    } else if (fileType === "text/plain") {
      return buffer.toString("utf-8");
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (fileType === "application/msword") {
      // Basic DOC support (limited)
      return buffer.toString("utf-8");
    }

    return null;
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return null;
  }
}

export async function processAttachments(
  attachments: any[]
): Promise<{ textContent: string }> {
  if (!attachments || attachments.length === 0) {
    return { textContent: "" };
  }

  const processedFiles: string[] = [];

  for (const attachment of attachments) {
    const { name, url } = attachment;
    const type: string = attachment.type || "";

    // For videos, just mention them
    if (type.startsWith("video/")) {
      processedFiles.push(`[Video: ${name}]`);
      continue;
    }

    // For documents, extract text
    if (
      type === "application/pdf" ||
      type === "text/plain" ||
      type.includes("word")
    ) {
      const text = await extractTextFromFile(url, type);
      if (text) {
        processedFiles.push(
          `[Document: ${name}]\nContent:\n${text.substring(0, 10000)}\n[End of ${name}]`
        );
      } else {
        processedFiles.push(
          `[Document: ${name} - No readable text found. This is likely a scanned or image-based file whose contents cannot be read without OCR. Tell the user this plainly and ask for a text-based version.]`
        );
      }
    }
  }

  if (processedFiles.length === 0) {
    return { textContent: "" };
  }

  const textContent = `\n\n--- Attached Files ---\n${processedFiles.join("\n\n")}\n--- End of Attachments ---\n\n`;
  return { textContent };
}
