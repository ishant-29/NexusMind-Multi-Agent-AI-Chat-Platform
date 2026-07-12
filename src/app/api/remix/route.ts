import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await new Promise((r) => setTimeout(r, 800));

    const remixes = [
      {
        style: "formal",
        content: `In a formal context: ${content.split(".")[0]}. This represents a structured approach to the matter at hand.`,
      },
      {
        style: "casual",
        content: `Hey so basically — ${content.toLowerCase().replace(/\.$/, "")}... pretty wild right?`,
      },
      {
        style: "bullets",
        content: content
          .split(". ")
          .filter(Boolean)
          .map((s: string) => `• ${s.trim()}`)
          .join("\n"),
      },
    ];

    return NextResponse.json({ remixes });
  } catch (error) {
    console.error("Remix error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
