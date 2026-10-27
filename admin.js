
const db = supabaseClient;
const $ = (id) => document.getElementById(id);

let currentUser = null;
let editingDesign = null;
let savingDesign = false;
let allBookings = [];
    function openBookingWhatsApp(booking, status) {
  let phone = String(booking.phone || "").replace(/\D/g, "");

  // భారతీయ 10 అంకెల నంబర్‌కు country code జోడించండి
  if (phone.length === 10) {
    phone = "91" + phone;
  }

  if (!phone || phone.length < 10) {
    showStatus("bookingStatus", "Customer phone number is invalid.");
    return;
  }

  const message =
    `Hello ${booking.customer_name || "Customer"},\n\n` +
    `Thank you for choosing R.R Designers.\n\n` +
    `Your booking status has been updated:\n\n` +
    `*STATUS: ${String(status).toUpperCase()}*\n\n` +
    `Service: ${booking.service || "Embroidery / Tailoring"}\n\n` +
    `Thank you,\nR.R Designers`;

  const whatsappURL =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, "_blank");
}
const BUCKET = "rr_gallery";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function showStatus(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeButton(text, className, action) {
  const button = createElement("button", className, text);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

async function verifyOwner() {
  const { data: { user }, error } = await db.auth.getUser();

  if (error || !user) {
    currentUser = null;
    $("loginPanel").classList.remove("hidden");
    $("adminDashboard").classList.add("hidden");
    return false;
  }

  const { data: isOwner, error: adminError } =
    await db.rpc("is_rr_admin");

  if (adminError || isOwner !== true) {
    await db.auth.signOut();
    currentUser = null;
    $("loginPanel").classList.remove("hidden");
    $("adminDashboard").classList.add("hidden");
    showStatus(
      "loginStatus",
      "This account is not authorised as the shop owner."
    );
    return false;
  }

  currentUser = user;
  $("loginPanel").classList.add("hidden");
  $("adminDashboard").classList.remove("hidden");
  return true;
}

function validateImage(file) {
  if (!file) return null;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be smaller than 5 MB.";
  }

  return null;
}

function publicImageUrl(path) {
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}


function resetDesignForm() {
  editingDesign = null;
  $("designForm").reset();
  $("designId").value = "";
  $("designPublished").checked = true;
      if ($("designDiscountType")) {
  $("designDiscountType").value = "percent";
}

if ($("designDiscountValue")) {
  $("designDiscountValue").value = 0;
}

if ($("designIsSpecial")) {
  $("designIsSpecial").checked = false;
}

if ($("designSpecialLine")) {
  $("designSpecialLine").value = "";
}
      [
        "designImage",
        "designImage2",
        "designImage3",
        "designImage4",
        "designImage5"
      ].forEach((id) => 
        {
          if ($(id)) $(id).value = "";
        });

  $("currentImageNote").textContent = "";
  $("saveDesignButton").textContent = "Save Design";
  $("cancelEditButton").classList.add("hidden");
}


function makeStoragePath(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  return `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
}

async function loadDesigns() {
  if (!(await verifyOwner())) return;

  const list = $("designList");
  list.replaceChildren(createElement("p", "", "Loading designs..."));

  const { data, error } = await db
    .from("rr_designs")
    .select("*")
    .order("created_at", { ascending: false });

  list.replaceChildren();

  if (error) {
    list.appendChild(createElement("p", "", "Could not load designs."));
    console.error("Design loading error:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    list.appendChild(createElement("p", "", "No designs uploaded yet."));
    return;
  }

  data.forEach((design) => {
    const card = createElement("article", "admin-item");

    const image = createElement("img");
    image.src = design.image_url;
    image.alt = design.title;
    image.loading = "lazy";

    const details = createElement("div");
    details.appendChild(createElement("h3", "", design.title));
    details.appendChild(createElement("p", "", `Category: ${design.category}`));
    details.appendChild(
      createElement("p", "", design.published ? "Published" : "Hidden")
    );
    // Publish checkbox for each design
const publishLabel = createElement("label");
const publishCheckbox = document.createElement("input");

publishCheckbox.type = "checkbox";
publishCheckbox.checked = design.published === true;

publishLabel.append(
  publishCheckbox,
  document.createTextNode(" Publish this design")
);

publishCheckbox.addEventListener("change", async () => {
  publishCheckbox.disabled = true;

  const { error } = await db
    .from("rr_designs")
    .update({ published: publishCheckbox.checked })
    .eq("id", design.id);

  if (error) {
    publishCheckbox.checked = !publishCheckbox.checked;
    showStatus("designStatus", "Could not update Publish setting.");
    console.error(error);
  } else {
    design.published = publishCheckbox.checked;
    showStatus("designStatus", "Publish setting updated.");
  }

  publishCheckbox.disabled = false;
});

details.appendChild(publishLabel);

        // Show on Main page checkbox
const mainLabel = createElement("label");
const mainCheckbox = document.createElement("input");
mainCheckbox.type = "checkbox";
mainCheckbox.checked = design.show_on_main !== false;

mainLabel.append(
  mainCheckbox,
  document.createTextNode(" Show on Main page")
);

mainCheckbox.addEventListener("change", async () => {
  mainCheckbox.disabled = true;

  const { error } = await db
    .from("rr_designs")
    .update({ show_on_main: mainCheckbox.checked })
    .eq("id", design.id);

  if (error) {
    mainCheckbox.checked = !mainCheckbox.checked;
    showStatus("designStatus", "Could not update Main page setting.");
    console.error(error);
  } else {
    design.show_on_main = mainCheckbox.checked;
    showStatus("designStatus", "Main page setting updated.");
  }

  mainCheckbox.disabled = false;
});

details.appendChild(mainLabel);

    const actions = createElement("div", "admin-actions");

    actions.appendChild(
      makeButton("Edit", "button button-small", () => editDesign(design))
    );

    actions.appendChild(
      makeButton("Delete", "button button-small danger-button", () =>
        deleteDesign(design)
      )
    );

    details.appendChild(actions);
    card.append(image, details);
    list.appendChild(card);
  });
}


function editDesign(design) {
  editingDesign = design;

  $("designId").value = design.id;
  $("designTitle").value = design.title || "";
  $("designCategory").value = design.category || "";
  $("designDescription").value = design.description || "";
  $("designPrice").value = design.price ?? "";
  $("designPublished").checked = design.published;
      if ($("designDiscountType")) {
  $("designDiscountType").value =
    design.discount_type || "percent";
}

if ($("designDiscountValue")) {
  $("designDiscountValue").value =
    design.discount_value ?? 0;
}

if ($("designIsSpecial")) {
  $("designIsSpecial").checked =
    design.is_special === true;
}

if ($("designSpecialLine")) {
  $("designSpecialLine").value =
    design.special_line || "";
}
  [
  "designImage",
  "designImage2",
  "designImage3",
  "designImage4",
  "designImage5"
].forEach((id) => {
  if ($(id)) $(id).value = "";
});

const imageCount = [
  design.image_url,
  design.image_url_2,
  design.image_url_3,
  design.image_url_4,
  design.image_url_5
].filter(Boolean).length;

  $("currentImageNote").textContent =
    `${imageCount} existing image(s) saved. Choose only the images you want to replace.`;

  $("saveDesignButton").textContent = "Update Design";
  $("cancelEditButton").classList.remove("hidden");

  $("designForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


async function deleteDesign(design) {
  if (!(await verifyOwner())) return;

  const confirmed = window.confirm(
    `Delete "${design.title}" from the gallery?`
  );
  if (!confirmed) return;

  showStatus("designStatus", "Deleting design...");

  const { error } = await db
    .from("rr_designs")
    .delete()
    .eq("id", design.id);

  if (error) {
    showStatus("designStatus", "Could not delete this design.");
    console.error("Delete error:", error.message);
    return;
  }

 const imagePaths = [
  design.storage_path,
  design.storage_path_2,
  design.storage_path_3,
  design.storage_path_4,
  design.storage_path_5,
  design.video_storage_path
  ].filter(Boolean);

  const { error: storageError } = imagePaths.length
  ? await db.storage.from(BUCKET).remove(imagePaths)
  : { error: null };

  if (storageError) {
    console.error("Storage cleanup error:", storageError.message);
    showStatus(
      "designStatus",
      "Design deleted from the gallery. The old storage file may need cleanup."
    );
  } else {
    showStatus("designStatus", "Design deleted successfully.");
  }

  if (editingDesign && editingDesign.id === design.id) {
    resetDesignForm();
  }

  await loadDesigns();
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  showStatus("loginStatus", "Checking your login...");
  const loginButton = $("loginForm").querySelector('button[type="submit"]');
  loginButton.disabled = true;

  try {
    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!(await verifyOwner())) return;

    $("adminPassword").value = "";
    showStatus("loginStatus", "");
    await loadDesigns();
    await loadBookings();
    await loadAds();
  } catch (error) {
    showStatus("loginStatus", "Login failed. Check your email and password.");
    console.error("Login error:", error.message);
  } finally {
    loginButton.disabled = false;
  }
});

$("forgotPasswordLink").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = $("adminEmail").value.trim();

  if (!email) {
    showStatus("loginStatus", "Please enter your owner email first.");
    $("adminEmail").focus();
    return;
  }

  const link = $("forgotPasswordLink");
  link.style.pointerEvents = "none";
  showStatus("loginStatus", "Sending password reset email...");

  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    if (error) throw error;

    showStatus(
      "loginStatus",
      "If this email is registered, a password reset link will be sent. Check your inbox and spam folder."
    );
  } catch (error) {
    showStatus("loginStatus", "Could not send reset email. Please try again.");
    console.error("Password reset error:", error.message);
  } finally {
    link.style.pointerEvents = "";
  }
});

$("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();
  currentUser = null;
  $("adminDashboard").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
  showStatus("loginStatus", "You have been logged out.");
});


$("designForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (savingDesign) return;
  if (!(await verifyOwner())) return;

  const title = $("designTitle").value.trim();
  const category = $("designCategory").value.trim();
  const description = $("designDescription").value.trim();
  const priceText = $("designPrice").value.trim();
  const published = $("designPublished").checked;
  
const discountType = $("designDiscountType")?.value || "percent";
const discountValue = Number($("designDiscountValue")?.value || 0);
const isSpecial = $("designIsSpecial")?.checked || false;
const specialLine = $("designSpecialLine")?.value.trim() || "";

if (
  !Number.isFinite(discountValue) ||
  discountValue < 0 ||
  (discountType === "percent" && discountValue > 100)
) {
  showStatus(
    "designStatus",
    "Discount must be 0–100% or a fixed amount of ₹0 or higher."
  );
  return;
}

if (discountType !== "percent" && discountType !== "fixed") {
  showStatus("designStatus", "Please select a valid discount type.");
  return;
}

if (priceText === "" && discountValue > 0) {
  showStatus("designStatus", "Enter the original price before adding a discount.");
  return;
}

  const imageIds = [
  "designImage",
  "designImage2",
  "designImage3",
  "designImage4",
  "designImage5"
 ];

 const files = imageIds.map((id) => $(id).files[0] || null);
    const videoFile = $("designVideo")?.files[0] || null;
    if (videoFile) {
  const allowedVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/3gpp",
    "video/3gpp2",
    "video/x-ms-wmv",
    "video/mpeg",
    "video/ogg",
    "image/gif"
  ];

  const fileExtension = videoFile.name
    .split(".")
    .pop()
    .toLowerCase();

  const allowedExtensions = [
    "mp4", "webm", "mov", "avi", "mkv",
    "3gp", "3g2", "wmv", "mpeg", "mpg",
    "ogv", "gif"
  ];

  if (
    !allowedVideoTypes.includes(videoFile.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    showStatus(
      "designStatus",
      "Please choose a supported video or GIF file."
    );
    return;
  }

  if (videoFile.size > 50 * 1024 * 1024) {
    showStatus(
      "designStatus",
      "Video or GIF must be 50 MB or smaller."
    );
    return;
  }
}

  let price = null;

  if (priceText !== "") {
    price = Number(priceText);

    if (!Number.isFinite(price) || price < 0) {
      showStatus("designStatus", "Enter a valid price of ₹0 or higher.");
      return;
    }
  }

  for (let i = 0; i < files.length; i++) {
    if (!files[i]) continue;

    const imageError = validateImage(files[i]);

    if (imageError) {
      showStatus("designStatus", `Photo ${i + 1}: ${imageError}`);
      return;
    }
  }

  if (!editingDesign && !files[0]) {
  showStatus("designStatus", "Please choose the first design photo.");
  return;
 }

  savingDesign = true;
  $("saveDesignButton").disabled = true;
  showStatus("designStatus", "Uploading design images...");

  const uploadedPaths = [];

  try {
const imageUrls = [
  editingMenDesign?.image_url || "",
  editingMenDesign?.image_url_2 || "",
  editingMenDesign?.image_url_3 || "",
  editingMenDesign?.image_url_4 || "",
  editingMenDesign?.image_url_5 || ""
];

const storagePaths = [
  editingMenDesign?.storage_path || "",
  editingMenDesign?.storage_path_2 || "",
  editingMenDesign?.storage_path_3 || "",
  editingMenDesign?.storage_path_4 || "",
  editingMenDesign?.storage_path_5 || ""
];

let videoUrl = editingDesign?.video_url || null;
let videoStoragePath =
  editingDesign?.video_storage_path || null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file) continue;

      const path = makeStoragePath(file);

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      uploadedPaths.push(path);

      imageUrls[i] = publicImageUrl(path);
      storagePaths[i] = path;
    }
        // Upload optional video or GIF
if (videoFile) {
  const extension =
    videoFile.name.split(".").pop().toLowerCase();

  const videoPath =
    `${currentUser.id}/design-videos/${crypto.randomUUID()}.${extension}`;

  const { error: videoUploadError } = await db.storage
    .from(BUCKET)
    .upload(videoPath, videoFile, {
      contentType: videoFile.type || "application/octet-stream",
      upsert: false
    });

  if (videoUploadError) throw videoUploadError;

  uploadedPaths.push(videoPath);

  videoUrl = publicImageUrl(videoPath);
  videoStoragePath = videoPath;
}
   const record = {
  title,
  category,
  description,
  price,

  image_url: imageUrls[0],
  image_url_2: imageUrls[1] || null,
  image_url_3: imageUrls[2] || null,
  image_url_4: imageUrls[3] || null,
  image_url_5: imageUrls[4] || null,

  storage_path: storagePaths[0] || null,
  storage_path_2: storagePaths[1] || null,
  storage_path_3: storagePaths[2] || null,
  storage_path_4: storagePaths[3] || null,
  storage_path_5: storagePaths[4] || null,

  video_url: videoUrl,
  video_storage_path: videoStoragePath,

  published,
  show_on_main: true,
  discount_type: $("designDiscountType")?.value || "percent",
  discount_value: Number($("designDiscountValue")?.value || 0),
  is_special: $("designIsSpecial")?.checked || false,
  special_line: $("designSpecialLine")?.value.trim() || ""
};
    showStatus("designStatus", "Saving design details...");

    if (editingDesign) {
      const { error } = await db
        .from("rr_designs")
        .update(record)
        .eq("id", editingDesign.id);

      if (error) throw error;
    } else {
      const { error } = await db
        .from("rr_designs")
        .insert(record);

      if (error) throw error;
    }

    // Remove replaced images only after the database save succeeds.
    const oldPaths = [];

    if (editingDesign) {
     const oldStoragePaths = [
      editingDesign.storage_path,
      editingDesign.storage_path_2,
      editingDesign.storage_path_3,
      editingDesign.storage_path_4,
      editingDesign.storage_path_5
      ];

      for (let i = 0; i < files.length; i++) {
        if (files[i] && oldStoragePaths[i]) {
          oldPaths.push(oldStoragePaths[i]);
        }
      }
       if (videoFile && editingDesign.video_storage_path) {
        oldPaths.push(editingDesign.video_storage_path);
      }
    }

    if (oldPaths.length) {
      const { error: cleanupError } = await db.storage
        .from(BUCKET)
        .remove(oldPaths);

      if (cleanupError) {
        console.error("Old image cleanup error:", cleanupError.message);
      }
    }

    resetDesignForm();
    showStatus("designStatus", "Design saved successfully!");
    await loadDesigns();

  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await db.storage
        .from(BUCKET)
        .remove(uploadedPaths);

      if (cleanupError) {
        console.error("Uploaded image cleanup error:", cleanupError);
      }
    }

    console.error("Save design error:", error);

    showStatus(
      "designStatus",
      `Save failed: ${error.message || "Unknown error"}`
    );

  } finally {
    savingDesign = false;
    $("saveDesignButton").disabled = false;
  }
});

$("cancelEditButton").addEventListener("click", resetDesignForm);

async function loadBookings() {
  if (!(await verifyOwner())) return;

  const list = $("bookingList");
  list.replaceChildren(createElement("p", "", "Loading bookings..."));

  const { data, error } = await db
    .from("rr_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  list.replaceChildren();

  if (error) {
    list.appendChild(
      createElement("p", "", "Could not load bookings.")
    );
    console.error("Booking loading error:", error.message);
    return;
  }

    allBookings = data || [];

  if (allBookings.length === 0) {
    list.appendChild(
      createElement("p", "", "No customer bookings yet.")
    );
    return;
  }

  const wrapper = createElement("div", "booking-table-wrapper");
  const table = createElement("table", "booking-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

 [
  "Customer",
  "Phone",
  "Service",
  "Bargaining Request",
  "Preferred Date",
  "Message",
  "Received",
  "Status",
  "Actions"
 ]
 .forEach((heading) => {
    headerRow.appendChild(createElement("th", "", heading));
  });

  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");

  data.forEach((booking) => {
    const row = document.createElement("tr");

    function addCell(value) {
      const cell = createElement("td", "", value ?? "—");
      row.appendChild(cell);
      return cell;
    }

    addCell(booking.customer_name);
addCell(booking.phone);
addCell(booking.service);

addCell(
  booking.bargaining_amount !== null &&
  booking.bargaining_amount !== undefined
    ? `₹${Number(booking.bargaining_amount).toLocaleString("en-IN")}`
    : "₹0"
);

addCell(booking.preferred_date || "Not specified");
    addCell(booking.message || "—");
    addCell(
      booking.created_at
        ? new Date(booking.created_at).toLocaleString()
        : "—"
    );

    const statusCell = document.createElement("td");
    const statusSelect = createElement("select", "booking-status-select");

    ["New", "Contacted", "Completed", "Cancelled"].forEach((status) => {
      const option = createElement("option", "", status);
      option.value = status;
      statusSelect.appendChild(option);
    });

    statusSelect.value = booking.status || "New";
    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    const actionsCell = createElement("td", "booking-actions");
    const updateButton = makeButton(
      "Update",
      "button button-small",
      async () => {
        if (!(await verifyOwner())) return;

        updateButton.disabled = true;

        const { error: updateError } = await db
          .from("rr_bookings")
          .update({ status: statusSelect.value })
          .eq("id", booking.id);

        updateButton.disabled = false;

        if (updateError) {
          showStatus("bookingStatus", "Could not update booking status.");
          console.error("Booking update error:", updateError.message);
        } else {
          showStatus("bookingStatus", "Booking status updated.");
          openBookingWhatsApp(booking, statusSelect.value);
        }
      }
    );

    const deleteButton = makeButton(
      "Delete",
      "button button-small danger-button",
      async () => {
        if (!(await verifyOwner())) return;

        if (!window.confirm(
          `Delete booking for "${booking.customer_name}"?`
        )) return;

        deleteButton.disabled = true;

        const { error: deleteError } = await db
          .from("rr_bookings")
          .delete()
          .eq("id", booking.id);

        if (deleteError) {
          showStatus(
            "bookingStatus",
            "Could not delete booking: " + deleteError.message
          );
          console.error("Booking delete error:", deleteError);
          deleteButton.disabled = false;
          return;
        }

        showStatus("bookingStatus", "Booking deleted successfully.");
        await loadBookings();
      }
    );

    actionsCell.append(updateButton, deleteButton);
    row.appendChild(actionsCell);
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(table);
  list.appendChild(wrapper);
}
function filterBookings() {
  const searchInput = $("bookingSearch");
  const statusFilter = $("bookingStatusFilter");

  if (!searchInput || !statusFilter) return;

  const searchText = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredBookings = allBookings.filter((booking) => {
    const matchesSearch = [
      booking.customer_name,
      booking.phone,
      booking.service
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );

    const matchesStatus =
      selectedStatus === "All" ||
      (booking.status || "New") === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderBookings(filteredBookings);
}

function renderBookings(bookings) {
  const list = $("bookingList");
  list.replaceChildren();

  if (bookings.length === 0) {
    list.appendChild(
      createElement("p", "", "No bookings match your search or filter.")
    );
    return;
  }

  const wrapper = createElement("div", "booking-table-wrapper");
  const table = createElement("table", "booking-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

[
  "Customer",
  "Phone",
  "Service",
  "Bargaining Request",
  "Preferred Date",
  "Message",
  "Received",
  "Status",
  "Actions"
]
   .forEach((heading) => {
    headerRow.appendChild(createElement("th", "", heading));
  });

  thead.appendChild(headerRow);
  const tbody = document.createElement("tbody");

  bookings.forEach((booking) => {
    const row = document.createElement("tr");

    function addCell(value) {
      const cell = createElement("td", "", value ?? "—");
      row.appendChild(cell);
      return cell;
    }

    addCell(booking.customer_name);
    addCell(booking.phone);
    addCell(booking.service);
    addCell(booking.preferred_date || "Not specified");
    addCell(booking.message || "—");
    addCell(
      booking.created_at
        ? new Date(booking.created_at).toLocaleString()
        : "—"
    );

    const statusCell = document.createElement("td");
    const statusSelect = createElement("select", "booking-status-select");

    ["New", "Contacted", "Completed", "Cancelled"].forEach((status) => {
      const option = createElement("option", "", status);
      option.value = status;
      statusSelect.appendChild(option);
    });

    statusSelect.value = booking.status || "New";
    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    const actionsCell = createElement("td", "booking-actions");

    const updateButton = makeButton(
      "Update",
      "button button-small",
      async () => {
        if (!(await verifyOwner())) return;

        updateButton.disabled = true;

        const { error } = await db
          .from("rr_bookings")
          .update({ status: statusSelect.value })
          .eq("id", booking.id);

        updateButton.disabled = false;

        if (error) {
          showStatus("bookingStatus", "Could not update booking status.");
          console.error("Booking update error:", error.message);
        } else {
          booking.status = statusSelect.value;
          showStatus("bookingStatus", "Booking status updated.");
          openBookingWhatsApp(booking, statusSelect.value);
          filterBookings();
        }
      }
    );

    const deleteButton = makeButton(
      "Delete",
      "button button-small danger-button",
      async () => {
        if (!(await verifyOwner())) return;

        if (!window.confirm(
          `Delete booking for "${booking.customer_name}"?`
        )) return;

        deleteButton.disabled = true;

        const { error } = await db
          .from("rr_bookings")
          .delete()
          .eq("id", booking.id);

        if (error) {
          showStatus(
            "bookingStatus",
            "Could not delete booking: " + error.message
          );
          console.error("Booking delete error:", error);
          deleteButton.disabled = false;
          return;
        }

        showStatus("bookingStatus", "Booking deleted successfully.");
        await loadBookings();
      }
    );

    actionsCell.append(updateButton, deleteButton);
    row.appendChild(actionsCell);
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(table);
  list.appendChild(wrapper);
}

$("bookingSearch").addEventListener("input", filterBookings);
$("bookingStatusFilter").addEventListener("change", filterBookings);

$("refreshBookings").addEventListener("click", loadBookings);

const bookingStatusMessage = createElement("p", "admin-message");
bookingStatusMessage.id = "bookingStatus";
$("bookingList").before(bookingStatusMessage);

async function startAdmin() {
  if (await verifyOwner()) {
    await loadDesigns();
    await loadBookings();
    await loadAds();
  }
}

let savingAd = false;

function validateAdImage(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (!file) return "Please choose an advertisement image.";
  if (!allowedTypes.includes(file.type)) {
    return "Choose a JPG, PNG, WebP or GIF image.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Image size must be 5 MB or less.";
  }

  return null;
}

async function loadAds() {
  if (!(await verifyOwner())) return;

  const list = $("adList");
  if (!list) return;

  list.replaceChildren(createElement("p", "", "Loading advertisements..."));

  const { data, error } = await db
    .from("rr_ads")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  list.replaceChildren();

  if (error) {
    list.appendChild(
      createElement("p", "", "Could not load advertisements: " + error.message)
    );
    console.error("Load ads error:", error);
    return;
  }

  if (!data || data.length === 0) {
    list.appendChild(createElement("p", "", "No advertisements uploaded yet."));
    return;
  }

  data.forEach((ad) => {
    const card = createElement("article", "admin-item");
    const image = createElement("img");
    image.src = ad.image_url;
    image.alt = ad.title;
    image.loading = "lazy";

    const details = createElement("div");
    details.appendChild(createElement("h3", "", ad.title));
    details.appendChild(
      createElement("p", "", `Status: ${ad.published ? "Published" : "Hidden"}`)
    );
    details.appendChild(
      createElement("p", "", `Display order: ${ad.display_order}`)
    );

    const actions = createElement("div", "admin-actions");

    actions.appendChild(makeButton(
      ad.published ? "Unpublish" : "Publish",
      "button button-small",
      async () => {
        if (!(await verifyOwner())) return;

        const { error: updateError } = await db
          .from("rr_ads")
          .update({ published: !ad.published })
          .eq("id", ad.id);

        if (updateError) {
          showStatus("adStatus", "Could not change status: " + updateError.message);
          return;
        }

        showStatus("adStatus", "Advertisement status updated.");
        await loadAds();
      }
    ));

    actions.appendChild(makeButton(
      "Delete",
      "button button-small danger-button",
      async () => {
        if (!(await verifyOwner())) return;
        if (!window.confirm(`Delete "${ad.title}"?`)) return;

        const { error: deleteError } = await db
          .from("rr_ads")
          .delete()
          .eq("id", ad.id);

        if (deleteError) {
          showStatus("adStatus", "Delete failed: " + deleteError.message);
          return;
        }

        if (ad.storage_path) {
          const { error: storageError } = await db.storage
            .from(BUCKET)
            .remove([ad.storage_path]);

          if (storageError) {
            console.error("Ad storage cleanup error:", storageError);
          }
        }

        showStatus("adStatus", "Advertisement deleted.");
        await loadAds();
      }
    ));

    details.appendChild(actions);
    card.append(image, details);
    list.appendChild(card);
  });
}

$("adForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (savingAd) return;
  if (!(await verifyOwner())) return;

  const title = $("adTitle").value.trim();
  const file = $("adImage").files[0];
  const targetUrl = $("adTargetUrl").value.trim();
  const displayOrder = Number($("adOrder").value);
  const published = $("adPublished").checked;

  if (!title) {
    showStatus("adStatus", "Enter an advertisement title.");
    return;
  }

  const imageError = validateAdImage(file);
  if (imageError) {
    showStatus("adStatus", imageError);
    return;
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    showStatus("adStatus", "Display order must be a whole number, 0 or higher.");
    return;
  }

  if (targetUrl) {
    try {
      const parsedUrl = new URL(targetUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      showStatus("adStatus", "Enter a valid link starting with https:// or http://");
      return;
    }
  }

  savingAd = true;
  $("saveAdButton").disabled = true;
  showStatus("adStatus", "Uploading image...");

  let uploadedPath = null;

  try {
    const extension = ({
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    })[file.type];

    const storagePath =
      `${currentUser.id}/ads/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    uploadedPath = storagePath;
    const imageUrl = publicImageUrl(storagePath);

    showStatus("adStatus", "Saving advertisement details...");

    const { error: insertError } = await db
      .from("rr_ads")
      .insert({
        title,
        image_url: imageUrl,
        storage_path: storagePath,
        target_url: targetUrl || null,
        published,
        display_order: displayOrder
      });

    if (insertError) throw insertError;

    $("adForm").reset();
    $("adOrder").value = "0";
    $("adPublished").checked = true;

    showStatus("adStatus", "Advertisement uploaded successfully!");
    await loadAds();
  } catch (error) {
    if (uploadedPath) {
      const { error: cleanupError } = await db.storage
        .from(BUCKET)
        .remove([uploadedPath]);

      if (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }

    console.error("Advertisement upload error:", error);
    showStatus("adStatus", "Upload failed: " + (error.message || "Unknown error"));
  } finally {
    savingAd = false;
    $("saveAdButton").disabled = false;
  }
});

