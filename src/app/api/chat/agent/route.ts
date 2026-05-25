import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:7777';
const CONVERSATION_SERVICE_URL = process.env.CONVERSATION_SERVICE_URL || 'http://localhost:4002';

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
    const { content, conversationId, agentName = "General Assistant", attachments, useWebSearch = false } = await req.json();

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return new Response(JSON.stringify({ error: "Message content is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Create or get conversation
    let convoId = conversationId;
    if (!convoId) {
      const convoResponse = await fetch(`${CONVERSATION_SERVICE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: content.slice(0, 40) }),
      });

      if (!convoResponse.ok) {
        throw new Error('Failed to create conversation');
      }

      const convoData = await convoResponse.json();
      convoId = convoData.data._id;
    }

    // Save user message to conversation service
    await fetch(`${CONVERSATION_SERVICE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: convoId,
        content,
        role: 'user',
        attachments: attachments || [],
      }),
    });

    // Build enhanced content with attachments
    let enhancedContent = content;
    if (attachments && attachments.length > 0) {
      const attachmentContext = attachments
        .map((att: any) => att.textContent)
        .filter(Boolean)
        .join('\n\n');
      
      if (attachmentContext) {
        enhancedContent = `${attachmentContext}\n\nUser message: ${content}`;
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
        session_id: convoId,
        user_id: userId,
        stream: true,
        use_web_search: useWebSearch,
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

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(line => line.trim().startsWith("data: "));

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

                // Handle tool calls
                if (parsed.tool_calls) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    tools: parsed.tool_calls 
                  })}\n\n`));
                }

                // Handle reasoning
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

          // Save assistant message
          const saveResponse = await fetch(`${CONVERSATION_SERVICE_URL}/api/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              conversationId: convoId,
              content: fullResponse,
              role: 'assistant',
            }),
          });

          const savedMessage = await saveResponse.json();

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            messageId: savedMessage.data._id,
            conversationId: convoId,
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
