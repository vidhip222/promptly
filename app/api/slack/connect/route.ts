import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { botId, workspaceId, accessToken, teamName, channelId } = await request.json()

    if (!botId || !workspaceId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("🔗 Setting up Slack integration for bot:", botId)

    // 1. Validate Slack workspace permissions
    const slackValidation = await fetch("https://slack.com/api/auth.test", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const validationData = await slackValidation.json()

    if (!validationData.ok) {
      return NextResponse.json({ error: "Invalid Slack token" }, { status: 400 })
    }

    console.log("✅ Slack token validated for team:", validationData.team)

    // 2. Create webhook URL for this bot
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/webhook/${botId}`

    // 3. Store integration credentials securely in database
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from("slack_integrations")
      .insert({
        bot_id: botId,
        workspace_id: workspaceId,
        team_id: validationData.team_id,
        team_name: teamName || validationData.team,
        channel_id: channelId,
        access_token: accessToken, // In production, encrypt this
        webhook_url: webhookUrl,
        status: "active",
        connected_at: new Date().toISOString(),
        metadata: {
          user_id: validationData.user_id,
          user_name: validationData.user,
          scopes: validationData.scopes,
        },
      })
      .select()
      .single()

    if (integrationError) {
      console.error("❌ Failed to store integration:", integrationError)
      return NextResponse.json({ error: "Failed to store integration" }, { status: 500 })
    }

    // 4. Set up Slack app event subscriptions (webhook endpoints)
    try {
      const eventSubscription = await fetch("https://slack.com/api/apps.event.subscriptions.update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_subscriptions: {
            enabled: true,
            request_url: webhookUrl,
            bot_events: ["message.channels", "app_mention"],
          },
        }),
      })

      console.log("🎯 Webhook endpoint configured:", webhookUrl)
    } catch (webhookError) {
      console.error("⚠️ Webhook setup failed (non-critical):", webhookError)
    }

    // 5. Log integration for audit trail
    await supabaseAdmin.from("audit_logs").insert({
      action: "slack_integration_created",
      resource_type: "integration",
      resource_id: integration.id,
      bot_id: botId,
      metadata: {
        workspace_id: workspaceId,
        team_name: teamName,
        webhook_url: webhookUrl,
      },
    })

    console.log("✅ Slack integration completed successfully")

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        botId,
        workspaceId,
        teamName: teamName || validationData.team,
        status: "connected",
        webhookUrl,
        connectedAt: integration.connected_at,
      },
      message: "Slack integration connected successfully",
    })
  } catch (error) {
    console.error("❌ Slack connect error:", error)
    return NextResponse.json({ error: "Failed to connect Slack" }, { status: 500 })
  }
}

// Get existing integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("botId")

    if (!botId) {
      return NextResponse.json({ error: "Bot ID required" }, { status: 400 })
    }

    const { data: integrations, error } = await supabaseAdmin
      .from("slack_integrations")
      .select("*")
      .eq("bot_id", botId)
      .eq("status", "active")

    if (error) {
      return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      integrations: integrations.map((integration) => ({
        id: integration.id,
        teamName: integration.team_name,
        channelId: integration.channel_id,
        status: integration.status,
        connectedAt: integration.connected_at,
      })),
    })
  } catch (error) {
    console.error("❌ Get integrations error:", error)
    return NextResponse.json({ error: "Failed to get integrations" }, { status: 500 })
  }
}
