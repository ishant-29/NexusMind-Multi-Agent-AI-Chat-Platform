import { readFile } from "fs/promises";
import { join } from "path";

export async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<{ text: string | null; error?: string }> {
  try {
    let buffer: Buffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      const response = await fetch(filePath);
      if (!response.ok) {
        return { text: null, error: `Failed to fetch remote attachment: HTTP ${response.status} (${response.statusText}) from URL [${filePath}]` };
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const fullPath = join(process.cwd(), "public", filePath);
      buffer = await readFile(fullPath);
    }

    // Extract text based on file type
    if (fileType === "application/pdf") {
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const meaningful = result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").trim();
      return { text: meaningful.length > 0 ? result.text : null, error: meaningful.length > 0 ? undefined : "PDF has no text characters (scanned image)" };
    } else if (fileType === "text/plain") {
      return { text: buffer.toString("utf-8") };
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    } else if (fileType === "application/msword") {
      return { text: buffer.toString("utf-8") };
    }

    return { text: null, error: `Unsupported file type: ${fileType}` };
  } catch (error: any) {
    console.error("Error extracting text from file:", error);
    return { text: null, error: `${error.name || "Error"}: ${error.message || error}` };
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
      const result = await extractTextFromFile(url, type);
      if (result.text) {
        processedFiles.push(
          `[Document: ${name}]\nContent:\n${result.text.substring(0, 10000)}\n[End of ${name}]`
        );
      } else {
        processedFiles.push(
          `[Document: ${name} - No readable text found. Reason/Details: ${result.error || "unknown"}. Please report this exact error/reason to the user so they know what failed.]`
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
