
const db = supabaseClient;
const $ = (id) => document.getElementById(id);

const sliderImageIds = [
  "designImage",
  "designImage2",
  "designImage3",
  "designImage4",
  "designImage5"
];

const designVideo = $("designVideo");
const sliderDots = $("designSliderDots");
const designTitle = $("designTitle");
const designDescription = $("designDescription");
const designPrice = $("designPrice");
const bookingForm = $("pageBookingForm");
const bookingStatus = $("bookingStatus");

let sliderItems = [];
let currentSlide = 0;
let sliderTimer = null;
let touchStartX = 0;
let touchStartY = 0;

// Display an image or video
function showDesignSlide(index) {
  if (!sliderItems.length) return;

  currentSlide = (index + sliderItems.length) % sliderItems.length;

  sliderImageIds.forEach((id) => {
    const img = $(id);
    if (img) {
      img.hidden = true;
      img.classList.remove("zoomed");
    }
  });

  if (designVideo) {
    designVideo.hidden = true;
    designVideo.pause();
  }

  sliderItems.forEach((item, i) => {
    if (item.type === "image") {
      const img = $(item.id);
      if (img) img.hidden = i !== currentSlide;
    } else if (designVideo) {
      designVideo.hidden = i !== currentSlide;

      if (i === currentSlide) {
        designVideo.src = item.url;
        designVideo.load();
      }
    }
  });

  [...sliderDots.children].forEach((thumbnail, i) => {
    const active = i === currentSlide;
    thumbnail.classList.toggle("active", active);
    thumbnail.setAttribute("aria-current", active ? "true" : "false");
  });
}

// Automatic slide rotation
function startDesignSlider() {
  clearInterval(sliderTimer);

  if (sliderItems.length > 1) {
    sliderTimer = setInterval(() => {
      showDesignSlide(currentSlide + 1);
    }, 5000);
  }
}

// Create image thumbnails
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
    img.classList.remove("zoomed");

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

  if (selectedDesign.video_url && designVideo) {
    sliderItems.push({
      type: "video",
      url: selectedDesign.video_url
    });
  }

  sliderDots.replaceChildren();

  sliderItems.forEach((item, index) => {
    const thumbnail = document.createElement("button");
    thumbnail.type = "button";
    thumbnail.className = "design-thumbnail";
    thumbnail.setAttribute("aria-label", `Show slide ${index + 1}`);

    if (item.type === "image") {
      const preview = document.createElement("img");
      preview.src = item.url;
      preview.alt = `Design preview ${index + 1}`;
      preview.loading = "lazy";
      thumbnail.appendChild(preview);
    } else {
      thumbnail.textContent = "▶ Video";
    }

    thumbnail.addEventListener("click", () => {
      showDesignSlide(index);
      startDesignSlider();
    });

    sliderDots.appendChild(thumbnail);
  });

  if (!sliderItems.length) {
    designTitle.textContent = "No design images available";
    return;
  }

  showDesignSlide(0);
  startDesignSlider();
}

// Previous and Next arrows
$("designPrev")?.addEventListener("click", () => {
  showDesignSlide(currentSlide - 1);
  startDesignSlider();
});

$("designNext")?.addEventListener("click", () => {
  showDesignSlide(currentSlide + 1);
  startDesignSlider();
});


/* Click main image to open it full-screen */
const imageViewer = document.createElement("div");

imageViewer.id = "imageViewer";
imageViewer.style.cssText = `
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.94);
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
`;

imageViewer.innerHTML = `
  <button type="button" aria-label="Close image"
    style="position:absolute;top:15px;right:20px;color:white;
    background:transparent;border:0;font-size:38px;cursor:pointer">×</button>
  <img alt="Full-screen design"
    style="max-width:95vw;max-height:90vh;object-fit:contain;
    cursor:zoom-in;transition:transform .2s ease">
`;

document.body.appendChild(imageViewer);

const viewerImage = imageViewer.querySelector("img");
const closeViewerButton = imageViewer.querySelector("button");

