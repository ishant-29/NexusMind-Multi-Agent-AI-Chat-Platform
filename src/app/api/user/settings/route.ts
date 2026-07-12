import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("settings").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const defaultSettings = {
      theme: "light",
      language: "en",
      defaultModel: "gemini",
      webSearchEnabled: true,
      emailNotifications: true,
      browserNotifications: false,
      soundEnabled: true,
      saveHistory: true,
      analytics: true,
    };

    return NextResponse.json({ 
      settings: user.settings || defaultSettings 
    });
  } catch (error) {
    console.error("[GET /api/user/settings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      theme,
      language,
      defaultModel,
      webSearchEnabled,
      emailNotifications,
      browserNotifications,
      soundEnabled,
      saveHistory,
      analytics,
    } = body;

    const validThemes = ["light", "dark", "system"];
    const validLanguages = ["en", "es", "fr", "de"];
    const validModels = ["gemini", "deepseek", "llama"];

    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }

    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    if (defaultModel && !validModels.includes(defaultModel)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    await dbConnect();

    // Only update fields that were actually provided so a partial
    // PATCH doesn't wipe the user's other settings
    const provided = {
      theme,
      language,
      defaultModel,
      webSearchEnabled,
      emailNotifications,
      browserNotifications,
      soundEnabled,
      saveHistory,
      analytics,
    };
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(provided)) {
      if (value !== undefined) {
        updates[`settings.${key}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true }
    ).select("settings");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      settings: updatedUser.settings 
    });
  } catch (error) {
    console.error("[PATCH /api/user/settings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
