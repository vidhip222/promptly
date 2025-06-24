import { Pool } from "pg"

// PostgreSQL Database Connection
const pool = new Pool({
  host: process.env.AWS_RDS_HOST,
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  port: Number.parseInt(process.env.AWS_RDS_PORT || "5432"),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export { pool }

// Database Schema Types
export interface User {
  id: string
  email: string
  name: string
  cognito_sub: string
  subscription_plan: "free" | "pro" | "enterprise"
  created_at: Date
  updated_at: Date
}

export interface Bot {
  id: string
  user_id: string
  name: string
  description: string
  department: string
  personality: string
  instructions: string
  status: "active" | "draft"
  created_at: Date
  updated_at: Date
}

export interface Document {
  id: string
  bot_id: string
  user_id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  status: "processing" | "completed" | "failed"
  chunks_count: number
  created_at: Date
  updated_at: Date
}

export interface Message {
  id: string
  bot_id: string
  user_id: string
  content: string
  role: "user" | "assistant"
  metadata: Record<string, any>
  created_at: Date
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_id: string
  status: string
  current_period_start: Date
  current_period_end: Date
  created_at: Date
  updated_at: Date
}
