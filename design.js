
const db = supabaseClient;

const $ = (id) => document.getElementById(id);

const designImage = $("designImage");

const sliderImageIds = [
  "designImage",
  "designImage2",
  "designImage3",
  "designImage4",
  "designImage5"
];

const designVideo = $("designVideo");
const sliderDots = $("designSliderDots");

let sliderItems = [];
let currentSlide = 0;
let sliderTimer = null;

function showDesignSlide(index) {
  if (!sliderItems.length) return;

  currentSlide = (index + sliderItems.length) % sliderItems.length;

  sliderImageIds.forEach((id) => {
    const img = $(id);
    if (img) img.hidden = true;
  });

  designVideo.hidden = true;
  designVideo.pause();

  sliderItems.forEach((item, i) => {
    if (item.type === "image") {
      const img = $(item.id);
      if (img) img.hidden = i !== currentSlide;
    } else {
      designVideo.hidden = i !== currentSlide;
      if (i === currentSlide) {
        designVideo.src = item.url;
        designVideo.load();
      }
    }
  });

  [...sliderDots.children].forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

function startDesignSlider() {
  clearInterval(sliderTimer);

  if (sliderItems.length > 1) {
    sliderTimer = setInterval(() => {
      showDesignSlide(currentSlide + 1);
    }, 5000);
  }
}

function buildDesignSlider(selectedDesign) {
  clearInterval(sliderTimer);
  sliderItems = [];

  const imageUrls = [
    selectedDesign.image_url,
    selectedDesign.image_url_2,
    selectedDesign.image_url_3,
    selectedDesign.image_url_4,
    selectedDesign.image_url_5
  ];

  imageUrls.forEach((url, index) => {
    const img = $(sliderImageIds[index]);
    if (!img) return;

    img.hidden = true;

    if (url) {
      img.src = url;
      img.alt = `${selectedDesign.title || "Design"} photo ${index + 1}`;
      sliderItems.push({
        type: "image",
        id: sliderImageIds[index],
        url
      });
    }
  });

  const videoUrl = selectedDesign.video_url;
  if (videoUrl) {
    sliderItems.push({ type: "video", url: videoUrl });
  }

  sliderDots.replaceChildren();

  sliderItems.forEach((item, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    dot.addEventListener("click", () => {
      showDesignSlide(index);
      startDesignSlider();
    });
    sliderDots.appendChild(dot);
  });

  if (!sliderItems.length) {
    designTitle.textContent = "No design images available";
    return;
  }

  showDesignSlide(0);
  startDesignSlider();
}

$("designPrev").addEventListener("click", () => {
  showDesignSlide(currentSlide - 1);
  startDesignSlider();
});

$("designNext").addEventListener("click", () => {
  showDesignSlide(currentSlide + 1);
  startDesignSlider();
});

const designTitle = $("designTitle");
const designDescription = $("designDescription");
const designPrice = $("designPrice");
const bookingForm = $("pageBookingForm");
const bookingStatus = $("bookingStatus");

// Get the design selected from the gallery
let design = null;

try {
  design = JSON.parse(
    sessionStorage.getItem("selectedDesign") || "null"
  );
} catch (error) {
  console.error("Could not read selected design:", error);
}

// Display the selected design
if (!design) {
  designTitle.textContent = "No Design Selected";
  bookingStatus.textContent =
    "Please go back to the gallery and select a design.";
  bookingForm.hidden = true;
} else {
  buildDesignSlider(design);
  
    designTitle.textContent = design.title || "Selected Design";
    designDescription.textContent = design.description || "";

  const originalPrice = Number(design.price);
  const discountType = design.discount_type || "percent";
  const discountValue = Math.max(0, Number(design.discount_value) || 0);

  const hasPrice =
    design.price !== null &&
    design.price !== undefined &&
    design.price !== "" &&
    Number.isFinite(originalPrice) &&
    originalPrice >= 0;

  let discountAmount = 0;

  if (hasPrice) {
    discountAmount =
      discountType === "fixed"
        ? Math.min(originalPrice, discountValue)
        : originalPrice * Math.min(discountValue, 100) / 100;
  }

  const finalPrice = hasPrice
    ? Math.round(Math.max(0, originalPrice - discountAmount) * 100) / 100
    : null;

  const savings = hasPrice ? originalPrice - finalPrice : 0;

  const discountPercent =
    hasPrice && originalPrice > 0
      ? Math.round((savings / originalPrice) * 100)
      : 0;

  if (!hasPrice) {
    designPrice.textContent = "Price on request";
  } else if (savings > 0) {
    const priceBox = document.getElementById("designPriceBox");
    priceBox.classList.add("special-price-box");

    priceBox.innerHTML = `
      <div class="special-original-price">
        <span>Original Price</span>
        <del>₹${originalPrice.toLocaleString("en-IN")}</del>
        <span class="special-discount-badge">${discountPercent}% OFF</span>
      </div>
      <div class="special-final-price">
        <span>✦ Achievable Amount</span>
        <strong>₹${finalPrice.toLocaleString("en-IN")}</strong>
      </div>
      <div class="special-savings">
        <span>✦ You Save</span>
        <strong>₹${savings.toLocaleString("en-IN")}</strong>
      </div>
    `;
  } else {
    designPrice.textContent = `₹${originalPrice.toLocaleString("en-IN")}`;
  }
}

// Submit design booking
bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!design) {
    bookingStatus.textContent =
      "Please select a design from the gallery first.";
    return;
  }

  if (!db) {
    bookingStatus.textContent =
      "Database connection not found. Check supabase-config.js.";
    return;
  }


  const discount = 0;
  const bargaining = Number($("bargainingAmount").value || 0);

  if (
    !Number.isFinite(discount) ||
    !Number.isFinite(bargaining) ||
    discount < 0 ||
    bargaining < 0
  ) {
    bookingStatus.textContent =
      "Please enter valid, non-negative amounts.";
    return;
  }

  const hasPrice =
    design.price !== null &&
    design.price !== undefined &&
    design.price !== "" &&
    Number.isFinite(Number(design.price));

  const price = hasPrice ? Number(design.price) : null;

  
  if (price !== null && discount + bargaining > price) {
    bookingStatus.textContent =
      "Discount and bargaining amounts together cannot exceed the design price.";
    return;
  }

  const booking = {
    customer_name: $("customerName").value.trim(),
    phone: $("customerPhone").value.trim(),
    service: "Designer Work",
    preferred_date: $("preferredDate").value || null,
    message: $("requirements").value.trim() || null,
    status: "New",
    booking_type: "design",
    design_id: design.id || null,
    design_title: design.title || "Selected Design",
    design_price: price,
    discount_amount: discount,
    bargaining_amount: bargaining
  };

  bookingStatus.textContent = "Submitting booking...";

  const submitButton = bookingForm.querySelector(
    'button[type="submit"]'
  );
  submitButton.disabled = true;

  try {
    const { error } = await db
      .from("rr_bookings")
      .insert(booking);

    if (error) {
      console.error("Booking error:", error);
      bookingStatus.textContent =
        "Booking failed: " + error.message;
      return;
    }

    bookingStatus.textContent =
      "Booking submitted successfully! Thank you for choosing R.R Designers.";

    bookingForm.reset();
  } catch (error) {
    console.error("Unexpected booking error:", error);
    bookingStatus.textContent =
      "Something went wrong. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});
