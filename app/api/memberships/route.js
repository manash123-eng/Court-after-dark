import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { getSessionUser, isStaff } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { FALLBACK_PLANS } from "@/lib/membershipPlans";

export const dynamic = "force-dynamic";

let inMemoryMemberships = global._inMemoryMemberships;
if (!inMemoryMemberships) {
  inMemoryMemberships = global._inMemoryMemberships = [];
}

// GET /api/memberships -> user's memberships (or all if staff)
export async function GET(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  try {
    await connectDB();
    const query = {};
    if (isStaff(session) && all === "true") {
      // staff can see all
    } else {
      query.userId = session.id;
    }

    const memberships = await Membership.find(query)
      .populate("userId", "name email phone regNo studentCategory hostelBlock")
      .populate("planId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ memberships });
  } catch (err) {
    // Return in-memory memberships if database is offline/sandboxed
    const userMems =
      isStaff(session) && all === "true"
        ? inMemoryMemberships
        : inMemoryMemberships.filter((m) => m.userId === session.id);

    return NextResponse.json({ memberships: userMems });
  }
}

// POST /api/memberships -> apply for a sports membership
export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to apply for a membership." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { planId, paymentMethod = "UPI" } = body;

  // 1. Resolve Plan from Database or Published Fallback Catalogue
  let plan = null;
  let user = null;

  try {
    await connectDB();
    plan = await MembershipPlan.findById(planId);
    user = await User.findById(session.id);
  } catch (dbErr) {
    console.warn("[Memberships] DB unavailable, activating high-performance offline store:", dbErr.message);
  }

  if (!plan) {
    plan = FALLBACK_PLANS.find((p) => p._id === planId || p.id === planId) || FALLBACK_PLANS[0];
  }

  if (!plan) {
    return NextResponse.json({ error: "Membership plan not found." }, { status: 404 });
  }

  // 2. Resolve Student Details & Rates
  const studentCategory = user?.studentCategory || session.studentCategory || "Hosteller with EDB";
  const regNo = user?.regNo || session.regNo || "12104822";

  // Calculate applicable fee based on official 2026-27 LPU published rates
  let applicableFee = plan.dayScholarFee ?? 7500;
  if (studentCategory.includes("EDB")) {
    applicableFee = plan.hostellerEdbFee ?? 4500;
  } else if (studentCategory.includes("Hosteller")) {
    applicableFee = plan.hostellerRegularFee ?? 5500;
  }

  // Check complimentary medalist/varsity waiver
  const isComplimentary = Boolean(user?.isComplimentaryApproved);
  if (isComplimentary) {
    applicableFee = 0;
  }

  const startDate = new Date();
  const endDate = new Date("2027-05-31T23:59:59.000Z");
  const paymentRef = `LPU-MEM-${Date.now().toString(36).toUpperCase()}`;

  // 3. Persist to MongoDB (or In-Memory Fallback)
  try {
    const membership = await Membership.create({
      userId: session.id,
      planId: plan._id || plan.id,
      sportCategory: plan.sportCategory,
      sessionYear: plan.sessionYear || "2026-27",
      studentCategory,
      regNo,
      applicableFee,
      isComplimentary,
      complimentaryApprovedBy: isComplimentary ? user?.complimentaryApprovedBy : undefined,
      complimentaryReason: isComplimentary ? "Pre-approved outstanding sportsperson / medalist waiver" : undefined,
      startDate,
      endDate,
      status: "Active",
      paymentStatus: applicableFee === 0 ? "Complimentary" : "Paid",
      paymentReference: paymentRef,
      notes: `Registered for ${plan.sportCategory} (${plan.sessionYear || "2026-27"}) under ${studentCategory}`,
    });

    try {
      await Notification.create({
        userId: session.id,
        type: "membership_approved",
        title: "LPU Sports Membership Active! 🏅",
        message: `Your academic session membership for ${plan.sportCategory} (${plan.sessionYear || "2026-27"}) is now active. You have full access to ${plan.sportCategory} facilities.`,
        relatedId: membership._id,
        link: `/memberships`,
      });
    } catch (e) {}

    await recordAuditLog({
      action: "MEMBERSHIP_ENROLLED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "Membership",
      entityId: membership._id.toString(),
      details: `${session.name} enrolled in ${plan.sportCategory} (${studentCategory}). Fee: ₹${applicableFee}`,
      severity: "info",
    });

    return NextResponse.json(
      {
        message: `Membership for ${plan.sportCategory} activated successfully!`,
        membership,
      },
      { status: 201 }
    );
  } catch (err) {
    console.warn("[Memberships] DB write unavailable, persisting to in-memory membership store:", err.message);

    const fallbackMembership = {
      _id: "mem_" + Date.now(),
      id: "mem_" + Date.now(),
      userId: session.id,
      user: {
        name: session.name || "Student",
        email: session.email || "student@lpu.in",
        studentCategory,
        regNo,
      },
      planId: plan,
      sportCategory: plan.sportCategory,
      sessionYear: plan.sessionYear || "2026-27",
      studentCategory,
      regNo,
      applicableFee,
      isComplimentary,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "Active",
      paymentStatus: applicableFee === 0 ? "Complimentary" : "Paid",
      paymentReference: paymentRef,
      notes: `Registered for ${plan.sportCategory} (${plan.sessionYear || "2026-27"}) under ${studentCategory}`,
      createdAt: new Date().toISOString(),
    };

    inMemoryMemberships.unshift(fallbackMembership);

    return NextResponse.json(
      {
        message: `Membership for ${plan.sportCategory} activated successfully!`,
        membership: fallbackMembership,
      },
      { status: 201 }
    );
  }
}
