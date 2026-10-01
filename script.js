const purchaseModal = document.querySelector("#purchase-modal");
const detailsModal = document.querySelector("#details-modal");
const contactModal = document.querySelector("#contact-modal");
const selectedEvent = document.querySelector("#selected-event");
const selectedPrice = document.querySelector("#selected-price");
const ticketCount = document.querySelector("#ticket-count");
const cartDrawer = document.querySelector("#cart-drawer");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector(".cart-count");
const eventsGrid = document.querySelector(".event-grid");
const eventCards = [...eventsGrid.querySelectorAll(".event-card")];
const pageStatus = document.querySelector(".page-status");
const previousPage = document.querySelector(".previous-page");
const nextPage = document.querySelector(".next-page");
const searchInput = document.querySelector("#event-search");
const checkoutModal = document.querySelector("#checkout-modal");
const accountModal = document.querySelector("#account-modal");
const checkoutCountdown = document.querySelector("#checkout-countdown");
const cartCountdown = document.querySelector("#cart-countdown");
const orderHistory = document.querySelector("#order-history");
const detailsCopy = {
  "Neon Nights": "Ein energiegeladener Abend mit treibenden Gitarren, großen Melodien und einer spektakulären Lichtshow.",
  "Electric Summer": "Sommer, Beats und eine offene Festivalbühne: Dieser elektronische Act bringt die Arena zum Tanzen.",
  "Midnight Groove": "Warme Soul-Vibes, groovige R&B-Rhythmen und eine intime Atmosphäre bis spät in die Nacht."
};
let currentEvent = "";
let cart = [];
let selectedCategory = "Alle";
let selectedSort = "date";
let currentPage = 1;
let selectedSeats = [];
let reservationExpiresAt = 0;
let orders = JSON.parse(localStorage.getItem("soundpass-orders") || "[]");
const eventsPerPage = 6;

function openPurchaseModal(eventName, price) {
  currentEvent = eventName;
  selectedEvent.textContent = eventName;
  selectedPrice.textContent = price;
  selectedSeats = [];
  renderSeats();
  purchaseModal.hidden = false;
  ticketCount.focus();
}

function renderSeats() {
  const map = document.querySelector(".seat-map");
  map.innerHTML = Array.from({ length: 24 }, (_, index) => {
    const seat = index + 1;
    const unavailable = [4, 9, 15, 22].includes(seat);
    return `<button class="seat${unavailable ? " unavailable" : ""}" type="button" ${unavailable ? "disabled" : ""} aria-label="Sitz ${seat}" data-seat="${seat}">${seat}</button>`;
  }).join("");
  map.querySelectorAll(".seat:not(.unavailable)").forEach((seat) => seat.addEventListener("click", () => {
    seat.classList.toggle("selected");
    selectedSeats = [...map.querySelectorAll(".seat.selected")].map((item) => item.dataset.seat);
    ticketCount.value = Math.max(1, selectedSeats.length);
  }));
}

function closeModal(modal) {
  modal.hidden = true;
}

