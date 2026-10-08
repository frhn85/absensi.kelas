const DEFAULT_USERS = Array.from({ length: 36 }, (_, i) => ({
    username: `siswa${i + 1}`,
    password: "12345",
    name: `Siswa ${i + 1}`,
    role: "user"
}));

const DEFAULT_ADMINS = [
    {
        username: "adminpplg1",
        password: "loginadmin",
        name: "Admin PPLG 1",
        role: "admin"
    }
];

const DEFAULT_STUDENTS = [
    {
        id: "yc8f1x",
        nis: "1001",
        name: "Andi Pratama",
        className: "X PPLG 1"
    },
    {
        id: "b7k2m9",
        nis: "1002",
        name: "Budi Setiawan",
        className: "X PPLG 1"
    },
    {
        id: "p4x8q2",
        nis: "1003",
        name: "Citra Lestari",
        className: "X PPLG 2"
    }
];

const DEFAULT_SCHEDULES = [
    {
        id: "s1",
        day: "Senin",
        subject: "Informatika",
        teacher: "Guru Informatika",
        time: "07:00 - 08:30"
    },
    {
        id: "s2",
        day: "Selasa",
        subject: "Bahasa Indonesia",
        teacher: "Guru Bahasa Indonesia",
        time: "07:00 - 08:30"
    },
    {
        id: "s3",
        day: "Rabu",
        subject: "Pemrograman Web",
        teacher: "Guru PPLG",
        time: "07:00 - 09:30"
    },
    {
        id: "s4",
        day: "Kamis",
        subject: "Matematika",
        teacher: "Guru Matematika",
        time: "07:00 - 08:30"
    },
    {
        id: "s5",
        day: "Jumat",
        subject: "Pendidikan Pancasila",
        teacher: "Guru PPKn",
        time: "07:00 - 08:30"
    }
];

let users = JSON.parse(localStorage.getItem("users")) || DEFAULT_USERS;
let admins = JSON.parse(localStorage.getItem("admins")) || DEFAULT_ADMINS;
let students = JSON.parse(localStorage.getItem("students")) || DEFAULT_STUDENTS;
let schedules = JSON.parse(localStorage.getItem("schedules")) || DEFAULT_SCHEDULES;
let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

let cameraStream = null;
let selfieData = null;
let attendanceLocation = null;
let editingStudentId = null;
let calendarDate = new Date();

function $(id) {
    return document.getElementById(id);
}

function show(el) {
    if (el) el.classList.remove("hidden");
}

function hide(el) {
    if (el) el.classList.add("hidden");
}

function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveAdmins() {
    localStorage.setItem("admins", JSON.stringify(admins));
}

function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}

function saveSchedules() {
    localStorage.setItem("schedules", JSON.stringify(schedules));
}

function saveAttendance() {
    localStorage.setItem("attendance", JSON.stringify(attendance));
}

function saveCurrentUser() {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getInitial(name = "") {
    return name.trim().charAt(0).toUpperCase() || "U";
}

function formatDate(date) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}


/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    setupLogin();
    setupNavigation();
    setupAttendance();
    setupCamera();
    setupLocation();
    setupStudentManagement();
    setupProfile();
    setupSettings();
    setupCalendar();
    setupModals();
    setupSchoolLocation();

    if (currentUser) {
        openApp();
    } else {
        showLoginPage();
    }
});


/* =====================================================
   LOGIN
===================================================== */

function setupLogin() {
    $("loginForm")?.addEventListener("submit", e => {
        e.preventDefault();

        const username = $("loginUsername")?.value.trim();
        const password = $("loginPassword")?.value;

        const user = users.find(
            u =>
                u.username === username &&
                u.password === password
        );

        if (!user) {
            alert("Username atau password salah.");
            return;
        }

        currentUser = {
            ...user,
            role: "user"
        };

        saveCurrentUser();
        openApp();
    });

    $("adminLoginForm")?.addEventListener("submit", e => {
        e.preventDefault();

        const username = $("adminUsername")?.value.trim();
        const password = $("adminPassword")?.value;

        const admin = admins.find(
            a =>
                a.username === username &&
                a.password === password
        );

        if (!admin) {
            alert("Username atau password admin salah.");
            return;
        }

        currentUser = {
            ...admin,
            role: "admin"
        };

        saveCurrentUser();
        openApp();
    });
}

