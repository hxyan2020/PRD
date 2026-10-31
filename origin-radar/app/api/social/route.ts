import { NextResponse } from "next/server";
import { socialFeed } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json({ posts: socialFeed() });
}
