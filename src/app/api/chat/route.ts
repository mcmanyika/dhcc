import { NextRequest, NextResponse } from "next/server";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { verifyAuthToken } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { CHAT_MODEL, getOpenAIClient } from "@/lib/chat/openai";
import {
  ADMIN_SYSTEM_PROMPT,
  MEMBER_SYSTEM_PROMPT,
  PUBLIC_SYSTEM_PROMPT,
} from "@/lib/chat/prompts";
import {
  ADMIN_CHAT_TOOLS,
  executeAdminChatTool,
} from "@/lib/chat/admin-tools";
import {
  executeChatTool,
  MEMBER_CHAT_TOOLS,
  PUBLIC_CHAT_TOOLS,
  type ChatUser,
} from "@/lib/chat/tools";

export const runtime = "nodejs";

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 5;

type ChatMode = "member" | "public" | "admin";
type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat is not configured. Set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages: ClientMessage[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const mode: ChatMode =
      body.mode === "public"
        ? "public"
        : body.mode === "admin"
          ? "admin"
          : "member";

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "messages are required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (mode === "admin") {
      const admin = await verifyAdminToken(authHeader);
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const authUser = await verifyAuthToken(authHeader);
    const user: ChatUser = authUser
      ? { uid: authUser.uid, email: authUser.email }
      : null;

    if (mode === "member" && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trimmed = messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    })) as ChatCompletionMessageParam[];

    const openai = getOpenAIClient();
    const tools =
      mode === "admin"
        ? ADMIN_CHAT_TOOLS
        : mode === "member"
          ? MEMBER_CHAT_TOOLS
          : PUBLIC_CHAT_TOOLS;
    const systemPrompt =
      mode === "admin"
        ? ADMIN_SYSTEM_PROMPT
        : mode === "member"
          ? MEMBER_SYSTEM_PROMPT
          : PUBLIC_SYSTEM_PROMPT;

    let conversation: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...trimmed,
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: conversation,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        return NextResponse.json(
          { error: "No response from assistant" },
          { status: 502 }
        );
      }

      conversation.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls;
      if (!toolCalls?.length) {
        return NextResponse.json({
          message: assistantMessage.content ?? "",
        });
      }

      for (const toolCall of toolCalls) {
        const result = await runToolCall(toolCall, mode, user);
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json(
      { error: "Assistant took too many steps. Please try again." },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function runToolCall(
  toolCall: ChatCompletionMessageToolCall,
  mode: ChatMode,
  user: ChatUser
) {
  if (toolCall.type !== "function") {
    return { error: "Unsupported tool call type" };
  }

  if (mode === "admin") {
    let args: Record<string, unknown> = {};
    try {
      args = toolCall.function.arguments
        ? JSON.parse(toolCall.function.arguments)
        : {};
    } catch {
      args = {};
    }
    return executeAdminChatTool(toolCall.function.name, args);
  }

  return executeChatTool(toolCall.function.name, user);
}