function showAdminLogin() {
    hide($("userLogin"));
    show($("adminLogin"));
}

function showUserLogin() {
    hide($("adminLogin"));
    show($("userLogin"));
}

function showLoginPage() {
    hide($("app"));
    show($("authPage"));
    showUserLogin();
}


/* =====================================================
   APP
===================================================== */

function openApp() {
    hide($("authPage"));
    show($("app"));

    updateUserUI();
    setupRoleUI();

    renderDashboard();
    renderStudents();
    renderSchedules();
    renderCalendar();
    renderRecap();
    renderUsers();
    renderProfile();
    renderSchoolLocation();

    showPage("dashboard");
}

function updateUserUI() {
    if (!currentUser) return;

    const name =
        currentUser.name ||
        currentUser.username ||
        "User";

    const initial = getInitial(name);

    if ($("topUsername")) {
        $("topUsername").textContent =
            currentUser.username;
    }

    if ($("topRole")) {
        $("topRole").textContent =
            currentUser.role === "admin"
                ? "Administrator"
                : "Siswa";
    }

    if ($("topAvatar")) {
        $("topAvatar").textContent = initial;
    }

    if ($("dashboardName")) {
        $("dashboardName").textContent = name;
    }

    if ($("profileUsername")) {
        $("profileUsername").textContent =
            currentUser.username;
    }

    if ($("profileUsername2")) {
        $("profileUsername2").textContent =
            currentUser.username;
    }

    if ($("profileName")) {
        $("profileName").textContent = name;
    }

    if ($("profileAvatar")) {
        $("profileAvatar").textContent = initial;
    }

    if ($("profileRole")) {
        $("profileRole").textContent =
            currentUser.role === "admin"
                ? "Administrator"
                : "Siswa";
    }
}

function setupRoleUI() {
    const isAdmin = currentUser?.role === "admin";

    document.querySelectorAll(".admin-only").forEach(el => {
        el.classList.toggle("hidden", !isAdmin);
    });

    document.querySelectorAll(".user-only").forEach(el => {
        el.classList.toggle("hidden", isAdmin);
    });
}


/* =====================================================
   NAVIGATION
===================================================== */

const pageMap = {
    dashboard: "page-dashboard",
    absen: "page-absen",
    siswa: "page-siswa",
    jadwal: "page-jadwal",
    kalender: "page-kalender",
    rekap: "page-rekap",
    users: "page-users",
    lokasi: "page-lokasi",
    profile: "page-profile",
    pengaturan: "page-pengaturan"
};

const pageTitles = {
    dashboard: "Dashboard",
    absen: "Absen",
    siswa: "Data Siswa",
    jadwal: "Jadwal",
    kalender: "Kalender",
    rekap: "Rekap",
    users: "Manajemen User",
    lokasi: "Pengaturan Lokasi",
    profile: "Profile",
    pengaturan: "Pengaturan"
};

function setupNavigation() {
    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.addEventListener("click", () => {
            const page = item.dataset.page;

            if (
                currentUser?.role !== "admin" &&
                ["users", "lokasi"].includes(page)
            ) {
                return;
            }

            goToPage(page);
            closeSidebar();
        });
    });
}

function goToPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(pageMap[page]);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");

        if (item.dataset.page === page) {
            item.classList.add("active");
        }
    });

    if ($("pageTitle")) {
        $("pageTitle").textContent =
            pageTitles[page] || "Dashboard";
    }

    if (page === "dashboard") renderDashboard();
    if (page === "siswa") renderStudents();
    if (page === "jadwal") renderSchedules();
    if (page === "kalender") renderCalendar();
    if (page === "rekap") renderRecap();
    if (page === "users") renderUsers();
    if (page === "profile") renderProfile();
}

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

