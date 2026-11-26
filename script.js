const professionals = {
    "Plumbing":      { name: "Rajesh Kumar", exp: 8,  rating: 5, phone: "+91 9810023501", icon: "🔧" },
    "Electrician":   { name: "Amit Sharma",  exp: 6,  rating: 4.7, phone: "+91 8229567942", icon: "⚡" },
    "Home Cleaning": { name: "Muni Devi",  exp: 5,  rating: 4.9, phone: "+91 9810547003", icon: "🧹" },
    "AC Repair":     { name: "Vikram Singh", exp: 9,  rating: 4.6, phone: "+91 9810015934", icon: "❄️" },
    "Carpenter":     { name: "Mohan Lal",    exp: 12, rating: 4.8, phone: "+91 9819045635", icon: "🪚" },
    "Painting":      { name: "Imran Khan",   exp: 15,  rating: 4.7, phone: "+91 9810023567", icon: "🎨" }
};

function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

function goToBooking() {
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

function bookService(event) {
    event.preventDefault();

    const v = id => document.getElementById(id).value;
    const name = v("name"), phone = v("phone"), service = v("service");
    const date = v("date"), time = v("time"), location = v("location"), address = v("address");
    const problem = v("problem");
    const pro = professionals[service];
    const bookingId = "GS" + Date.now().toString().slice(-6);
    saveBooking({ id: bookingId, service, date, time, location, address, pro: pro.name, proPhone: pro.phone, status: "Confirmed" });

    // Send booking message to the professional
    const msgText = buildProMessage({ id: bookingId, service, name, phone, date, time, location, address, problem }, pro);
    sendToProfessional(service, bookingId, "New Booking", msgText);

    document.getElementById("confirmation").innerHTML =
        "Thank you, <b>" + esc(name) + "</b>!<br>" +
        "Booking ID: <b>" + bookingId + "</b><br>" +
        "Service: <b>" + esc(service) + "</b><br>" +
        "Date: <b>" + esc(date) + "</b> &nbsp; Time: <b>" + esc(time) + "</b><br>" +
        "Area: <b>" + esc(location) + "</b><br>" +
        "Phone: <b>" + esc(phone) + "</b>" +
        '<div class="assigned"><b>Your Serviceman</b><br>' +
        pro.icon + " " + esc(pro.name) + "<br>" +
        "⭐ " + pro.rating + " · " + pro.exp + " yrs experience<br>" +
        "📞 " + pro.phone + "</div>" +
        '<div class="notified">✅ ' + esc(pro.name) + ' has been sent your booking details.</div>';

    document.getElementById("popup").style.display = "flex";
    document.getElementById("bookingForm").reset();
    fillUser();
}

/* ---- Professional messages ---- */
function buildProMessage(b, pro) {
    return "Hello " + pro.name + ",\n" +
        "You have received a new booking (GharSeva)\n\n" +
        "Booking ID: " + b.id + "\n" +
        "Service: " + b.service + "\n" +
        "Date: " + b.date + "\n" +
        "Time: " + b.time + "\n" +
        "Customer: " + b.name + "\n" +
        "Customer Phone: " + b.phone + "\n" +
        "Area: " + b.location + "\n" +
        "Address: " + b.address + "\n" +
        "Problem: " + (b.problem || "Not mentioned");
}

function proInbox() {
    try { return JSON.parse(localStorage.getItem("gs_pro_inbox") || "[]"); } catch (e) { return []; }
}

function sendToProfessional(service, bookingId, type, text) {
    const list = proInbox();
    list.push({ service, bookingId, type, text, sentAt: new Date().toLocaleString("en-IN") });
    localStorage.setItem("gs_pro_inbox", JSON.stringify(list));
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

function useMyLocation() {
    const box = document.getElementById("location");
    if (!navigator.geolocation) { box.value = ""; alert("Location is not supported in this browser."); return; }
    box.value = "Finding your location...";
    navigator.geolocation.getCurrentPosition(
        p => { box.value = p.coords.latitude.toFixed(4) + ", " + p.coords.longitude.toFixed(4); },
        () => { box.value = ""; alert("Could not get your location. Please type your area."); }
    );
}

function renderProfessionals() {
    const list = document.getElementById("prosList");
    list.innerHTML = Object.entries(professionals).map(([svc, p]) =>
        '<div class="pro-card"><div class="pro-avatar">' + p.icon + '</div><div>' +
        "<h3>" + p.name + "</h3><p>" + svc + " Expert</p>" +
        '<p><span class="rating">⭐ ' + p.rating + "</span> · " + p.exp + " yrs experience</p>" +
        "<p>📞 " + p.phone + "</p></div></div>"
    ).join("");
}

function currentUser() {
    try { return JSON.parse(localStorage.getItem("gs_user")); } catch (e) { return null; }
}

function fillUser() {
    const u = currentUser();
    if (u) document.getElementById("name").value = u.name;
}

function setupLoginButton() {
    const btn = document.getElementById("loginBtn");
    const u = currentUser();
    if (u) {
        btn.textContent = "Logout (" + u.name.split(" ")[0] + ")";
        btn.href = "#";
        btn.onclick = e => { e.preventDefault(); localStorage.removeItem("gs_user"); location.reload(); };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderProfessionals();
    setupLoginButton();
    fillUser();
    document.getElementById("date").min = new Date().toISOString().split("T")[0];
});


/* ---- My Bookings (upcoming + past) ---- */
let bkTab = "up";

function owner() { const u = currentUser(); return u ? u.email : "guest"; }

function allBookings() {
    try { return JSON.parse(localStorage.getItem("gs_bookings") || "[]"); } catch (e) { return []; }
}

function saveBooking(b) {
    b.owner = owner();
    const list = allBookings();
    list.push(b);
    localStorage.setItem("gs_bookings", JSON.stringify(list));
    renderBookings();
}

function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    const list = allBookings();
    const b = list.find(x => x.id === id);
    if (b) {
        b.status = "Cancelled";
        sendToProfessional(b.service, b.id, "Cancelled",
            "This booking has been cancelled.\n\nBooking ID: " + b.id + "\nService: " + b.service +
            "\nDate: " + b.date + "\nTime: " + b.time + "\nArea: " + b.location);
    }
    localStorage.setItem("gs_bookings", JSON.stringify(list));
    renderBookings();
}

function showBkTab(t) {
    bkTab = t;
    document.getElementById("tabUp").classList.toggle("active", t === "up");
    document.getElementById("tabPast").classList.toggle("active", t === "past");
    renderBookings();
}

function renderBookings() {
    const box = document.getElementById("bookingsList");
    if (!box) return;
    const now = new Date();
    const mine = allBookings().filter(b => b.owner === owner());
    const isUpcoming = b => b.status !== "Cancelled" && new Date(b.date + "T" + b.time) >= now;
    const shown = mine.filter(b => bkTab === "up" ? isUpcoming(b) : !isUpcoming(b))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (bkTab === "up" ? 1 : -1));

    if (!shown.length) {
        box.innerHTML = '<p class="bk-empty">' + (bkTab === "up"
            ? "No upcoming bookings. Book a service above to see it here."
            : "No past bookings yet.") + "</p>";
        return;
    }
    box.innerHTML = shown.map(b => {
        const state = b.status === "Cancelled" ? "Cancelled" : (isUpcoming(b) ? "Confirmed" : "Completed");
        return '<div class="bk-card"><div><h3>' + esc(b.service) + ' <small>#' + b.id + "</small></h3>" +
            "<p>📅 " + esc(b.date) + " at " + esc(b.time) + "</p>" +
            "<p>📍 " + esc(b.location) + "</p>" +
            "<p>👨‍🔧 " + esc(b.pro) + " · " + esc(b.proPhone) + "</p></div>" +
            '<div class="bk-side"><span class="bk-status ' + state.toLowerCase() + '">' + state + "</span>" +
            (state === "Confirmed" ? '<button class="bk-cancel" onclick="cancelBooking(\'' + b.id + '\')">Cancel</button>' : "") +
            "</div></div>";
    }).join("");
}

document.addEventListener("DOMContentLoaded", renderBookings);
