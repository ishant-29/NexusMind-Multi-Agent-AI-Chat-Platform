import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { processAttachments } from "@/lib/utils/fileProcessor";

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:7777';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = session.user.id;
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid session. Please log out and log back in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { content, conversationId, branchId = "main", agentName = "General Assistant", attachments, useWebSearch = false } = await req.json();

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return new Response(JSON.stringify({ error: "Message content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await dbConnect();

    // Create or load the conversation with the session user's identity.
    // Persistence happens here (same Mongo the rest of the app uses) rather
    // than through the conversation service, which requires a service JWT
    // the browser session cannot provide.
    let convo;
    if (conversationId) {
      if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        return new Response(JSON.stringify({ error: "Invalid conversation ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      convo = await Conversation.findOne({ _id: conversationId, userId });
      if (!convo) {
        return new Response(JSON.stringify({ error: "Conversation not found or access denied" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      convo = await Conversation.create({ userId, title: (content || "New Conversation").slice(0, 40) });
    }

    await Message.create({
      conversationId: convo._id,
      userId,
      branchId,
      content: content || "[Sent with attachment]",
      role: "user",
      attachments: attachments || [],
    });

    // Build enhanced content with attachments: extract text from the
    // uploaded files on disk (upload API returns only metadata, not content)
    let enhancedContent = content || "";
    if (attachments && attachments.length > 0) {
      try {
        const { textContent } = await processAttachments(attachments);
        if (textContent) {
          enhancedContent = `${textContent}\n\nUser message: ${content || "Please review the attached file(s)."}`;
        }
      } catch (err) {
        console.error("Attachment processing error:", err);
      }
    }

    // Stream response from Agent Service
    const agentResponse = await fetch(`${AGENT_SERVICE_URL}/api/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentName,
        message: enhancedContent,
        session_id: convo._id.toString(),
        user_id: userId,
        stream: true,
        use_web_search: useWebSearch,
        use_rag: !attachments || attachments.length === 0, // Disable RAG if file text is already attached in the prompt
      }),
    });

    if (!agentResponse.ok) {
      throw new Error('Agent service failed');
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          const reader = agentResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No response body');
          }

          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const rawLines = buffer.split("\n");
            buffer = rawLines.pop() || "";
            const lines = rawLines.filter(line => line.trim().startsWith("data: "));

            for (const line of lines) {
              const data = line.replace("data: ", "").trim();
              if (data === "[DONE]") continue;
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed.content || parsed.delta?.content || "";

                if (text) {
                  fullResponse += text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }

                if (parsed.tool_calls) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    tools: parsed.tool_calls
                  })}\n\n`));
                }

                if (parsed.reasoning) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    reasoning: parsed.reasoning
                  })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }

          let savedMessageId: string | undefined;
          if (fullResponse) {
            try {
              const botMessage = await Message.create({
                conversationId: convo._id,
                userId,
                branchId,
                content: fullResponse,
                role: "assistant",
              });
              savedMessageId = botMessage._id.toString();
            } catch (err) {
              console.error("Failed to save assistant message:", err);
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            messageId: savedMessageId,
            conversationId: convo._id.toString(),
            usedWebSearch: useWebSearch,
          })}\n\n`));

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat agent error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
