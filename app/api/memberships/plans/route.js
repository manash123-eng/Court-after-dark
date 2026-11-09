import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MembershipPlan from "@/models/MembershipPlan";
import { FALLBACK_PLANS } from "@/lib/membershipPlans";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDB();
    const plans = await MembershipPlan.find({ isActive: true }).sort({ sportCategory: 1 });
    if (plans && plans.length > 0) {
      return NextResponse.json({ plans });
    }
  } catch (err) {
    console.warn("DB offline for plans, falling back to published catalogue:", err.message);
  }

  return NextResponse.json({ plans: FALLBACK_PLANS });
}
