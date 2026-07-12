import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
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

      // Generate unique filename
      const fileExtension = file.name.split(".").pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const uploadDir = join(process.cwd(), "public", "uploads");
      const filePath = join(uploadDir, uniqueFilename);

      // Ensure upload directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

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
        const fileServiceUrl = process.env.FILE_SERVICE_URL || "http://localhost:4003";
        const form = new FormData();
        form.append("document", new Blob([buffer], { type: file.type }), file.name);
        fetch(`${fileServiceUrl}/api/documents/upload`, {
          method: "POST",
          headers: {
            "x-service-key": process.env.SERVICE_API_KEY || "dev-service-key",
            "x-user-id": session.user.id,
          },
          body: form,
        }).catch((err) => console.error("RAG indexing failed:", err.message));
      }

      uploadedFiles.push({
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/uploads/${uniqueFilename}`,
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