function closeSidebar() {
    document.querySelector(".sidebar")?.classList.remove("open");
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {
    stopCamera();

    currentUser = null;
    selfieData = null;
    attendanceLocation = null;

    localStorage.removeItem("currentUser");

    closeSidebar();
    showLoginPage();
}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {
    if ($("totalStudents")) {
        $("totalStudents").textContent =
            students.length;
    }

    const today = new Date().toISOString().split("T")[0];

    const todayData = attendance.filter(
        item => item.date === today
    );

    if ($("todayPresent")) {
        $("todayPresent").textContent =
            todayData.filter(
                item => item.status === "Hadir"
            ).length;
    }

    if ($("todayPermission")) {
        $("todayPermission").textContent =
            todayData.filter(
                item => item.status === "Izin"
            ).length;
    }

    if ($("todaySick")) {
        $("todaySick").textContent =
            todayData.filter(
                item => item.status === "Sakit"
            ).length;
    }
}


/* =====================================================
   ATTENDANCE
===================================================== */

function setupAttendance() {
    $("attendanceForm")?.addEventListener(
        "submit",
        submitAttendance
    );

    document
        .querySelectorAll(
            'input[name="attendanceStatus"]'
        )
        .forEach(input => {
            input.addEventListener(
                "change",
                updateAttendanceStatus
            );
        });

    updateAttendanceDate();
}

function updateAttendanceDate() {
    const date = $("attendanceDate");

    if (date) {
        date.textContent =
            formatDate(new Date());
    }
}

function updateAttendanceStatus() {
    const selected =
        document.querySelector(
            'input[name="attendanceStatus"]:checked'
        );

    const note = $("attendanceNote");

    if (!selected || !note) return;

    if (selected.value === "Hadir") {
        note.placeholder =
            "Keterangan tambahan (opsional)";
    } else {
        note.placeholder =
            "Masukkan keterangan";
    }
}

async function submitAttendance(e) {
    e.preventDefault();

    if (!currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const selected =
        document.querySelector(
            'input[name="attendanceStatus"]:checked'
        );

    const status = selected?.value;

    const note =
        $("attendanceNote")?.value.trim() || "";

    if (!status) {
        alert("Pilih status kehadiran.");
        return;
    }

    if (
        ["Izin", "Sakit", "Bolos"].includes(status) &&
        !note
    ) {
        alert(
            "Keterangan wajib diisi untuk status ini."
        );
        return;
    }

    if (!selfieData) {
        alert("Ambil selfie terlebih dahulu.");
        return;
    }

    if (!attendanceLocation) {
        alert("Kirim lokasi terlebih dahulu.");
        return;
    }

    const now = new Date();

    const student =
        students.find(
            s =>
                s.username ===
                currentUser.username
        ) ||
        students.find(
            s =>
                s.name ===
                currentUser.name
        );

    const record = {
        id:
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2),

        username: currentUser.username,

        name:
            currentUser.name ||
            currentUser.username,

        nis: student?.nis || "",

        className:
            student?.className || "",

        date:
            now.toISOString().split("T")[0],

        time: formatTime(now),

        timestamp: now.toISOString(),

        status,

        note,

        selfie: selfieData,

        location: attendanceLocation
    };

    attendance.push(record);
    saveAttendance();

    renderDashboard();
    renderRecap();

    if ($("attendanceResult")) {
        $("attendanceResult").innerHTML = `
            <strong>Absensi berhasil disimpan.</strong>
            <div>${escapeHTML(status)} • ${formatTime(now)}</div>
        `;

        show($("attendanceResult"));
    }

    alert("Absensi berhasil disimpan.");

    selfieData = null;
    attendanceLocation = null;

    resetCamera();
    resetLocation();
}


/* =====================================================
   CAMERA
===================================================== */

function setupCamera() {}

async function startCamera() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Browser tidak mendukung kamera.");
            return;
        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

        const video = $("cameraPreview");

        if (!video) return;

        video.srcObject = cameraStream;
        video.classList.remove("hidden");

        hide($("cameraPlaceholder"));

        await video.play();

    } catch (error) {
        console.error(error);

        alert(
            "Kamera tidak dapat digunakan. Pastikan izin kamera diberikan."
        );
    }
}

