
const db = supabaseClient;

const $ = (id) => document.getElementById(id);

// Mobile navigation
const menuToggle = $("menuToggle");
const navMenu = $("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
    });
  });
}

// Footer year
if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

// Prevent selecting a past booking date
if ($("preferredDate")) {
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  $("preferredDate").min = localToday;
}

// Service shortcuts
document.querySelectorAll("[data-service]").forEach((button) => {
  button.addEventListener("click", () => {
    if ($("service")) {
      $("service").value = button.dataset.service;
    }
    $("booking")?.scrollIntoView({ behavior: "smooth" });
  });
});

// Public design gallery and design details modal
let selectedDesign = null;

let allPublicDesigns = [];

function calculateFinalPrice(price, discountType, discountValue) {
  const originalPrice = Number(price);

  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    return null;
  }

  const value = Math.max(0, Number(discountValue) || 0);

  const discount =
    discountType === "fixed"
      ? value
      : originalPrice * Math.min(value, 100) / 100;

  return Math.round(
    Math.max(0, originalPrice - discount) * 100
  ) / 100;
}

function filterPublicGallery() {
  const searchInput = document.getElementById("designSearch");
  const gallery = document.getElementById("publicGallery");
  const count = document.getElementById("designSearchCount");

  if (!searchInput || !gallery) return;

  const keyword = searchInput.value.trim().toLowerCase();
  const cards = gallery.querySelectorAll(".gallery-item");
  let visibleCount = 0;

  cards.forEach((card) => {
    const searchableText = card.dataset.searchText || "";
    const matches = searchableText.includes(keyword);

    card.hidden = !matches;

    if (matches) visibleCount++;
  });

  if (count) {
    count.textContent = keyword
      ? `${visibleCount} design(s) found`
      : `${visibleCount} design(s) available`;
  }
}

document.getElementById("designSearch")?.addEventListener(
  "input",
  filterPublicGallery
);

async function loadPublicGallery() {
  const gallery = $("publicGallery");
  if (!gallery) return;

  gallery.replaceChildren();

  const loading = document.createElement("p");
  loading.textContent = "Loading our designs...";
  gallery.appendChild(loading);

  const { data, error } = await db
    .from("rr_designs")
    
  .select(
    "id, title, category, image_url, description, price, image_url_2, image_url_3, image_url_4, discount_type, discount_value, is_special, special_line"
  )

    .eq("published", true)
    .eq("show_on_main", true)
    .order("created_at", { ascending: false });

  gallery.replaceChildren();

  if (error) {
    const message = document.createElement("p");
    message.textContent =
      "Designs are temporarily unavailable. Please try again later.";
    gallery.appendChild(message);
    console.error("Gallery error:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    const message = document.createElement("p");
    message.textContent = "Our new designs will appear here soon.";
    gallery.appendChild(message);
    return;
  }

  data.forEach((design) => {
    const card = document.createElement("article");
    card.className = "gallery-item";
    card.dataset.category = design.category || "";
card.dataset.searchText = [
  design.title,
  design.category,
  design.description
].filter(Boolean).join(" ").toLowerCase();

    card.tabIndex = 0;
    card.setAttribute(
      "aria-label",
      `View details for ${design.title}`
    );
    card.style.cursor = "pointer";

    const image = document.createElement("img");
    image.src = design.image_url;
    image.alt = design.title || "Design";
    image.loading = "lazy";

    const caption = document.createElement("div");
    caption.className = "gallery-caption";

    const title = document.createElement("h3");
    title.textContent = design.title || "Untitled Design";

    const category = document.createElement("p");
    category.textContent = design.category || "";
      
const originalPrice = Number(design.price);
const finalPrice = calculateFinalPrice(
  design.price,
  design.discount_type || "percent",
  design.discount_value || 0
);

if (finalPrice !== null) {
  const priceBox = document.createElement("div");
  priceBox.className = "gallery-price";

  if (
    Number.isFinite(originalPrice) &&
    originalPrice > 0 &&
    finalPrice < originalPrice
  ) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "original-price";
    oldPrice.textContent =
      `₹${originalPrice.toLocaleString("en-IN")}`;
    oldPrice.style.textDecoration = "line-through";

    const newPrice = document.createElement("strong");
    newPrice.className = "discounted-price";
    newPrice.textContent =
      `₹${finalPrice.toLocaleString("en-IN")}`;

    priceBox.append(oldPrice, newPrice);
  } else {
    priceBox.textContent =
      `₹${originalPrice.toLocaleString("en-IN")}`;
  }

  caption.appendChild(priceBox);
}

if (design.is_special === true) {
  const offer = document.createElement("p");
  offer.className = "special-offer";
  offer.textContent =
    design.special_line || "✨ Special Offer";
  caption.appendChild(offer);
}

    const hint = document.createElement("p");
    hint.textContent = "Click to view details";
    hint.className = "design-view-hint";

    caption.append(title, category, hint);
    card.append(image, caption);

    
card.addEventListener("click", () => {
  sessionStorage.setItem("selectedDesign", JSON.stringify(design));
  window.location.href = "design.html";
});


    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sessionStorage.setItem("selectedDesign", JSON.stringify(design));
        window.location.href = "design.html";
      }
    });

    gallery.appendChild(card);
    filterPublicGallery();
  });
}