function formatRemaining() {
  if (!reservationExpiresAt) return "10:00";
  const seconds = Math.max(0, Math.ceil((reservationExpiresAt - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function tickReservation() {
  if (reservationExpiresAt && Date.now() >= reservationExpiresAt) {
    cart = [];
    reservationExpiresAt = 0;
    localStorage.removeItem("soundpass-cart");
    localStorage.removeItem("soundpass-reservation-expires");
    renderCart();
    if (!checkoutModal.hidden) closeModal(checkoutModal);
    window.alert("Die Sitzplatz-Reservierung ist abgelaufen. Bitte wähle deine Tickets erneut.");
    return;
  }
  checkoutCountdown.textContent = formatRemaining();
  cartCountdown.textContent = formatRemaining();
}

function renderCart() {
  const totalTickets = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartCount.textContent = totalTickets;
  cartTotal.textContent = `${totalPrice.toFixed(2).replace(".", ",")} €`;
  cartItems.innerHTML = cart.length
    ? cart.map((item) => `<div class="cart-item"><div><strong>${item.name}</strong><small>${item.quantity} Ticket${item.quantity > 1 ? "s" : ""} · Plätze ${item.seats.join(", ")}</small></div><strong>${(item.quantity * item.price).toFixed(2).replace(".", ",")} €</strong></div>`).join("")
    : '<p class="empty-cart">Noch keine Tickets ausgewählt.</p>';
  cartCountdown.textContent = formatRemaining();
}

function addToCart() {
  const quantity = Number(ticketCount.value);
  const price = Number.parseFloat(selectedPrice.textContent.replace(".", "").replace(",", "."));
  if (selectedSeats.length !== quantity) {
    window.alert("Bitte wähle genau so viele Sitzplätze wie Tickets aus.");
    return;
  }
  cart.push({ name: currentEvent, quantity, price, seats: selectedSeats });
  reservationExpiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem("soundpass-cart", JSON.stringify(cart));
  localStorage.setItem("soundpass-reservation-expires", String(reservationExpiresAt));
  closeModal(purchaseModal);
  renderCart();
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function renderEvents() {
  const query = searchInput.value.trim().toLowerCase();
  const matchingCards = eventCards.filter((card) => {
    const matchesCategory = selectedCategory === "Alle" || card.dataset.category === selectedCategory;
    return matchesCategory && (!query || card.textContent.toLowerCase().includes(query));
  });
  const sortedCards = [...matchingCards].sort((a, b) => selectedSort === "name"
    ? a.dataset.band.localeCompare(b.dataset.band)
    : a.dataset.date.localeCompare(b.dataset.date));
  const pageCount = Math.max(1, Math.ceil(sortedCards.length / eventsPerPage));
  currentPage = Math.min(currentPage, pageCount);
  const firstVisible = (currentPage - 1) * eventsPerPage;
  const visibleCards = new Set(sortedCards.slice(firstVisible, firstVisible + eventsPerPage));

  eventCards.forEach((card) => {
    card.hidden = !visibleCards.has(card);
  });
  sortedCards.forEach((card) => eventsGrid.appendChild(card));
  pageStatus.textContent = `Seite ${currentPage} von ${pageCount}`;
  previousPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === pageCount;
}

document.querySelectorAll(".buy-button").forEach((button) => {
  button.addEventListener("click", () => openPurchaseModal(button.dataset.event, button.dataset.price));
});
searchInput.addEventListener("input", () => { currentPage = 1; renderEvents(); });

document.querySelectorAll(".category-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".category-button.active").classList.remove("active");
    button.classList.add("active");
    selectedCategory = button.dataset.category;
    currentPage = 1;
    renderEvents();
  });
});

document.querySelector("#sort-events").addEventListener("change", (event) => {
  selectedSort = event.target.value;
  currentPage = 1;
  renderEvents();
});

previousPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderEvents();
    eventsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

nextPage.addEventListener("click", () => {
  currentPage += 1;
  renderEvents();
  eventsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".act-link").forEach((button) => {
  button.addEventListener("click", () => {
    const eventName = button.dataset.details;
    currentEvent = eventName;
    document.querySelector("#details-event").textContent = eventName;
    document.querySelector("#details-copy").textContent = detailsCopy[eventName] || "Ein besonderer Live-Abend mit starken Sounds, guter Energie und einem Act, den du ganz nah erleben kannst.";
    detailsModal.hidden = false;
  });
});

document.querySelector(".details-buy").addEventListener("click", () => {
  const button = [...document.querySelectorAll(".buy-button")].find((item) => item.dataset.event === currentEvent);
  closeModal(detailsModal);
  openPurchaseModal(button.dataset.event, button.dataset.price);
});

document.querySelector(".modal-submit").addEventListener("click", addToCart);
document.querySelector(".cart-button").addEventListener("click", () => {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
});
document.querySelector(".cart-close").addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
});
document.querySelector(".close-modal").addEventListener("click", () => closeModal(purchaseModal));
document.querySelector(".details-close").addEventListener("click", () => closeModal(detailsModal));
document.querySelector(".contact-email").addEventListener("click", () => {
  contactModal.hidden = false;
  document.querySelector("#contact-name").focus();
});
document.querySelector(".contact-close").addEventListener("click", () => closeModal(contactModal));
contactModal.addEventListener("click", (event) => { if (event.target === contactModal) closeModal(contactModal); });
purchaseModal.addEventListener("click", (event) => { if (event.target === purchaseModal) closeModal(purchaseModal); });
detailsModal.addEventListener("click", (event) => { if (event.target === detailsModal) closeModal(detailsModal); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(purchaseModal);
    closeModal(detailsModal);
    closeModal(contactModal);
    closeModal(checkoutModal);
    closeModal(accountModal);
    cartDrawer.classList.remove("open");
  }
});
document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  window.alert("Danke für deine Nachricht! Wir melden uns bald bei dir.");
  event.target.reset();
  closeModal(contactModal);
});
document.querySelector(".checkout-button").addEventListener("click", () => {
  if (!cart.length) return;
  checkoutModal.hidden = false;
  document.querySelector("#checkout-email").focus();
});

document.querySelector("#checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#checkout-email").value;
  orders.unshift({ id: `SP-${Date.now().toString(36).toUpperCase()}`, event: cart.map((item) => item.name).join(", "), email, date: new Date().toLocaleDateString("de-AT") });
  localStorage.setItem("soundpass-orders", JSON.stringify(orders));
  cart = [];
  reservationExpiresAt = 0;
  localStorage.removeItem("soundpass-cart");
  localStorage.removeItem("soundpass-reservation-expires");
  renderCart();
  closeModal(checkoutModal);
  renderOrders();
  window.alert("Zahlung erfolgreich! Dein digitales Ticket mit QR-Code wurde an deine E-Mail-Adresse gesendet.");
});

function renderOrders() {
  orderHistory.innerHTML = orders.length ? orders.map((order) => `<div class="order-row"><strong>${order.event}</strong><small>${order.date} · ${order.id} · PDF/QR-Ticket verfügbar</small></div>`).join("") : '<p class="empty-cart">Noch keine Bestellungen.</p>';
}

document.querySelector(".account-button").addEventListener("click", () => { renderOrders(); accountModal.hidden = false; });
document.querySelectorAll(".checkout-close, .account-close, .account-close-action").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));

cart = JSON.parse(localStorage.getItem("soundpass-cart") || "[]");
if (cart.length) reservationExpiresAt = Number(localStorage.getItem("soundpass-reservation-expires")) || 0;
renderEvents();
renderCart();
renderOrders();
setInterval(tickReservation, 1000);