startAdmin();

/* Men's Design Gallery Manager */
let savingMenDesign = false;
let editingMenDesign = null;

function resetMenDesignForm() {
  editingMenDesign = null;

  $("menDesignForm").reset();
  $("menDesignId").value = "";
  $("menDesignCategory").value = "Mens";
  $("menDesignPublished").checked = true;
  $("menDesignDiscountType").value = "percent";
  $("menDesignDiscountValue").value = "0";
  $("menDesignIsSpecial").checked = false;
  $("menDesignSpecialLine").value = "";

[
  "menDesignImage",
  "menDesignImage2",
  "menDesignImage3",
  "menDesignImage4",
  "menDesignImage5"
].forEach((id) => {
  if ($(id)) $(id).value = "";
});

  $("menDesignCurrentImageNote").textContent = "";
  $("saveMenDesignButton").textContent = "Save Men's Design";
  $("cancelMenEditButton").classList.add("hidden");
}

$("menDesignForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (savingMenDesign) return;
  if (!(await verifyOwner())) return;

  const title = $("menDesignTitle").value.trim();
  const description = $("menDesignDescription").value.trim();
  const priceText = $("menDesignPrice").value.trim();
  const published = $("menDesignPublished").checked;
  const discountType = $("menDesignDiscountType").value;
  const discountValue = Number($("menDesignDiscountValue").value || 0);
  const isSpecial = $("menDesignIsSpecial").checked;
  const specialLine = $("menDesignSpecialLine").value.trim();

  if (!title) {
    showStatus("menDesignStatus", "Please enter a design title.");
    return;
  }

  if (
    !Number.isFinite(discountValue) ||
    discountValue < 0 ||
    (discountType === "percent" && discountValue > 100)
  ) {
    showStatus("menDesignStatus", "Enter a valid discount.");
    return;
  }

  if (!["percent", "fixed"].includes(discountType)) {
    showStatus("menDesignStatus", "Please select a valid discount type.");
    return;
  }

  const price = priceText === "" ? null : Number(priceText);

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    showStatus("menDesignStatus", "Enter a valid original price.");
    return;
  }

  if (price === null && discountValue > 0) {
    showStatus("menDesignStatus", "Enter the original price before adding a discount.");
    return;
  }

  if (price !== null && discountType === "fixed" && discountValue > price) {
    showStatus("menDesignStatus", "Fixed discount cannot exceed the original price.");
    return;
  }

  const imageIds = [
  "menDesignImage",
  "menDesignImage2",
  "menDesignImage3",
  "menDesignImage4",
  "menDesignImage5"
];

  const files = imageIds.map((id) => $(id).files[0] || null);
  const videoFile = $("menDesignVideo")?.files[0] || null;
  if (videoFile) {
  const allowedVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/3gpp",
    "video/3gpp2",
    "video/x-ms-wmv",
    "video/mpeg",
    "video/ogg",
    "image/gif"
  ];

  const fileExtension = videoFile.name.split(".").pop().toLowerCase();

  const allowedExtensions = [
    "mp4", "webm", "mov", "avi", "mkv",
    "3gp", "3g2", "wmv", "mpeg", "mpg",
    "ogv", "gif"
  ];

  if (
    !allowedVideoTypes.includes(videoFile.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    showStatus(
      "menDesignStatus",
      "Please choose a supported video or GIF file."
    );
    return;
  }

  if (videoFile.size > 50 * 1024 * 1024) {
    showStatus(
      "menDesignStatus",
      "Video or GIF must be 50 MB or smaller."
    );
    return;
  }
}
  for (let i = 0; i < files.length; i++) {
    if (!files[i]) continue;

    const imageError = validateImage(files[i]);

    if (imageError) {
      showStatus("menDesignStatus", `Photo ${i + 1}: ${imageError}`);
      return;
    }
  }

  if (!editingMenDesign && !files[0]) {
    showStatus("menDesignStatus", "Please choose the first design photo.");
    return;
  }

  savingMenDesign = true;
  $("saveMenDesignButton").disabled = true;
  showStatus("menDesignStatus", "Uploading design photos...");

  const uploadedPaths = [];

  try {
    const imageUrls = [
      editingMenDesign?.image_url || "",
      editingMenDesign?.image_url_2 || "",
      editingMenDesign?.image_url_3 || "",
      editingMenDesign?.image_url_4 || ""
    ];

    const storagePaths = [
      editingMenDesign?.storage_path || "",
      editingMenDesign?.storage_path_2 || "",
      editingMenDesign?.storage_path_3 || "",
      editingMenDesign?.storage_path_4 || ""
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const path = makeStoragePath(file);

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      uploadedPaths.push(path);
      imageUrls[i] = publicImageUrl(path);
      storagePaths[i] = path;
    }
        let videoUrl = editingMenDesign?.video_url || null;
          let videoStoragePath = editingMenDesign?.video_storage_path || null;

          if (videoFile) {
            const extension = videoFile.name.split(".").pop().toLowerCase();

            const videoPath =
              `${currentUser.id}/design-videos/${crypto.randomUUID()}.${extension}`;

            const { error: videoUploadError } = await db.storage
              .from(BUCKET)
              .upload(videoPath, videoFile, {
                contentType: videoFile.type || "application/octet-stream",
                upsert: false
              });

            if (videoUploadError) throw videoUploadError;

            uploadedPaths.push(videoPath);

            videoUrl = publicImageUrl(videoPath);
            videoStoragePath = videoPath;
          }
      const record = {
  title,
  category: "Mens",
  description,
  price,

  image_url: imageUrls[0],
  image_url_2: imageUrls[1] || null,
  image_url_3: imageUrls[2] || null,
  image_url_4: imageUrls[3] || null,
  image_url_5: imageUrls[4] || null,

  storage_path: storagePaths[0] || null,
  storage_path_2: storagePaths[1] || null,
  storage_path_3: storagePaths[2] || null,
  storage_path_4: storagePaths[3] || null,
  storage_path_5: storagePaths[4] || null,

  video_url: videoUrl,
  video_storage_path: videoStoragePath,

  published,
  show_on_main: true,
  discount_type: discountType,
  discount_value: discountValue,
  is_special: isSpecial,
  special_line: specialLine || null
};

    showStatus("menDesignStatus", "Saving design details...");

    // Delete replaced photos and video only after database save succeeds.
if (editingMenDesign) {
  const oldPaths = [
    editingMenDesign.storage_path,
    editingMenDesign.storage_path_2,
    editingMenDesign.storage_path_3,
    editingMenDesign.storage_path_4,
    editingMenDesign.storage_path_5
  ].filter(Boolean);

  const replacedPaths = oldPaths.filter(
    (path) => !storagePaths.includes(path)
  );

  if (replacedPaths.length) {
    const { error: cleanupError } = await db.storage
      .from(BUCKET)
      .remove(replacedPaths);

    if (cleanupError) console.error(cleanupError);
  }

  if (
    videoFile &&
    editingMenDesign.video_storage_path
  ) {
    const { error: videoCleanupError } = await db.storage
      .from(BUCKET)
      .remove([editingMenDesign.video_storage_path]);

    if (videoCleanupError) console.error(videoCleanupError);
  }
}
    else {
      const { error } = await db
        .from("rr_designs")
        .insert(record);

      if (error) throw error;
    }

    // Delete replaced photos only after the database save succeeds.
    if (editingMenDesign) {
      const oldPaths = [
        editingMenDesign.storage_path,
        editingMenDesign.storage_path_2,
        editingMenDesign.storage_path_3,
        editingMenDesign.storage_path_4
      ].filter(Boolean);

      const replacedPaths = oldPaths.filter((path) =>
        uploadedPaths.length &&
        [
          editingMenDesign.storage_path,
          editingMenDesign.storage_path_2,
          editingMenDesign.storage_path_3,
          editingMenDesign.storage_path_4
        ].includes(path) &&
        !storagePaths.includes(path)
      );

      if (replacedPaths.length) {
        const { error: cleanupError } = await db.storage
          .from(BUCKET)
          .remove(replacedPaths);

        if (cleanupError) console.error(cleanupError);
      }
    }

    resetMenDesignForm();
    showStatus("menDesignStatus", "Men's design saved successfully!");
    await loadDesigns();
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await db.storage
        .from(BUCKET)
        .remove(uploadedPaths);

      if (cleanupError) console.error(cleanupError);
    }

    console.error("Men's design save error:", error);
    showStatus("menDesignStatus", "Save failed: " + (error.message || "Unknown error"));
  } finally {
    savingMenDesign = false;
    $("saveMenDesignButton").disabled = false;
  }
});

$("cancelMenEditButton").addEventListener("click", resetMenDesignForm);