function takeSelfie() {
    const video = $("cameraPreview");
    const canvas = $("cameraCanvas");

    if (!video || !canvas) return;

    if (!video.videoWidth) {
        alert("Kamera belum siap.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    selfieData =
        canvas.toDataURL(
            "image/jpeg",
            0.72
        );

    const preview = $("selfiePreview");

    if (preview) {
        preview.src = selfieData;
        preview.classList.remove("hidden");
    }

    video.classList.add("hidden");

    stopCamera();
}

function resetCamera() {
    stopCamera();

    selfieData = null;

    const video = $("cameraPreview");
    const preview = $("selfiePreview");

    if (video) {
        video.srcObject = null;
        video.classList.add("hidden");
    }

    if (preview) {
        preview.src = "";
        preview.classList.add("hidden");
    }

    show($("cameraPlaceholder"));
}

function stopCamera() {
    if (!cameraStream) return;

    cameraStream
        .getTracks()
        .forEach(track => track.stop());

    cameraStream = null;
}


/* =====================================================
   LOCATION
===================================================== */

function setupLocation() {}

function getAttendanceLocation() {
    if (!navigator.geolocation) {
        alert("Browser tidak mendukung lokasi.");
        return;
    }

    if ($("locationStatus")) {
        $("locationStatus").textContent =
            "Sedang mengambil lokasi...";
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            attendanceLocation = {
                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                timestamp:
                    new Date().toISOString()
            };

            if ($("locationStatus")) {
                $("locationStatus").textContent =
                    `Lokasi berhasil diambil`;
            }

            if ($("locationText")) {
                $("locationText").textContent =
                    `Akurasi ±${Math.round(
                        position.coords.accuracy
                    )} meter`;
            }
        },

        error => {
            console.error(error);

            if ($("locationStatus")) {
                $("locationStatus").textContent =
                    "Lokasi gagal diambil";
            }

            alert(
                "Lokasi tidak dapat diambil. Pastikan GPS aktif dan izin lokasi diberikan."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

function resetLocation() {
    attendanceLocation = null;

    if ($("locationStatus")) {
        $("locationStatus").textContent =
            "Lokasi belum dikirim";
    }

    if ($("locationText")) {
        $("locationText").textContent =
            "Tekan tombol untuk mengambil lokasi.";
    }
}


/* =====================================================
   STUDENT
===================================================== */

function setupStudentManagement() {
    $("studentSearch")?.addEventListener(
        "input",
        e => renderStudents(e.target.value)
    );

    $("studentForm")?.addEventListener(
        "submit",
        saveStudent
    );
}

function renderStudents(search = "") {
    const body = $("studentTableBody");

    if (!body) return;

    const keyword =
        search.trim().toLowerCase();

    const list = students.filter(student => {
        return (
            student.name
                .toLowerCase()
                .includes(keyword) ||
            student.nis
                .toLowerCase()
                .includes(keyword) ||
            student.className
                .toLowerCase()
                .includes(keyword)
        );
    });

    body.innerHTML = "";

    list.forEach((student, index) => {
        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHTML(student.nis)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.className)}</td>
            <td class="admin-only">
                ${
                    currentUser?.role === "admin"
                        ? `
                            <button
                                class="icon-btn"
                                onclick="editStudent('${student.id}')"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="icon-btn danger"
                                onclick="deleteStudent('${student.id}')"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `
                        : ""
                }
            </td>
        `;

        body.appendChild(row);
    });
}

function openStudentModal() {
    if (currentUser?.role !== "admin") {
        alert("Hanya admin yang dapat menambah siswa.");
        return;
    }

    editingStudentId = null;

    if ($("studentModalTitle")) {
        $("studentModalTitle").textContent =
            "Tambah Siswa";
    }

    $("studentForm")?.reset();

    show($("studentModal"));
}

function closeStudentModal() {
    editingStudentId = null;
    hide($("studentModal"));
}

function editStudent(id) {
    if (currentUser?.role !== "admin") return;

    const student =
        students.find(s => s.id === id);

    if (!student) return;

    editingStudentId = id;

    $("studentNis").value = student.nis;
    $("studentName").value = student.name;
    $("studentClass").value = student.className;

    if ($("studentModalTitle")) {
        $("studentModalTitle").textContent =
            "Edit Siswa";
    }

    show($("studentModal"));
}

function saveStudent(e) {
    e.preventDefault();

    if (currentUser?.role !== "admin") return;

    const nis =
        $("studentNis")?.value.trim();

    const name =
        $("studentName")?.value.trim();

    const className =
        $("studentClass")?.value.trim();

    if (!nis || !name || !className) {
        alert("Semua data siswa wajib diisi.");
        return;
    }

    if (editingStudentId) {
        const student =
            students.find(
                s => s.id === editingStudentId
            );

        if (student) {
            student.nis = nis;
            student.name = name;
            student.className = className;
        }
    } else {
        students.push({
            id:
                Date.now().toString(36),
            nis,
            name,
            className
        });
    }

    saveStudents();
    renderStudents();
    renderDashboard();

    closeStudentModal();
}

function deleteStudent(id) {
    if (currentUser?.role !== "admin") return;

    const student =
        students.find(s => s.id === id);

    if (!student) return;

    if (
        !confirm(
            `Hapus data ${student.name}?`
        )
    ) {
        return;
    }

    students =
        students.filter(
            s => s.id !== id
        );

    saveStudents();
    renderStudents();
    renderDashboard();
}


/* =====================================================
   SCHEDULE
===================================================== */

function renderSchedules() {
    const container =
        $("scheduleList");

    if (!container) return;

    container.innerHTML = "";

    schedules.forEach(schedule => {
        const card =
            document.createElement("div");

        card.className =
            "schedule-card";

        card.innerHTML = `
            <span class="day">
                ${escapeHTML(schedule.day)}
            </span>

            <h3>
                ${escapeHTML(schedule.subject)}
            </h3>

            <p>
                ${escapeHTML(schedule.teacher)}
            </p>

            <p>
                <i class="fa-regular fa-clock"></i>
                ${escapeHTML(schedule.time)}
            </p>
        `;

        container.appendChild(card);
    });
}


/* =====================================================
   CALENDAR
===================================================== */

function setupCalendar() {
    renderCalendar();
}

function changeMonth(amount) {
    calendarDate.setMonth(
        calendarDate.getMonth() + amount
    );

    renderCalendar();
}

function renderCalendar() {
    const grid = $("calendarGrid");

    if (!grid) return;

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    const firstDay =
        new Date(year, month, 1).getDay();

    const days =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    if ($("calendarTitle")) {
        $("calendarTitle").textContent =
            new Intl.DateTimeFormat(
                "id-ID",
                {
                    month: "long",
                    year: "numeric"
                }
            ).format(
                new Date(year, month, 1)
            );
    }

    grid.innerHTML = "";

    [
        "Min",
        "Sen",
        "Sel",
        "Rab",
        "Kam",
        "Jum",
        "Sab"
    ].forEach(day => {
        const el =
            document.createElement("div");

        el.className =
            "calendar-day head";

        el.textContent = day;

        grid.appendChild(el);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day empty";

        grid.appendChild(empty);
    }

    const today = new Date();

    for (
        let day = 1;
        day <= days;
        day++
    ) {
        const el =
            document.createElement("div");

        el.className =
            "calendar-day";

        el.textContent = day;

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            el.classList.add("today");
        }

        grid.appendChild(el);
    }
}


/* =====================================================
   REKAP 20 JAM
===================================================== */

function renderRecap() {
    const body =
        $("recapTableBody");

    if (!body) return;

    const limit =
        Date.now() -
        20 * 60 * 60 * 1000;

    let records =
        attendance.filter(item => {
            const time =
                new Date(
                    item.timestamp
                ).getTime();

            return time >= limit;
        });

    if (currentUser?.role !== "admin") {
        records =
            records.filter(
                item =>
                    item.username ===
                    currentUser.username
            );
    }

    records.sort(
        (a, b) =>
            new Date(b.timestamp) -
            new Date(a.timestamp)
    );

    const latest = new Map();

    records.forEach(record => {
        const key =
            record.username ||
            record.name;

        if (!latest.has(key)) {
            latest.set(key, record);
        }
    });

    records =
        Array.from(latest.values());

    body.innerHTML = "";

    if (!records.length) {
        body.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:30px;">
                    Belum ada data absensi
                </td>
            </tr>
        `;

        return;
    }

    records.forEach((record, index) => {
        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>

            <td>
                ${escapeHTML(record.nis || "-")}
            </td>

            <td>
                ${escapeHTML(record.name || "-")}
            </td>

            <td>
                ${escapeHTML(record.className || "-")}
            </td>

            <td>
                ${getStatusBadge(record.status)}
            </td>

            <td>
                ${escapeHTML(record.time || "-")}
            </td>

            <td>
                <button
                    class="detail-btn recap-detail-btn"
                    onclick="openRecapDetail('${record.id}')"
                >
                    <i class="fa-solid fa-eye"></i>
                    Detail
                </button>
            </td>
        `;

        body.appendChild(row);
    });
}

function getStatusBadge(status) {
    const value =
        String(status || "")
            .toLowerCase();

    return `
        <span class="status-${value}">
            ${escapeHTML(status || "-")}
        </span>
    `;
}

function openRecapDetail(id) {
    const record =
        attendance.find(
            item => item.id === id
        );

    if (!record) return;

    if (
        currentUser?.role !== "admin" &&
        record.username !== currentUser?.username
    ) {
        return;
    }

    const content =
        $("recapDetailContent");

    if (!content) return;

    const location =
        record.location
            ? `${Number(record.location.latitude).toFixed(6)}, ${Number(record.location.longitude).toFixed(6)}`
            : "-";

    content.innerHTML = `
        <div class="recap-detail-grid">

            <div class="recap-detail-info">
                <span>NIS</span>
                <strong>${escapeHTML(record.nis || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Nama</span>
                <strong>${escapeHTML(record.name || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Kelas</span>
                <strong>${escapeHTML(record.className || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Status</span>
                <strong>${getStatusBadge(record.status)}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Tanggal</span>
                <strong>${escapeHTML(record.date || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Jam</span>
                <strong>${escapeHTML(record.time || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Keterangan</span>
                <strong>${escapeHTML(record.note || "-")}</strong>
            </div>

            <div class="recap-detail-info">
                <span>Lokasi</span>
                <strong>${escapeHTML(location)}</strong>
            </div>

        </div>

        ${
            record.selfie
                ? `
                    <div class="recap-photo-section">
                        <div class="recap-photo-heading">
                            <i class="fa-solid fa-camera"></i>
                            Foto Selfie
                        </div>

                        <img
                            src="${record.selfie}"
                            class="recap-detail-photo"
                            alt="Foto selfie"
                        >
                    </div>
                `
                : ""
        }
    `;

    if ($("recapDetailTitle")) {
        $("recapDetailTitle").textContent =
            record.name || "Detail Absensi";
    }

    if ($("recapDetailSubtitle")) {
        $("recapDetailSubtitle").textContent =
            `${record.className || "-"} • ${record.status}`;
    }

    show($("recapDetailModal"));
}

function closeRecapDetail() {
    hide($("recapDetailModal"));
}


/* =====================================================
   PROFILE
===================================================== */

function setupProfile() {
    $("editProfileForm")?.addEventListener(
        "submit",
        saveProfile
    );
}

function renderProfile() {
    updateUserUI();
}

function openEditProfile() {
    if (currentUser?.role === "admin") {
        alert("Profile admin tidak dapat diubah.");
        return;
    }

    if ($("editUsername")) {
        $("editUsername").value =
            currentUser.username;
    }

    if ($("editName")) {
        $("editName").value =
            currentUser.name || "";
    }

    if ($("editPassword")) {
        $("editPassword").value = "";
    }

    show($("editProfileModal"));
}

function closeEditProfile() {
    hide($("editProfileModal"));
}

function saveProfile(e) {
    e.preventDefault();

    if (!currentUser) return;

    if (currentUser.role === "admin") {
        alert("Profile admin tidak dapat diubah.");
        return;
    }

    const username =
        $("editUsername")?.value.trim();

    const name =
        $("editName")?.value.trim();

    const password =
        $("editPassword")?.value ||
        currentUser.password;

    if (!username || !name) {
        alert("Username dan nama wajib diisi.");
        return;
    }

    const duplicate =
        users.some(
            user =>
                user.username === username &&
                user.username !==
                    currentUser.username
        );

    if (duplicate) {
        alert("Username sudah digunakan.");
        return;
    }

    const user =
        users.find(
            u =>
                u.username ===
                currentUser.username
        );

    if (!user) return;

    user.username = username;
    user.name = name;
    user.password = password;

    currentUser.username = username;
    currentUser.name = name;
    currentUser.password = password;

    saveUsers();
    saveCurrentUser();

    updateUserUI();
    closeEditProfile();

    alert("Profile berhasil diperbarui.");
}


/* =====================================================
   SETTINGS
===================================================== */

function setupSettings() {
    const toggle =
        $("darkModeToggle");

    if (!toggle) return;

    const dark =
        localStorage.getItem("darkMode") !== "false";

    toggle.checked = dark;

    document.body.classList.toggle(
        "light-mode",
        !dark
    );

    toggle.addEventListener(
        "change",
        () => {
            localStorage.setItem(
                "darkMode",
                toggle.checked
            );

            document.body.classList.toggle(
                "light-mode",
                !toggle.checked
            );
        }
    );
}

function exportData() {
    const data = {
        users,
        admins,
        students,
        schedules,
        attendance,
        exportedAt:
            new Date().toISOString()
    };

    const blob =
        new Blob(
            [JSON.stringify(data, null, 2)],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `absensi-data-${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


/* =====================================================
   SCHOOL LOCATION
===================================================== */

function setupSchoolLocation() {
    renderSchoolLocation();
}

function getSchoolLocation() {
    return (
        JSON.parse(
            localStorage.getItem(
                "schoolLocation"
            )
        ) || {
            name: "",
            latitude: "",
            longitude: ""
        }
    );
}

function renderSchoolLocation() {
    const location =
        getSchoolLocation();

    if ($("schoolLocationName")) {
        $("schoolLocationName").value =
            location.name || "";
    }

    if ($("schoolLatitude")) {
        $("schoolLatitude").value =
            location.latitude || "";
    }

    if ($("schoolLongitude")) {
        $("schoolLongitude").value =
            location.longitude || "";
    }
}

function saveSchoolLocation() {
    if (currentUser?.role !== "admin") {
        alert(
            "Hanya admin yang dapat mengatur lokasi."
        );
        return;
    }

    const name =
        $("schoolLocationName")?.value.trim();

    const latitude =
        $("schoolLatitude")?.value.trim();

    const longitude =
        $("schoolLongitude")?.value.trim();

    if (!name || !latitude || !longitude) {
        alert(
            "Nama, latitude, dan longitude wajib diisi."
        );
        return;
    }

    localStorage.setItem(
        "schoolLocation",
        JSON.stringify({
            name,
            latitude,
            longitude
        })
    );

    alert("Lokasi sekolah berhasil disimpan.");
}


/* =====================================================
   USERS
===================================================== */

function renderUsers() {
    const body =
        $("userTableBody");

    if (!body) return;

    body.innerHTML = "";

    users.forEach((user, index) => {
        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHTML(user.username)}</td>
            <td>${escapeHTML(user.name)}</td>
            <td>
                <span class="role-badge">
                    Siswa
                </span>
            </td>
        `;

        body.appendChild(row);
    });
}


/* =====================================================
   MODALS
===================================================== */

function setupModals() {
    document
        .querySelectorAll(".modal")
        .forEach(modal => {
            modal.addEventListener(
                "click",
                e => {
                    if (e.target === modal) {
                        modal.classList.add("hidden");
                    }
                }
            );
        });

    document.addEventListener(
        "keydown",
        e => {
            if (e.key !== "Escape") return;

            document
                .querySelectorAll(".modal")
                .forEach(modal => {
                    modal.classList.add("hidden");
                });
        }
    );
}


/* =====================================================
   GLOBAL
===================================================== */

window.showAdminLogin = showAdminLogin;
window.showUserLogin = showUserLogin;

window.toggleSidebar = toggleSidebar;
window.goToPage = goToPage;
window.logout = logout;

window.startCamera = startCamera;
window.takeSelfie = takeSelfie;
window.getAttendanceLocation =
    getAttendanceLocation;

window.openStudentModal =
    openStudentModal;
window.closeStudentModal =
    closeStudentModal;

window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

window.changeMonth = changeMonth;

window.openRecapDetail =
    openRecapDetail;
window.closeRecapDetail =
    closeRecapDetail;

window.openEditProfile =
    openEditProfile;
window.closeEditProfile =
    closeEditProfile;

window.saveSchoolLocation =
    saveSchoolLocation;

window.exportData =
    exportData;