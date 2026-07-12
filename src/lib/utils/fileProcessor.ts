const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || "http://localhost:4003";
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "dev-service-key";

export async function processAttachments(
  attachments: any[],
  userId: string
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

    // For documents, get text content from file service
    if (
      type === "application/pdf" ||
      type === "text/plain" ||
      type.includes("word")
    ) {
      try {
        // Extract filename from URL (e.g. /api/files/filename/download)
        const match = url.match(/\/api\/files\/([^\/]+)/);
        const filename = match ? match[1] : null;

        if (!filename) {
          throw new Error("Could not parse filename from attachment URL");
        }

        // Fetch file record from file service to get textContent
        const response = await fetch(`${FILE_SERVICE_URL}/api/files/${filename}`, {
          headers: {
            "x-service-key": SERVICE_API_KEY,
            "x-user-id": userId,
          },
        });

        if (!response.ok) {
          throw new Error(`File service returned HTTP ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || "Invalid response from file service");
        }

        const text = result.data.textContent;
        if (text) {
          processedFiles.push(
            `[Document: ${name}]\nContent:\n${text.substring(0, 10000)}\n[End of ${name}]`
          );
        } else {
          processedFiles.push(
            `[Document: ${name} - No readable text found. This is likely an empty file or a scanned image.]`
          );
        }
      } catch (err: any) {
        console.error(`Error processing attachment ${name}:`, err);
        processedFiles.push(
          `[Document: ${name} - Text extraction failed. (Details: ${err.message || err})]`
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