function openDesignModal(design) {
  const modal = $("designModal");
  if (!modal) {
    console.error("Design modal HTML is missing from index.html");
    return;
  }

  selectedDesign = design;

  $("modalDesignTitle").textContent = design.title || "Design Details";
  $("modalDesignCategory").textContent = design.category || "";
  $("modalDesignDescription").textContent =
    design.description || "Contact us for more details about this design.";



const originalPrice = Number(design.price);

const finalPrice = calculateFinalPrice(
  design.price,
  design.discount_type || "percent",
  design.discount_value || 0
);

const hasDiscount =
  Number.isFinite(originalPrice) &&
  originalPrice > 0 &&
  finalPrice !== null &&
  finalPrice < originalPrice;

const discountPercent = hasDiscount
  ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
  : 0;

const savings = hasDiscount ? originalPrice - finalPrice : 0;

const priceBox = $("modalDesignPrice");

if (priceBox) {
  if (originalPrice > 0 && finalPrice !== null) {
    priceBox.innerHTML = hasDiscount
      ? `
        <div class="special-price-box">
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
        </div>
      `
      : `₹${originalPrice.toLocaleString("en-IN")}`;
  } else {
    priceBox.textContent = "Price on request";
  }
}



  const imageUrls = [
    design.image_url,
    design.image_url_2,
    design.image_url_3,
    design.image_url_4
  ].filter((url) => typeof url === "string" && url.trim() !== "");

  const mainImage = $("modalMainImage");
  const thumbnails = $("modalImageThumbnails");

  thumbnails.replaceChildren();

  if (imageUrls.length > 0) {
    mainImage.src = imageUrls[0];
    mainImage.alt = design.title || "Selected design";

    imageUrls.forEach((url, index) => {
      const thumbnailButton = document.createElement("button");
      thumbnailButton.type = "button";
      thumbnailButton.className = index === 0 ? "active" : "";
      thumbnailButton.setAttribute("aria-label", `View photo ${index + 1}`);

      const thumbnailImage = document.createElement("img");
      thumbnailImage.src = url;
      thumbnailImage.alt = `Design photo ${index + 1}`;
      thumbnailImage.loading = "lazy";

      thumbnailButton.appendChild(thumbnailImage);

      thumbnailButton.addEventListener("click", () => {
        mainImage.src = url;
        mainImage.alt = `${design.title || "Design"} photo ${index + 1}`;

        thumbnails.querySelectorAll("button").forEach((button) => {
          button.classList.remove("active");
        });

        thumbnailButton.classList.add("active");
      });

      thumbnails.appendChild(thumbnailButton);
    });
  } else {
    mainImage.removeAttribute("src");
    mainImage.alt = "No design photo available";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  $("closeDesignModal")?.focus();
}

function closeDesignModal() {
  const modal = $("designModal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("closeDesignModal")?.addEventListener("click", closeDesignModal);
$("designModalBackdrop")?.addEventListener("click", closeDesignModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDesignModal();
  }
});


/* Separate booking for the selected gallery design */

const designBookingModal = $("designBookingModal");
const designBookingForm = $("designBookingForm");

function openDesignBookingModal() {
  if (!selectedDesign || !designBookingModal) return;

  const image = $("bookingDesignImage");
  const title = $("bookingDesignTitle");
  const price = $("bookingDesignPrice");
  const status = $("designBookingStatus");

  if (image) {
    image.src = selectedDesign.image_url || "";
    image.alt = selectedDesign.title || "Selected design";
  }

  if (title) {
    title.textContent = selectedDesign.title || "Selected Design";
  }

if (price) {
  const originalPrice = Number(selectedDesign.price);

  const finalPrice = calculateFinalPrice(
    selectedDesign.price,
    selectedDesign.discount_type || "percent",
    selectedDesign.discount_value || 0
  );

  if (finalPrice !== null) {
    price.textContent =
      Number.isFinite(originalPrice) &&
      originalPrice > 0 &&
      finalPrice < originalPrice
        ? `₹${finalPrice.toLocaleString("en-IN")} (Discounted price)`
        : `₹${originalPrice.toLocaleString("en-IN")}`;
  } else {
    price.textContent = "Price on request";
  }
}

  designBookingForm?.reset();

  if (status) status.textContent = "";

  closeDesignModal();

  designBookingModal.classList.add("open");
  designBookingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDesignBookingModal() {
  if (!designBookingModal) return;

  designBookingModal.classList.remove("open");
  designBookingModal.setAttribute("aria-hidden", "true");

  document.body.style.overflow =
    $("designModal")?.classList.contains("open") ? "hidden" : "";
}

$("bookThisDesign")?.addEventListener(
  "click",
  openDesignBookingModal
);

$("closeDesignBooking")?.addEventListener(
  "click",
  closeDesignBookingModal
);

$("designBookingBackdrop")?.addEventListener(
  "click",
  closeDesignBookingModal
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDesignBookingModal();
  }
});

