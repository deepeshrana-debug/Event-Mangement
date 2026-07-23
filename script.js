// ========================
// DARK MODE
// ========================
function toggleDark() {
  document.body.classList.toggle("dark");
}

// ========================
// LOGIN
// ========================
function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  if (u === "admin" && p === "1234") {
    localStorage.setItem("admin", true);
    window.location = "dashboard.html";
  } else {
    document.getElementById("msg").innerText = "Wrong credentials";
  }
}

// ========================
// EVENT STORAGE
// ========================
function getEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}
function saveEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

// ========================
// COUNTDOWN HELPER
// ========================
function getCountdownText(dateStr) {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = eventDate - now;

  if (diff <= 0) return { text: "Event ended", urgent: false };

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)  return { text: `⏳ ${days}d ${hours}h left`, urgent: days <= 3 };
  if (hours > 0) return { text: `⚡ ${hours}h ${mins}m left`, urgent: true };
  return { text: `🔥 Starting in ${mins}m!`, urgent: true };
}

// ========================
// SEARCH + FILTER EVENTS
// ========================
function filterEvents() {
  const query  = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const sort   = document.getElementById("sortSelect")?.value || "default";
  let events   = getEvents();

  // Filter by search
  if (query) {
    events = events.filter(e => e.name.toLowerCase().includes(query));
  }

  // Sort
  if (sort === "date") {
    events = events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === "seats") {
    events = events.sort((a, b) => (b.seats - b.booked) - (a.seats - a.booked));
  }

  renderEvents(events);
}

// ========================
// RENDER USER EVENTS
// ========================
function renderEvents(events) {
  const container = document.getElementById("eventList");
  if (!container) return;

  container.innerHTML = "";

  if (events.length === 0) {
    container.innerHTML = `<div class="no-results">😕 No events found.</div>`;
    return;
  }

  // Get original index from full events array
  const allEvents = getEvents();

  events.forEach((e) => {
    const originalIndex = allEvents.findIndex(
      ev => ev.name === e.name && ev.date === e.date
    );

    const pct      = Math.round((e.booked / e.seats) * 100);
    const isFull   = e.booked >= e.seats;
    const countdown = getCountdownText(e.date);
    const formattedDate = new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });

    const div = document.createElement("div");
    div.className = "event-card";

    div.innerHTML = `
      <h3>${e.name}</h3>
      <p>📅 ${formattedDate}</p>
      <p class="countdown ${countdown.urgent ? 'urgent' : ''}">${countdown.text}</p>
      <p>${e.booked}/${e.seats} booked</p>
      <div class="progress">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      <button onclick="bookTicket(${originalIndex})" ${isFull ? 'disabled' : ''}>
        ${isFull ? '❌ Sold Out' : '🎟️ Book Ticket'}
      </button>
    `;

    container.appendChild(div);
  });
}

// ========================
// LOAD USER EVENTS
// ========================
function loadEvents() {
  const container = document.getElementById("eventList");
  if (!container) return;
  filterEvents(); // uses filterEvents so search/sort works on load too
}

// ========================
// BOOK TICKET
// ========================
function bookTicket(index) {
  let events = getEvents();

  if (events[index].booked < events[index].seats) {
    events[index].booked++;
    saveEvents(events);

    // Show ticket modal
    showTicket(events[index]);
  } else {
    alert("❌ Sold Out!");
  }

  loadEvents();
  updateStats();
}

// ========================
// TICKET MODAL
// ========================
function showTicket(event) {
  document.getElementById("ticketEventName").innerText = event.name;
  document.getElementById("ticketDate").innerText = new Date(event.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  document.getElementById("ticketSeat").innerText = "#" + event.booked;
  document.getElementById("ticketModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("ticketModal").style.display = "none";
}

// Close modal if clicking outside
window.addEventListener("click", function(e) {
  const modal = document.getElementById("ticketModal");
  if (modal && e.target === modal) closeModal();
});

// ========================
// ADMIN: ADD EVENT
// ========================
function addEvent() {
  const name  = document.getElementById("eventName").value;
  const date  = document.getElementById("eventDate").value;
  const seats = parseInt(document.getElementById("eventSeats").value);

  if (!name || !date || !seats) return alert("Please fill all fields.");

  const events = getEvents();
  events.push({ name, date, seats: seats, booked: 0 });

  saveEvents(events);
  loadAdminEvents();
  updateStats();
}

// ========================
// ADMIN: LOAD EVENTS
// ========================
function loadAdminEvents() {
  const container = document.getElementById("adminEvents");
  if (!container) return;

  container.innerHTML = "";
  const events = getEvents();

  events.forEach((e, i) => {
    const pct = Math.round((e.booked / e.seats) * 100);
    const formattedDate = new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
    const div = document.createElement("div");
    div.className = "event-card";

    div.innerHTML = `
      <h3>${e.name}</h3>
      <p>📅 ${formattedDate}</p>
      <p>Seats: ${e.booked}/${e.seats}</p>
      <div class="progress">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      <button onclick="deleteEvent(${i})" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">
        🗑️ Delete
      </button>
    `;

    container.appendChild(div);
  });
}

// ========================
// ADMIN: DELETE EVENT
// ========================
function deleteEvent(index) {
  let events = getEvents();
  events.splice(index, 1);
  saveEvents(events);
  loadAdminEvents();
  updateStats();
}

// ========================
// PREVIEW (HOME PAGE)
// ========================
function loadPreview() {
  const container = document.getElementById("previewEvents");
  if (!container) return;

  const events = getEvents();
  container.innerHTML = "";

  events.slice(0, 3).forEach(e => {
    const formattedDate = new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${e.name}</h3>
      <p>📅 ${formattedDate}</p>
      <p>${e.booked}/${e.seats} booked</p>
    `;
    container.appendChild(div);
  });
}

// ========================
// STATS
// ========================
function updateStats() {
  const events = getEvents();
  const countEl  = document.getElementById("eventCount");
  const ticketEl = document.getElementById("ticketCount");
  const userEl   = document.getElementById("userCount");

  if (!countEl) return;

  let tickets = 0;
  events.forEach(e => { tickets += e.booked; });

  countEl.innerText  = events.length;
  ticketEl.innerText = tickets;
  userEl.innerText   = tickets * 2;
}

// ========================
// ANIMATED COUNTERS
// ========================
function animate(id, end) {
  let i = 0;
  let interval = setInterval(() => {
    i += Math.ceil(end / 50);
    if (i >= end) { i = end; clearInterval(interval); }
    document.getElementById(id).innerText = i + "+";
  }, 30);
}

if (document.getElementById("s1")) {
  animate("s1", 50000);
  animate("s2", 200000);
  animate("s3", 1000000);
}

// ========================
// LANGUAGE SWITCHER
// ========================
const translations = {
  en: { title: "Plan Amazing Events", desc: "Smart event management platform" },
  hi: { title: "शानदार इवेंट प्लान करें", desc: "इवेंट मैनेजमेंट प्लेटफॉर्म" }
};

function changeLang(lang) {
  const h1 = document.querySelector(".hero h1");
  const p  = document.querySelector(".hero p");
  if (!h1 || !p) return;
  h1.innerText = translations[lang].title;
  p.innerText  = translations[lang].desc;
}

// ========================
// AUTO COUNTDOWN REFRESH
// ========================
setInterval(() => {
  const container = document.getElementById("eventList");
  if (container) filterEvents();
}, 60000); // refresh countdowns every minute

// ========================
// INIT
// ========================
loadEvents();
loadAdminEvents();
loadPreview();
updateStats();