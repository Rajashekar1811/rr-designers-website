
const bookingForm = document.getElementById("bookingForm");
const bookingStatus = document.getElementById("bookingStatus");

if (bookingForm && bookingStatus) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const customerName =
      document.getElementById("customerName").value.trim();

    const phone =
      document.getElementById("customerPhone").value.trim();

    const preferredDate =
      document.getElementById("preferredDate").value || null;

    const message =
      document.getElementById("requirements").value.trim();

    const bargainingAmount = Number(
      document.getElementById("bargainingAmount").value || 0
    );

    // Mee booking.html lo service field unte dani value use chestundi.
    const serviceField = document.getElementById("service");
    const service = serviceField
      ? serviceField.value.trim()
      : "Embroidery / Tailoring";

    if (!customerName || !phone) {
      bookingStatus.textContent =
        "Please enter your name and phone number.";
      return;
    }

    if (!/^[0-9+\s()-]{10,16}$/.test(phone)) {
      bookingStatus.textContent =
        "Please enter a valid phone number.";
      return;
    }

    if (
      !Number.isFinite(bargainingAmount) ||
      bargainingAmount < 0
    ) {
      bookingStatus.textContent =
        "Please enter a valid bargaining amount.";
      return;
    }

    bookingStatus.textContent = "Submitting your booking...";

    const submitButton =
      bookingForm.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
      const { data, error } = await supabaseClient
        .from("rr_bookings")
        .insert([{
          customer_name: customerName,
          phone: phone,
          service: service || "Embroidery / Tailoring",
          bargaining_amount: bargainingAmount,
          preferred_date: preferredDate,
          message: message || null,
          status: "New"
        }])
        .select("id")
        .single();

      if (error) throw error;

      bookingStatus.textContent =
        "Booking submitted successfully! Reference: " + data.id;

      bookingForm.reset();
    } catch (error) {
      console.error("Booking submission error:", error);

      bookingStatus.textContent =
        "Booking could not be submitted. Please try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