/* Save the selected design booking to Supabase */

designBookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedDesign) return;

  const status = $("designBookingStatus");
  const submitButton = $("submitDesignBooking");

  const customerName = $("designCustomerName")?.value.trim();
  const phone = $("designCustomerPhone")?.value.trim();
  const preferredDate = $("designPreferredDate")?.value || null;
  const requirements = $("designCustomerMessage")?.value.trim() || "";

  if (!customerName || !phone) {
    if (status) status.textContent = "Please enter your name and phone number.";
    return;
  }

  if (submitButton) submitButton.disabled = true;
  if (status) status.textContent = "Submitting your design booking...";

 const rawPrice = selectedDesign.price;

const designPrice =
  rawPrice !== null && rawPrice !== undefined && rawPrice !== ""
    ? calculateFinalPrice(
        rawPrice,
        selectedDesign.discount_type || "percent",
        selectedDesign.discount_value || 0
      )
    : null;

  const bookingMessage = [
    `Design: ${selectedDesign.title || "Selected Design"}`,
    `Price: ${
      designPrice !== null && Number.isFinite(designPrice)
        ? `₹${designPrice}`
        : "Price on request"
    }`,
    requirements ? `Requirements: ${requirements}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { error } = await db.from("rr_bookings").insert({
      customer_name: customerName,
      phone,
      service: "Designer Work",
      preferred_date: preferredDate,
      message: bookingMessage,
      status: "New",
      booking_type: "design",
      design_id: selectedDesign.id,
      design_title: selectedDesign.title || "Selected Design",
      design_price:
        designPrice !== null && Number.isFinite(designPrice)
          ? designPrice
          : null
    });

    if (error) throw error;

    if (status) {
      status.textContent = "Booking submitted successfully!";
    }

    designBookingForm.reset();

    setTimeout(() => {
      closeDesignBookingModal();
    }, 1500);
  } catch (error) {
    console.error("Design booking error:", error);

    if (status) {
      status.textContent =
        "Booking could not be submitted. Please try again.";
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// WhatsApp contact
// Replace this placeholder with the shop's WhatsApp number.
const SHOP_WHATSAPP_NUMBER = "919848230843";

function makeWhatsAppLink(message) {
  const number = SHOP_WHATSAPP_NUMBER.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function configureWhatsAppLinks() {
  const button = $("whatsappButton");

  if (button) {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const customerName = $("customerName")?.value.trim() || "";
      const phone = $("customerPhone")?.value.trim() || "";
      const service = $("service")?.value || "";
      const preferredDate = $("preferredDate")?.value || "Not specified";
      const message = $("customerMessage")?.value.trim() || "";

      const whatsappMessage =
        `Hello R.R Designers!\n` +
        `Name: ${customerName || "Not provided"}\n` +
        `Phone: ${phone || "Not provided"}\n` +
        `Service: ${service || "Not selected"}\n` +
        `Preferred date: ${preferredDate}\n` +
        `Requirements: ${message || "Not provided"}`;

      window.open(
        makeWhatsAppLink(whatsappMessage),
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  const message = "Hello R.R Designers, I would like to enquire about your designs.";
  const link = makeWhatsAppLink(message);

  ["whatsappButton", "floatingWhatsapp"].forEach((id) => {
    const element = $(id);
    if (element) {
      element.href = link;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  });
}

// Booking form
const bookingForm = $("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const status = $("formStatus");
    const submitButton = bookingForm.querySelector('button[type="submit"]');

    const customerName = $("customerName").value.trim();
    const phone = $("customerPhone").value.trim();
    const service = $("service").value;
    const preferredDate = $("preferredDate").value || null;
    const message = $("customerMessage").value.trim();

    if (customerName.length < 2 || phone.length < 7 ||
        service.length < 2 || message.length < 2) {
      status.textContent = "Please fill in all required fields correctly.";
      return;
    }

    status.textContent = "Submitting your booking...";
    submitButton.disabled = true;

    try {
      const { error } = await db.from("rr_bookings").insert({
        customer_name: customerName,
        phone,
        service,
        preferred_date: preferredDate,
        message,
        status: "New"
      });

      if (error) throw error;

     status.textContent = "Booking submitted successfully! Our team will contact you soon.";

      bookingForm.reset();
    } catch (error) {
      console.error("Booking error:", error.message);
      status.textContent =
        "Booking could not be submitted. Please try the WhatsApp enquiry instead.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

configureWhatsAppLinks();
loadPublicGallery();


async function loadPublicAds() {
  const slider = document.getElementById("adsSlider");
  const track = document.getElementById("adsTrack");
  const dots = document.getElementById("adsDots");

  if (!slider || !track || !dots) {
    console.error("Advertisement slider HTML missing in index.html");
    return;
  }

  try {
    const { data, error } = await db
      .from("rr_ads")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    track.replaceChildren();
    dots.replaceChildren();

    if (!data || data.length === 0) {
      slider.style.display = "none";
      console.log("No published advertisements found.");
      return;
    }

    slider.style.display = "";

    data.forEach((ad, index) => {
      const slide = document.createElement("div");
      slide.className = "ads-slide" + (index === 0 ? " active" : "");

      const img = document.createElement("img");
      img.src = ad.image_url;
      img.alt = ad.title || "Advertisement";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      if (ad.target_url) {
        try {
          const url = new URL(ad.target_url);
          if (url.protocol === "https:" || url.protocol === "http:") {
            const link = document.createElement("a");
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.appendChild(img);
            slide.appendChild(link);
          } else {
            slide.appendChild(img);
          }
        } catch {
          slide.appendChild(img);
        }
      } else {
        slide.appendChild(img);
      }

      track.appendChild(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "ads-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Advertisement ${index + 1}`);
      dot.addEventListener("click", () => showAd(index));
      dots.appendChild(dot);
    });

    let current = 0;

    function showAd(index) {
      const slides = track.querySelectorAll(".ads-slide");
      const allDots = dots.querySelectorAll(".ads-dot");

      current = (index + slides.length) % slides.length;

      slides.forEach((slide, i) =>
        slide.classList.toggle("active", i === current)
      );

      allDots.forEach((dot, i) =>
        dot.classList.toggle("active", i === current)
      );
    }

    document.getElementById("adsPrev")?.addEventListener("click", () => {
      showAd(current - 1);
    });

    document.getElementById("adsNext")?.addEventListener("click", () => {
      showAd(current + 1);
    });

    if (data.length > 1) {
      setInterval(() => showAd(current + 1), 5000);
    }
  } catch (error) {
    console.error("Public ads loading error:", error);
    slider.style.display = "none";
  }
}