function openFullImage(img) {
  viewerImage.src = img.src;
  viewerImage.alt = img.alt || "Design image";
  viewerImage.style.transform = "scale(1)";
  viewerImage.style.cursor = "zoom-in";
  imageViewer.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeFullImage() {
  imageViewer.style.display = "none";
  viewerImage.style.transform = "scale(1)";
  document.body.style.overflow = "";
}

sliderImageIds.forEach((id) => {
  const img = $(id);
  if (!img) return;

  img.style.cursor = "zoom-in";

  img.addEventListener("click", () => {
    if (!img.hidden) openFullImage(img);
  });
});

viewerImage.addEventListener("click", () => {
  const zoomed = viewerImage.style.transform === "scale(1.7)";
  viewerImage.style.transform = zoomed ? "scale(1)" : "scale(1.7)";
  viewerImage.style.cursor = zoomed ? "zoom-in" : "zoom-out";
});

closeViewerButton.addEventListener("click", closeFullImage);

imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) closeFullImage();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFullImage();
});


// Swipe support for mobile devices
const gallery = document.querySelector(".design-images");

if (gallery) {
  gallery.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  gallery.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    // Ignore normal vertical page scrolling
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    showDesignSlide(currentSlide + (deltaX < 0 ? 1 : -1));
    startDesignSlider();
  }, { passive: true });
}

// Pause automatic rotation while the pointer is over the gallery
if (gallery) {
  gallery.addEventListener("mouseenter", () => {
    clearInterval(sliderTimer);
  });

  gallery.addEventListener("mouseleave", startDesignSlider);
}

// Get selected design
let design = null;

try {
  design = JSON.parse(
    sessionStorage.getItem("selectedDesign") || "null"
  );
} catch (error) {
  console.error("Could not read selected design:", error);
}

