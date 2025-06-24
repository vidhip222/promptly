import { type NextRequest, NextResponse } from "next/server"

// Mock database for demo purposes
const mockBots: any[] = [
  {
    id: "demo-hr-bot",
    name: "HR Assistant",
    description: "Helps with HR policies and procedures",
    department: "Human Resources",
    personality: "Professional and empathetic",
    instructions: "Always maintain confidentiality and be helpful",
    status: "active",
    created_at: new Date().toISOString(),
    user_id: "demo-user",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    // Return mock bots for demo
    const bots = mockBots.filter((bot) => bot.user_id === userId)

    return NextResponse.json({ bots })
  } catch (error) {
    console.error("Get bots error:", error)
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, department, personality, instructions, tone, goal, template_id, status } =
      await request.json()

    // Create new bot with mock data
    const newBot = {
      id: `bot-${Date.now()}`,
      user_id: "demo-user",
      name,
      description,
      department,
      personality,
      instructions,
      tone,
      goal,
      template_id,
      status: status || "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockBots.push(newBot)

    return NextResponse.json({ bot: newBot })
  } catch (error) {
    console.error("Create bot error:", error)
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 })
  }
}
