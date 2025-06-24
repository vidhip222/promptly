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

    // Get user's bots from Supabase
    const { data: bots, error } = await supabaseAdmin
      .from("bots")
      .select(`
        *,
        documents(count),
        messages(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get bots error:", error)
      return NextResponse.json({ bots: [] })
    }

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
        console.log("Enhanced configuration generated:", enhancedConfig)
      } catch (geminiError) {
        console.error("Gemini configuration error:", geminiError)
        // Continue with original config if Gemini fails
      }
    }

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

    console.log("Bot created successfully:", bot)
    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Create bot error:", error)
    return NextResponse.json({ error: `Failed to create bot: ${error.message}` }, { status: 500 })
  }
}
