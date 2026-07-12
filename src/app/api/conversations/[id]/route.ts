import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { Branch } from "@/models/Branch";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    await dbConnect();

    const conversation = await Conversation.findOne({ _id: id, userId: session.user.id });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rawMessages = await Message.find({
      conversationId: id,
      userId: session.user.id,
      branchId: conversation.activeBranch,
      // Hide scheduled messages that haven't been dispatched yet
      $or: [{ isScheduled: { $ne: true } }, { scheduledFor: { $lte: new Date() } }],
    }).sort({ timestamp: 1 }).lean();

    // Serialize with an `id` field — the frontend keys reactions and
    // branching off message.id, which raw _id-only docs don't provide
    const messages = rawMessages.map((m: any) => ({ ...m, id: m._id.toString() }));

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    console.error("GET /api/conversations/[id] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    await dbConnect();

    await Conversation.findOneAndDelete({ _id: id, userId: session.user.id });
    await Message.deleteMany({ conversationId: id, userId: session.user.id });
    await Branch.deleteMany({ conversationId: id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/conversations/[id] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
