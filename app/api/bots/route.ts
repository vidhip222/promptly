import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateBotConfiguration } from "@/lib/gemini"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("Fetching bots for user:", userId)

    // Get user's bots from Supabase
    const { data: bots, error } = await supabaseAdmin
      .from("bots")
      .select(`
        *,
        documents(id),
        messages(id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get bots error:", error)
      return NextResponse.json({ bots: [] })
    }

    console.log("Found bots:", bots?.length || 0)

    // Transform the data to include counts
    const transformedBots = (bots || []).map((bot) => ({
      ...bot,
      documentsCount: bot.documents?.length || 0,
      messagesCount: bot.messages?.length || 0,
    }))

    return NextResponse.json({ bots: transformedBots })
  } catch (error) {
    console.error("Get bots error:", error)
    return NextResponse.json({ bots: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating bot with data:", body)

    const { name, description, department, personality, instructions, template_id, status, userId } = body

    if (!userId) {
      console.error("Missing userId in request")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (!name || !description) {
      console.error("Missing required fields:", { name: !!name, description: !!description })
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    // Ensure user exists in our users table
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userCheckError && userCheckError.code === "PGRST116") {
      // User doesn't exist, create them
      console.log("Creating user profile for:", userId)

      // ——— Create a minimal profile if it doesn't exist ———
      const { error: createUserError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email: body.email || "unknown@example.com",
        name: body.name || body.email?.split("@")[0] || "User",
        subscription_plan: "free",
      })

      if (createUserError) {
        console.error("Failed to create user profile without admin privileges:", createUserError)
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }
    }

    // Use Gemini to enhance bot configuration if it's from a template
    let enhancedConfig = {
      personality: personality || "helpful",
      instructions: instructions || "Be helpful and professional",
    }

    if (template_id) {
      try {
        console.log("Generating enhanced bot configuration with Gemini...")
        const templateData = {
          name,
          description,
          department,
          personality,
          goal: body.goal || "Help users with their questions",
        }

        const geminiConfig = await generateBotConfiguration(templateData)
        enhancedConfig = {
          personality: geminiConfig.enhancedPersonality || personality,
          instructions: geminiConfig.detailedInstructions || instructions,
        }
        console.log("Enhanced configuration generated")
      } catch (geminiError) {
        console.error("Gemini configuration error:", geminiError)
        // Continue with original config if Gemini fails
      }
    }

    console.log("Inserting bot into database...")
    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .insert({
        user_id: userId,
        name,
        description,
        department: department || "General",
        personality: enhancedConfig.personality,
        instructions: enhancedConfig.instructions,
        status: status || "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("Bot created successfully:", bot.id)
    await supabaseAdmin.from("audit_logs").insert({
      action: "bot_created",
      resource_type: "bot",
      resource_id: bot.id,
      bot_id: bot.id,
      user_id: userId,
      metadata: JSON.stringify({
        name,
        description,
        department: department || "General",
        personality: enhancedConfig.personality,
        instructions: enhancedConfig.instructions,
        status: status || "active",
      }),
    })

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Create bot error:", error)
    return NextResponse.json({ error: `Failed to create bot: ${error.message}` }, { status: 500 })
  }
}
