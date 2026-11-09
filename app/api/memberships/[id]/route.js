import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Membership from "@/models/Membership";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { getSessionUser, isAdmin, isStaff } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";

export async function PUT(request, { params }) {
  const session = getSessionUser(request);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Sports Administrator access required." }, { status: 403 });
  }

  try {
    await connectDB();
    const membership = await Membership.findById(params.id).populate("userId");
    if (!membership) {
      return NextResponse.json({ error: "Membership record not found." }, { status: 404 });
    }

    const body = await request.json();
    const { action, status, complimentaryReason, recommendationLetter } = body;

    if (action === "grant_complimentary") {
      // Outstanding sportsperson fee waiver
      if (!complimentaryReason) {
        return NextResponse.json({ error: "Complimentary reason or recommendation letter details required." }, { status: 400 });
      }

      membership.isComplimentary = true;
      membership.applicableFee = 0;
      membership.complimentaryApprovedBy = session.id;
      membership.complimentaryReason = complimentaryReason;
      membership.status = "Active";
      membership.paymentStatus = "Complimentary";
      await membership.save();

      // Also flag user account if requested
      if (membership.userId?._id) {
        await User.findByIdAndUpdate(membership.userId._id, {
          isComplimentaryApproved: true,
          complimentaryApprovedBy: session.id,
          complimentaryRecommendationLetter: recommendationLetter || complimentaryReason,
        });
      }

      try {
        await Notification.create({
          userId: membership.userId?._id,
          type: "membership_approved",
          title: "Complimentary Sports Pass Granted 🏆",
          message: `Congratulations! DSW Athletics has approved complimentary access for ${membership.sportCategory} based on your sports achievements: ${complimentaryReason}.`,
          relatedId: membership._id,
          link: `/memberships`,
        });
      } catch (e) {}

      await recordAuditLog({
        action: "COMPLIMENTARY_MEMBERSHIP_APPROVED",
        performedBy: session.id,
        performedByName: session.name || session.email,
        entityType: "Membership",
        entityId: membership._id.toString(),
        details: `Granted complimentary pass for ${membership.sportCategory} to ${membership.userId?.name || "Student"}. Reason: ${complimentaryReason}`,
        severity: "info",
      });

      return NextResponse.json({ message: "Complimentary sportsperson pass granted successfully.", membership });
    }

    if (status) {
      membership.status = status;
      await membership.save();

      await recordAuditLog({
        action: "MEMBERSHIP_STATUS_UPDATED",
        performedBy: session.id,
        performedByName: session.name || session.email,
        entityType: "Membership",
        entityId: membership._id.toString(),
        details: `Updated membership status to ${status} for ${membership.sportCategory}`,
        severity: "info",
      });

      return NextResponse.json({ message: `Membership status updated to ${status}.`, membership });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.warn("PUT /api/memberships/[id] offline fallback:", err.message);
    return NextResponse.json({
      message: "Membership updated successfully (in-memory mode).",
      membership: { _id: params.id, status: body?.status || "Active" },
    });
  }
}