loadPublicAds();


const locationButton = document.getElementById("getCustomerLocation");
const locationStatus = document.getElementById("customerLocationStatus");
const customerDirections = document.getElementById("customerDirections");

locationButton?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent =
      "Your browser does not support location access.";
    return;
  }

  locationStatus.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      locationStatus.textContent =
        `Your location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      customerDirections.href =
        `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=9GPJ%2BPC2%2C%20Ramanthapur%2C%20Amberpet%2C%20Hyderabad%2C%20Telangana%20500013`;

      customerDirections.hidden = false;
    },
    (error) => {
      locationStatus.textContent =
        "Location access was not available. Please allow location permission or use Get Directions.";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

document.getElementById("heroCustomerLocation")?.addEventListener("click", () => {
  const status = document.getElementById("heroLocationStatus");

  if (!navigator.geolocation) {
    status.textContent = "Your browser does not support location access.";
    return;
  }

  status.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      status.textContent = `Your location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=9GPJ%2BPC2%2C%20Ramanthapur%2C%20Amberpet%2C%20Hyderabad%2C%20Telangana%20500013`,
        "_blank",
        "noopener"
      );
    },
    () => {
      status.textContent = "Location permission ivvandi, leda Get Directions click cheyyandi.";
    }
  );
});

/* Customer review submission */
const reviewForm = document.getElementById("reviewForm");

reviewForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const status = document.getElementById("reviewStatus");
  const submitButton = reviewForm.querySelector(
    'button[type="submit"]'
  );

  const customerName =
    document.getElementById("reviewCustomerName")?.value.trim() ||
    document.getElementById("designCustomerName")?.value.trim() ||
    document.getElementById("customerName")?.value.trim();

  const rating = Number(
    document.getElementById("reviewRating")?.value
  );

  const review = document
    .getElementById("reviewMessage")
    ?.value.trim();

  if (!customerName) {
    if (status) status.textContent = "Please enter your name.";
    return;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    if (status) status.textContent = "Please select a rating from 1 to 5.";
    return;
  }

  if (!review) {
    if (status) status.textContent = "Please write your review.";
    return;
  }

  if (submitButton) submitButton.disabled = true;
  if (status) status.textContent = "Submitting your review...";

  try {
    const { error } = await db.from("rr_feedback").insert({
      customer_name: customerName,
      rating: rating,
      review: review,
      status: "Pending"
    });

    if (error) throw error;

    if (status) {
      status.textContent =
        "Thank you! Your review was submitted for approval.";
    }

    reviewForm.reset();
  } catch (error) {
    console.error("Review submission error:", error);

    if (status) {
      status.textContent =
        "Review could not be submitted: " + error.message;
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