// Display design details and calculate discount
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
    discountAmount = discountType === "fixed"
      ? Math.min(originalPrice, discountValue)
      : originalPrice * Math.min(discountValue, 100) / 100;
  }

  const finalPrice = hasPrice
    ? Math.round(Math.max(0, originalPrice - discountAmount) * 100) / 100
    : null;

  const savings = hasPrice ? originalPrice - finalPrice : 0;

  const discountPercent = hasPrice && originalPrice > 0
    ? Math.round((savings / originalPrice) * 100)
    : 0;

  if (!hasPrice) {
    designPrice.textContent = "Price on request";
  } else if (savings > 0) {
    const priceBox = $("designPriceBox");
    priceBox.classList.add("special-price-box");

    priceBox.innerHTML = `
      <div class="special-original-price">
        <span>Original Price</span>
        <del>₹${originalPrice.toLocaleString("en-IN")}</del>
        <span class="special-discount-badge">${discountPercent}% OFF</span>
      </div>
      <div class="special-final-price">
        <span>✦ Final Amount</span>
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

// Submit booking to Supabase
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

  const submitButton = bookingForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const { error } = await db
      .from("rr_bookings")
      .insert(booking);

    if (error) {
      console.error("Booking error:", error);
      bookingStatus.textContent = "Booking failed: " + error.message;
      return;
    }

    bookingStatus.textContent =
      "Booking submitted successfully! Thank you for choosing R.R Designers.";

    bookingForm.reset();
  } catch (error) {
    console.error("Unexpected booking error:", error);
    bookingStatus.textContent = "Something went wrong. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

/* Customer review photo preview */
(() => {
  const imageInput = document.getElementById("reviewImages");
  const preview = document.getElementById("reviewImagePreview");
  const imageStatus = document.getElementById("reviewImageStatus");

  if (!imageInput || !preview || !imageStatus) return;

  const MAX_IMAGES = 2;
  const MAX_SIZE = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  imageInput.addEventListener("change", () => {
    preview.replaceChildren();
    imageStatus.textContent = "";

    const files = Array.from(imageInput.files || []);

    if (files.length > MAX_IMAGES) {
      imageInput.value = "";
      imageStatus.textContent = "Maximum 2 photos matrame select cheyyali.";
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        imageInput.value = "";
        preview.replaceChildren();
        imageStatus.textContent = "JPG, PNG, WEBP photos matrame upload cheyyandi.";
        return;
      }

      if (file.size > MAX_SIZE) {
        imageInput.value = "";
        preview.replaceChildren();
        imageStatus.textContent = "Prathi photo size 5 MB lopu undali.";
        return;
      }
    }

    files.forEach((file) => {
      const image = document.createElement("img");
      image.alt = "Selected review photo preview";
      image.title = "Click to view photo";

      const objectUrl = URL.createObjectURL(file);
      image.src = objectUrl;

      image.style.cursor = "pointer";
      image.addEventListener("click", () => {
        const viewer = document.createElement("div");

        Object.assign(viewer.style, {
          position: "fixed",
          inset: "0",
          zIndex: "99999",
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          cursor: "zoom-out"
        });

        const fullImage = document.createElement("img");
        fullImage.src = objectUrl;
        fullImage.alt = image.alt;

        Object.assign(fullImage.style, {
          maxWidth: "95vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "8px"
        });

        viewer.appendChild(fullImage);
        document.body.appendChild(viewer);

        viewer.addEventListener("click", () => viewer.remove());
        document.addEventListener("keydown", function closeViewer(event) {
          if (event.key === "Escape") {
            viewer.remove();
            document.removeEventListener("keydown", closeViewer);
          }
        });
      });

      preview.appendChild(image);
    });

    imageStatus.textContent = files.length
      ? `${files.length} photo(s) selected.`
      : "";
  });
})();
  
/* Clickable 5-star rating */
(() => {
  const stars = document.querySelectorAll(".rating-star");
  const ratingInput = document.getElementById("reviewRating");
  const ratingStatus = document.getElementById("ratingStatus");

  if (!stars.length || !ratingInput || !ratingStatus) return;

  const colors = [
    "",
    "#ff3030",
    "#ff8c00",
    "#ffd700",
    "#90ee90",
    "#008000"
  ];

  stars.forEach((button) => {
    button.addEventListener("click", () => {
      const rating = Number(button.dataset.rating);
      ratingInput.value = String(rating);

      stars.forEach((star) => {
        const number = Number(star.dataset.rating);
        const active = number <= rating;

        star.classList.toggle("active", active);
        star.style.color = active ? colors[rating] : "#cfc8d9";
      });

      ratingStatus.textContent = `${rating} out of 5 stars selected`;
    });
  });
})();
      
/* Submit customer review to Supabase */
(() => {
  const reviewForm = document.getElementById("reviewForm");
  const reviewStatus = document.getElementById("reviewStatus");
  const ratingInput = document.getElementById("reviewRating");
  const reviewMessage = document.getElementById("reviewMessage");
  const imageInput = document.getElementById("reviewImages");
  const imageStatus = document.getElementById("reviewImageStatus");

  if (!reviewForm || !reviewStatus) return;

  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const rating = Number(ratingInput?.value || 0);
    const review = reviewMessage?.value.trim() || "";

    // Customer name is required by the database.
    // Ask for it without changing the existing page layout.
    const customerName =
      document.getElementById("reviewCustomerName")?.value.trim() || "";

    if (!customerName || !customerName.trim()) {
      reviewStatus.textContent = "Review submit cheyyadaniki mee name enter cheyyandi.";
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      reviewStatus.textContent = "Please select a rating from 1 to 5 stars.";
      return;
    }

    if (!review) {
      reviewStatus.textContent = "Please write your review.";
      return;
    }

    if (!db) {
      reviewStatus.textContent = "Database connection ledu. supabase-config.js check cheyyandi.";
      return;
    }

    const button = reviewForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    reviewStatus.textContent = "Submitting your review...";

    try {
      let imageUrl = null;
      const files = Array.from(imageInput?.files || []);

      if (files.length > 2) {
        throw new Error("Maximum 2 photos matrame upload cheyyandi.");
      }

      // Upload photos to the existing rr_gallery bucket, if selected.
      if (files.length) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const uploadedUrls = [];

        for (const file of files) {
          if (!allowedTypes.includes(file.type)) {
            throw new Error("JPG, PNG, WEBP photos matrame upload cheyyandi.");
          }

          if (file.size > 5 * 1024 * 1024) {
            throw new Error("Prathi photo 5 MB lopu undali.");
          }

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;

          const { error: uploadError } = await db.storage
            .from("rr_gallery")
            .upload(filePath, file, { upsert: false });

          if (uploadError) throw uploadError;

          const { data } = db.storage
            .from("rr_gallery")
            .getPublicUrl(filePath);

          uploadedUrls.push(data.publicUrl);
        }

        imageUrl = uploadedUrls.join("\n");
      }

      const { error } = await db
        .from("rr_feedback")
        .insert({
          customer_name: customerName.trim(),
          rating,
          review,
          image_url: imageUrl,
          status: "Pending"
        });

      if (error) throw error;

      reviewStatus.textContent =
        "Thank you! Your review was submitted and is awaiting approval.";

      reviewForm.reset();

      if (ratingInput) ratingInput.value = "";
      document.querySelectorAll(".rating-star").forEach((star) => {
        star.classList.remove("active");
        star.style.color = "#cfc8d9";
      });

      const ratingStatus = document.getElementById("ratingStatus");
      if (ratingStatus) ratingStatus.textContent = "Select your rating";

      const preview = document.getElementById("reviewImagePreview");
      if (preview) preview.replaceChildren();
      if (imageStatus) imageStatus.textContent = "";

    } catch (error) {
      console.error("Review submission error:", error);
      reviewStatus.textContent = "Review save failed: " + (error.message || "Please try again.");
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
      

/* Load and display approved customer reviews */
async function loadApprovedReviews() {
  const reviewList = document.getElementById("reviewList");

  if (!reviewList || !db) return;

  reviewList.textContent = "Loading reviews...";

  const { data, error } = await db
    .from("rr_feedback")
    .select("*")
    .eq("status", "Approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Review loading error:", error);
    reviewList.textContent = "Reviews could not be loaded.";
    return;
  }

  reviewList.replaceChildren();

  if (!data || data.length === 0) {
    reviewList.textContent = "No approved reviews yet.";
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("article");
    card.className = "customer-review-card";

    const name = document.createElement("h3");
    name.textContent = item.customer_name || "Customer";
    card.appendChild(name);

    const stars = document.createElement("p");
    stars.className = "customer-review-stars";
    stars.textContent = "★".repeat(
      Math.max(0, Math.min(5, Number(item.rating) || 0))
    );
    card.appendChild(stars);

    const reviewBody = document.createElement("div");
    reviewBody.className = "review-body";

    const reviewContent = document.createElement("div");
    reviewContent.className = "review-content";

    const message = document.createElement("p");
    message.textContent = item.review || "";
    reviewContent.appendChild(message);

    const rating = Number(item.rating);

    const politeMessages = {
      1: "Thank you for your feedback. We will work to improve our service.",
      2: "Thank you for your feedback. We will try to serve you better.",
      3: "Thank you for your feedback! We appreciate your suggestions.",
      4: "Thank you for your kind feedback! We are happy you enjoyed our service.",
      5: "Thank you so much for your wonderful review! We are delighted you loved our service."
    };

    const thankYou = document.createElement("p");
    thankYou.className = "review-thank-you";
    thankYou.textContent =
      politeMessages[rating] || "Thank you for sharing your feedback.";

    reviewContent.appendChild(thankYou);

    const reviewImages = document.createElement("div");
    reviewImages.className = "review-content-images";

    if (item.image_url) {
      item.image_url.split("\n").filter(Boolean).forEach((url) => {
        const img = document.createElement("img");
        img.src = url.trim();
        img.alt = "Customer review photo";
        img.loading = "lazy";
        img.className = "customer-review-image";
        reviewImages.appendChild(img);
      });
    }

    if (reviewImages.children.length > 0) {
      reviewBody.classList.add("has-review-images");
      reviewBody.appendChild(reviewImages);
    }

    reviewBody.appendChild(reviewContent);
    card.appendChild(reviewBody);
    reviewList.appendChild(card);
  });
}

loadApprovedReviews();