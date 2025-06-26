import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // Contains botId and userId
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bot/${state}?slack_error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
    }

    // Parse state to get botId and userId
    const [botId, userId] = state.split(":")

    // Exchange code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bot/${botId}?slack_error=token_exchange_failed`)
    }

    // Store Slack integration
    const { error: dbError } = await supabaseAdmin.from("slack_integrations").insert({
      bot_id: botId,
      user_id: userId,
      workspace_id: tokenData.team.id,
      bot_token: tokenData.access_token,
      status: "active",
    })

    if (dbError) {
      console.error("Slack integration storage error:", dbError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bot/${botId}?slack_error=storage_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bot/${botId}?slack_success=true`)
  } catch (error) {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get("state")
    const [botId] = state ? state.split(":") : [undefined]
    console.error("Slack OAuth error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bot/${botId}?slack_error=unknown`)
  }
}
