import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken || !authToken.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      const user = JSON.parse(authToken.value)

      // Validate user object
      if (!user.id || !user.email) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        createdAt: user.createdAt,
      })
    } catch (parseError) {
      console.error("Error parsing auth token:", parseError)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
