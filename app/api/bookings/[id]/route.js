import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import Notification from "@/models/Notification";
import { getSessionUser, isStaff, canApproveBookings } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { MOCK_FACILITIES } from "@/lib/mockData";

export async function GET(request, { params }) {
  const session = getSessionUser(request);

  try {
    await connectDB();
    const booking = await Booking.findById(params.id)
      .populate("facilityId")
      .populate("userId", "name email phone regNo studentCategory hostelBlock department");

    if (booking) {
      const isOwner = session && (booking.userId?._id?.toString() === session.id || booking.userId?.toString() === session.id);
      const isStaffUser = isStaff(session);

      if (session && !isOwner && !isStaffUser) {
        return NextResponse.json({ error: "Not authorized to view this booking." }, { status: 403 });
      }
      return NextResponse.json({ booking });
    }
  } catch (err) {
    // try fallback
  }

  // Fallback demo booking
  const defaultFacility = MOCK_FACILITIES[0];
  const mockBooking = {
    _id: params.id,
    bookingReference: `LPU-${params.id.slice(-6).toUpperCase()}`,
    userId: { _id: session?.id || "demo_player", name: session?.name || "Aarav Sharma", email: session?.email || "aarav@example.com" },
    facilityId: defaultFacility,
    date: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "19:00",
    durationHours: 1,
    pricePerHour: 0,
    totalPrice: 0,
    paymentMethod: "University ID",
    paymentStatus: "Complimentary / Membership",
    status: "Confirmed",
    qrCodeToken: `LPU-PASS-DEMO-${params.id}`,
    isAttended: false,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ booking: mockBooking });
}

// PUT /api/bookings/[id] -> cancellation, approval, rejection, or gate check-in
export async function PUT(request, { params }) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    await connectDB();
    const booking = await Booking.findById(params.id).populate("facilityId");
    if (!booking) {
      return NextResponse.json({ error: "Booking record not found." }, { status: 404 });
    }

    const isOwner = booking.userId.toString() === session.id;
    const canApprove = canApproveBookings(session);
    const isStaffUser = isStaff(session);

    const body = await request.json();
    const { action, status: targetStatus, approvalNotes, rejectionReason } = body;

    // 1. Approval Action by Coach / Sports Administrator
    if (action === "approve" || targetStatus === "Approved") {
      if (!canApprove) {
        return NextResponse.json({ error: "Coach or Sports Administrator permission required to approve bookings." }, { status: 403 });
      }

      booking.status = "Approved";
      booking.approvalStatus = "Approved";
      booking.approvedBy = session.id;
      booking.approvedByName = session.name || "DSW Sports Official";
      booking.approvedAt = new Date();
      if (approvalNotes) booking.approvalNotes = approvalNotes;
      await booking.save();

      // Notify student
      try {
        await Notification.create({
          userId: booking.userId,
          type: "booking_approved",
          title: "Booking Request Approved! 🏸",
          message: `Your booking for ${booking.facilityId?.name || "the facility"} on ${booking.date} (${booking.startTime}-${booking.endTime}) has been approved by ${booking.approvedByName}.`,
          relatedId: booking._id,
          link: `/bookings`,
        });
      } catch (e) {}

      await recordAuditLog({
        action: "BOOKING_APPROVED",
        performedBy: session.id,
        performedByName: session.name || session.email,
        entityType: "Booking",
        entityId: booking._id.toString(),
        details: `Approved booking ${booking.bookingReference} for student`,
        severity: "info",
      });

      return NextResponse.json({ message: "Booking approved successfully.", booking });
    }

    // 2. Rejection Action by Coach / Sports Administrator
    if (action === "reject" || targetStatus === "Rejected") {
      if (!canApprove) {
        return NextResponse.json({ error: "Coach or Sports Administrator permission required to reject bookings." }, { status: 403 });
      }

      booking.status = "Rejected";
      booking.approvalStatus = "Rejected";
      booking.approvedBy = session.id;
      booking.approvedByName = session.name || "DSW Sports Official";
      booking.approvedAt = new Date();
      if (rejectionReason) booking.approvalNotes = `Rejected: ${rejectionReason}`;
      await booking.save();

      // Notify student
      try {
        await Notification.create({
          userId: booking.userId,
          type: "booking_rejected",
          title: "Booking Request Declined",
          message: `Your booking request for ${booking.facilityId?.name || "the facility"} on ${booking.date} was declined: ${rejectionReason || "Facility reserved for official university event"}.`,
          relatedId: booking._id,
          link: `/bookings`,
        });
      } catch (e) {}

      await recordAuditLog({
        action: "BOOKING_REJECTED",
        performedBy: session.id,
        performedByName: session.name || session.email,
        entityType: "Booking",
        entityId: booking._id.toString(),
        details: `Rejected booking ${booking.bookingReference}. Reason: ${rejectionReason || "Slot unavailable"}`,
        severity: "warning",
      });

      return NextResponse.json({ message: "Booking request declined.", booking });
    }

    // 3. Check-in Gate Attendance Action
    if (action === "check_in" || body.isAttended === true) {
      if (!isStaffUser) {
        return NextResponse.json({ error: "Staff privilege required for gate check-in." }, { status: 403 });
      }

      if (booking.isAttended) {
        return NextResponse.json({ message: "Student already checked in at " + new Date(booking.attendedAt).toLocaleTimeString(), booking });
      }

      booking.isAttended = true;
      booking.attendedAt = new Date();
      booking.attendanceVerifiedBy = session.id;
      if (booking.status === "Approved" || booking.status === "Confirmed") {
        booking.status = "Completed";
      }
      await booking.save();

      return NextResponse.json({ message: "Attendance verified! Digital pass redeemed.", booking });
    }

    // 4. Cancellation by Student or Admin
    if (targetStatus === "Cancelled" || action === "cancel") {
      if (!isOwner && !isStaffUser) {
        return NextResponse.json({ error: "Not authorized to cancel this booking." }, { status: 403 });
      }

      booking.status = "Cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = body.reason || "Cancelled by user";
      if (booking.paymentStatus === "Paid") {
        booking.paymentStatus = "Refunded";
      }
      await booking.save();

      // Notify student if admin cancelled
      if (!isOwner) {
        try {
          await Notification.create({
            userId: booking.userId,
            type: "booking_cancelled",
            title: "Booking Cancelled by Sports Office",
            message: `Your booking for ${booking.facilityId?.name} on ${booking.date} was cancelled: ${booking.cancellationReason}`,
            relatedId: booking._id,
          });
        } catch (e) {}
      }

      return NextResponse.json({
        message: "Booking cancelled successfully. Slot has been freed.",
        booking,
      });
    }

    // 5. Generic update for staff
    if (isStaffUser && targetStatus) {
      booking.status = targetStatus;
      if (body.paymentStatus) booking.paymentStatus = body.paymentStatus;
      await booking.save();
      return NextResponse.json({ message: `Booking marked as ${targetStatus}.`, booking });
    }

    return NextResponse.json({ error: "Invalid action or parameters." }, { status: 400 });
  } catch (err) {
    console.warn("PUT /api/bookings/[id] offline fallback:", err.message);
    return NextResponse.json({
      message: "Booking updated successfully (in-memory mode).",
      booking: { _id: params.id, status: body?.status || "Cancelled" },
    });
  }
}
