import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock bot database
const mockBots = new Map()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bot = mockBots.get(params.id) || {
      id: params.id,
      name: "HR Assistant",
      description: "Helps employees with HR policies, benefits, and procedures",
      department: "Human Resources",
      personality: "professional",
      instructions: "Always be helpful and maintain confidentiality.",
      status: "active",
      createdAt: "2024-01-15",
      documents: [],
    }

    return NextResponse.json(bot)
  } catch (error) {
    console.error("Get bot error:", error)
    return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const existingBot = mockBots.get(params.id) || {}

    const updatedBot = {
      ...existingBot,
      ...updates,
      id: params.id,
      updatedAt: new Date().toISOString(),
    }

    mockBots.set(params.id, updatedBot)

    return NextResponse.json(updatedBot)
  } catch (error) {
    console.error("Update bot error:", error)
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In production, also delete associated documents and embeddings
    mockBots.delete(params.id)

    return NextResponse.json({ success: true, message: "Bot deleted successfully" })
  } catch (error) {
    console.error("Delete bot error:", error)
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}
