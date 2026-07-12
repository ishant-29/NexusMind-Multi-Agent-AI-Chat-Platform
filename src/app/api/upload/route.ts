import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileServiceUrl = process.env.FILE_SERVICE_URL || "http://localhost:4003";
      const serviceApiKey = process.env.SERVICE_API_KEY || "dev-service-key";

      // Upload file to File Service for storage
      const uploadForm = new FormData();
      uploadForm.append("file", new Blob([buffer], { type: file.type }), file.name);

      const uploadResponse = await fetch(`${fileServiceUrl}/api/files/upload`, {
        method: "POST",
        headers: {
          "x-service-key": serviceApiKey,
          "x-user-id": session.user.id,
        },
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        throw new Error(`File service upload failed with status ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || "File service returned an invalid response");
      }

      const savedFilename = uploadResult.data.filename;
      const publicFileServiceUrl = process.env.NEXT_PUBLIC_FILE_SERVICE_URL || "http://localhost:4003";
      const fileUrl = `${publicFileServiceUrl}/api/files/${savedFilename}/download`;

      // Also index documents into the RAG store (file service) so the
      // agent's search_documents tool can find them in later messages.
      // Fire-and-forget: chat upload must not fail if indexing does.
      const RAG_TYPES = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (RAG_TYPES.includes(file.type)) {
        const docForm = new FormData();
        docForm.append("document", new Blob([buffer], { type: file.type }), file.name);
        fetch(`${fileServiceUrl}/api/documents/upload`, {
          method: "POST",
          headers: {
            "x-service-key": serviceApiKey,
            "x-user-id": session.user.id,
          },
          body: docForm,
        }).catch((err) => console.error("RAG indexing failed:", err.message));
      }

      uploadedFiles.push({
        id: uploadResult.data.id || uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
