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
let students = JSON.parse(localStorage.getItem("students")) || [];
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

const ATTENDANCE_TTL_MS = 20 * 60 * 60 * 1000;

function purgeExpiredAttendance() {
  const now = Date.now();
  const oldLength = attendance.length;

  attendance = attendance.filter(item => {
    const createdAt = Date.parse(
      item.timestamp || item.createdAt || ""
    );

    if (!Number.isFinite(createdAt)) return true;

    return now - createdAt < ATTENDANCE_TTL_MS;
  });

  if (attendance.length !== oldLength) {
    saveAttendance();
    return true;
  }

  return false;
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

/* INIT */

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

/* LOGIN */

function setupLogin() {
  $("loginForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const username = $("loginUsername")?.value.trim();
    const password = $("loginPassword")?.value;

    const user = users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      alert("Username atau password salah.");
      return;
    }

    currentUser = { ...user, role: "user" };
    saveCurrentUser();
    openApp();
  });

  $("adminLoginForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const username = $("adminUsername")?.value.trim();
    const password = $("adminPassword")?.value;

    const admin = admins.find(
      a => a.username === username && a.password === password
    );

    if (!admin) {
      alert("Username atau password admin salah.");
      return;
    }

    currentUser = { ...admin, role: "admin" };
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

/* APP */

function openApp() {
  hide($("authPage"));
  show($("app"));

  updateUserUI();
  setupRoleUI();
  setAttendanceDefaults();

  renderDashboard();
  renderStudents();
  renderSchedules();
  renderCalendar();
  renderRecap();
  renderUsers();
  renderProfile();
  renderSchoolLocation();

  goToPage("dashboard");
}

function updateUserUI() {
  if (!currentUser) return;

  const name = currentUser.name || currentUser.username || "User";
  const initial = getInitial(name);

  if ($("topUsername")) $("topUsername").textContent = currentUser.username;

  if ($("topRole")) {
    $("topRole").textContent =
      currentUser.role === "admin" ? "Administrator" : "Siswa";
  }

  if ($("topAvatar")) $("topAvatar").textContent = initial;
  if ($("dashboardName")) $("dashboardName").textContent = name;
  if ($("profileUsername")) $("profileUsername").textContent = currentUser.username;
  if ($("profileUsername2")) $("profileUsername2").textContent = currentUser.username;
  if ($("profileName")) $("profileName").textContent = name;
  if ($("profileAvatar")) $("profileAvatar").textContent = initial;

  if ($("profileRole")) {
    $("profileRole").textContent =
      currentUser.role === "admin" ? "Administrator" : "Siswa";
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

/* NAVIGATION */

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
      ) return;

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
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.dataset.page === page) item.classList.add("active");
  });

  if ($("pageTitle")) {
    $("pageTitle").textContent = pageTitles[page] || "Dashboard";
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
  document.querySelector(".sidebar")?.classList.toggle("open");
}

function closeSidebar() {
  document.querySelector(".sidebar")?.classList.remove("open");
}

/* LOGOUT */

function logout() {
  stopCamera();
  currentUser = null;
  selfieData = null;
  attendanceLocation = null;

  localStorage.removeItem("currentUser");

  closeSidebar();
  showLoginPage();
}

/* DASHBOARD */

function renderDashboard() {
  if ($("totalStudents")) {
    $("totalStudents").textContent = students.length;
  }

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const todayData = attendance.filter(item => item.date === today);

  if ($("todayPresent")) {
    $("todayPresent").textContent =
      todayData.filter(item => item.status === "Hadir").length;
  }

  if ($("todayPermission")) {
    $("todayPermission").textContent =
      todayData.filter(item => item.status === "Izin").length;
  }

  if ($("todaySick")) {
    $("todaySick").textContent =
      todayData.filter(item => item.status === "Sakit").length;
  }
}

/* ATTENDANCE */

function setupAttendance() {
  $("attendanceForm")?.addEventListener("submit", submitAttendance);
  setAttendanceDefaults();
}

function setAttendanceDefaults() {
  const nameInput = $("attendanceName");
  const classInput = $("attendanceClass");
  const dateInput = $("attendanceDateInput");

  const student =
    students.find(s => s.username === currentUser?.username) ||
    students.find(s => s.name === currentUser?.name);

  if (nameInput && currentUser) {
    nameInput.value = currentUser.name || currentUser.username || "";
  }

  if (classInput && student) {
    classInput.value = student.className || "";
  }

  if (dateInput) {
    const today = new Date();
    dateInput.value = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
  }
}

function submitAttendance(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const selected = document.querySelector(
    'input[name="attendanceStatus"]:checked'
  );

  const status = selected?.value;
  const name = $("attendanceName")?.value.trim() || "";
  const className = $("attendanceClass")?.value.trim() || "";
  const date = $("attendanceDateInput")?.value || "";
  const note = $("attendanceNote")?.value.trim() || "";

  if (!status) {
    alert("Pilih status kehadiran.");
    return;
  }

  if (!["Hadir", "Izin", "Sakit"].includes(status)) {
    alert("Status kehadiran tidak valid.");
    return;
  }

  if (!name) {
    alert("Nama wajib diisi.");
    return;
  }

  if (!className) {
    alert("Kelas wajib diisi.");
    return;
  }

  if (!date) {
    alert("Tanggal wajib diisi.");
    return;
  }

  const student =
    students.find(s => s.username === currentUser.username) ||
    students.find(s => s.name === name);

  const existingIndex = attendance.findIndex(item =>
    item.username === currentUser.username &&
    item.date === date
  );

  const record = {
    id: existingIndex >= 0
      ? attendance[existingIndex].id
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: currentUser.username,
    name,
    className,
    date,
    status,
    note,
    studentId: student?.id || null,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    attendance[existingIndex] = record;
  } else {
    attendance.push(record);
  }

  saveAttendance();

  $("attendanceForm")?.reset();
  setAttendanceDefaults();

  document.querySelectorAll('input[name="attendanceStatus"]').forEach(input => {
    input.checked = false;
  });

  renderDashboard();
  renderRecap();

  alert("Absensi berhasil disimpan.");
}

/* =====================================================
   CAMERA
===================================================== */

function setupCamera() { }

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

  selfieData = canvas.toDataURL("image/jpeg", 0.72);

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

  cameraStream.getTracks().forEach(track => track.stop());

  cameraStream = null;
}

/* =====================================================
   LOCATION
===================================================== */

function setupLocation() { }

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
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      if ($("locationStatus")) {
        $("locationStatus").textContent =
          "Lokasi berhasil diambil";
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
      "Lokasi belum diambil";
  }

  if ($("locationText")) {
    $("locationText").textContent = "";
  }
}

/* =====================================================
   STUDENT MANAGEMENT
===================================================== */

function setupStudentManagement() {
  $("studentForm")?.addEventListener("submit", saveStudent);

  $("studentSearch")?.addEventListener("input", renderStudents);

  $("studentCancel")?.addEventListener("click", resetStudentForm);
}

function renderStudents() {
  const container = $("studentsTableBody");
  if (!container) return;

  const search = $("studentSearch")?.value
    .trim()
    .toLowerCase() || "";

  const filtered = students
    .filter(student =>
      `${student.nis} ${student.name} ${student.className}`
        .toLowerCase()
        .includes(search)
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, "id", {
        sensitivity: "base"
      })
    );

  container.innerHTML = filtered.map(student => `
        <tr>
            <td>${escapeHTML(student.nis || "-")}</td>
            <td>${escapeHTML(student.name || "-")}</td>
            <td>${escapeHTML(student.className || "-")}</td>
            <td class="admin-only">9
                <button type="button"
                    onclick="deleteStudent('${escapeHTML(student.id)}')">
                    Hapus
                </button>
            </td>
        </tr>
    `).join("");

  if (!filtered.length) {
    container.innerHTML = `
            <tr>
                <td colspan="4">Data siswa tidak ditemukan.</td>
            </tr>
        `;
  }

  setupRoleUI();
}

function saveStudent(e) {
  e.preventDefault();

  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang dapat mengubah data siswa.");
    return;
  }

  const nis = $("studentNis")?.value.trim() || "";
  const name = $("studentName")?.value.trim() || "";
  const className = $("studentClass")?.value.trim() || "";

  if (!nis || !name || !className) {
    alert("Semua data siswa wajib diisi.");
    return;
  }

  const duplicate = students.find(student =>
    student.nis === nis && student.id !== editingStudentId
  );

  if (duplicate) {
    alert("NIS sudah digunakan.");
    return;
  }

  if (editingStudentId) {
    students = students.map(student =>
      student.id === editingStudentId
        ? { ...student, nis, name, className }
        : student
    );
  } else {
    students.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nis,
      name,
      className
    });
  }

  saveStudents();
  renderStudents();
  renderDashboard();
  hide($("studentFormContainer"));
  resetStudentForm();
  alert("Data siswa berhasil disimpan.");
}


function editStudent(id) {
  if (currentUser?.role !== "admin") return;

  const student = students.find(item => item.id === id);
  if (!student) return;

  editingStudentId = id;

  if ($("studentNis")) $("studentNis").value = student.nis || "";
  if ($("studentName")) $("studentName").value = student.name || "";
  if ($("studentClass")) $("studentClass").value = student.className || "";

  show($("studentFormContainer"));
}

function deleteStudent(id) {
  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang bisa menghapus siswa.");
    return;
  }

  const student = students.find(s => String(s.id) === String(id));

  if (!student) {
    alert("Data siswa tidak ditemukan.");
    return;
  }

  if (!confirm(`Yakin ingin menghapus ${student.name}?`)) {
    return;
  }

  students = students.filter(s => String(s.id) !== String(id));

  saveStudents();
  renderStudents();
  renderDashboard();

  alert("Data siswa berhasil dihapus.");
}

function resetStudentForm() {
  editingStudentId = null;

  $("studentForm")?.reset();

  hide($("studentFormContainer"));
}

/* =====================================================
   SCHEDULES
===================================================== */

function renderSchedules() {
  const container = $("scheduleTableBody");
  if (!container) return;

  container.innerHTML = schedules.map(schedule => `
        <tr>
            <td>${escapeHTML(schedule.day)}</td>
            <td>${escapeHTML(schedule.time)}</td>
            <td>${escapeHTML(schedule.subject)}</td>
            <td>${escapeHTML(schedule.teacher)}</td>
        </tr>
    `).join("");
}

/* =====================================================
   RECAP
===================================================== */

function renderRecap() {
  purgeExpiredAttendance();
  const container = $("recapTableBody");
  if (!container) return;

  const sorted = [...attendance].sort((a, b) =>
    `${b.date} ${b.createdAt || ""}`.localeCompare(
      `${a.date} ${a.createdAt || ""}`
    )
  );

  container.innerHTML = sorted.map(item => {
    let jam = "-";

    if (item.createdAt) {
      jam = new Date(item.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } else if (item.time) {
      jam = item.time;
    }

    return `
    <tr>
        <td>${escapeHTML(item.name || "-")}</td>
        <td>${escapeHTML(item.className || "-")}</td>
        <td>${escapeHTML(item.date || "-")}</td>
        <td>${escapeHTML(item.status || "-")}</td>
        <td>${escapeHTML(jam)}</td>
        <td>
            ${currentUser?.role === "admin" ? `
                <button
                    class="delete-attendance-btn"
                    onclick="deleteAttendance('${escapeHTML(item.id)}')"
                    title="Hapus absensi"
                    aria-label="Hapus absensi">
                    <i class="fa-solid fa-trash"></i>
                </button>
            ` : ""}
        </td>
    </tr>
`;
  }).join("");

  if (!sorted.length) {
    container.innerHTML = `
            <tr>
                <td colspan="6">Belum ada data absensi.</td>
            </tr>
        `;
  }
}

/* =====================================================
   USER MANAGEMENT
===================================================== */

function renderUsers() {
  const container = $("usersTableBody");
  if (!container) return;

  if (currentUser?.role !== "admin") {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHTML(user.username)}</td>
            <td>${escapeHTML(user.name)}</td>
            <td>${escapeHTML(user.role || "user")}</td>
        </tr>
    `).join("");
}

/* =====================================================
   PROFILE
===================================================== */

function setupProfile() {
  $("profileForm")?.addEventListener("submit", updateProfile);
}

function renderProfile() {
  if (!currentUser) return;

  if ($("profileName")) {
    $("profileName").textContent = currentUser.name || currentUser.username;
  }

  if ($("profileUsername")) {
    $("profileUsername").textContent = currentUser.username;
  }

  if ($("editProfileName")) {
    $("editProfileName").value = currentUser.name || "";
  }

  if ($("editProfileUsername")) {
    $("editProfileUsername").value = currentUser.username || "";
  }
}

function updateProfile(e) {
  e.preventDefault();

  if (!currentUser || currentUser.role === "admin") {
    alert("Profil admin tidak dapat diubah.");
    return;
  }

  const name = $("editProfileName")?.value.trim() || "";
  const username = $("editProfileUsername")?.value.trim() || "";
  const password = $("editProfilePassword")?.value || "";

  if (!name || !username) {
    alert("Nama dan username wajib diisi.");
    return;
  }

  const duplicate = users.find(user =>
    user.username === username &&
    user.username !== currentUser.username
  );

  if (duplicate) {
    alert("Username sudah digunakan.");
    return;
  }

  const oldUsername = currentUser.username;

  users = users.map(user => {
    if (user.username !== oldUsername) return user;

    return {
      ...user,
      name,
      username,
      ...(password ? { password } : {})
    };
  });

  currentUser = users.find(user => user.username === username);

  attendance = attendance.map(item =>
    item.username === oldUsername
      ? { ...item, username, name }
      : item
  );

  saveUsers();
  saveAttendance();
  saveCurrentUser();

  updateUserUI();
  renderProfile();

  alert("Profil berhasil diperbarui.");
}

/* =====================================================
   SETTINGS
===================================================== */

function setupSettings() {
  $("logoutButton")?.addEventListener("click", logout);
}

/* =====================================================
   CALENDAR
===================================================== */

function setupCalendar() {
  $("calendarPrev")?.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  $("calendarNext")?.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderCalendar() {
  const container = $("calendarGrid");
  if (!container) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  if ($("calendarMonth")) {
    $("calendarMonth").textContent =
      new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric"
      }).format(calendarDate);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  let html = "";

  ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].forEach(day => {
    html += `<div class="calendar-day-name">${day}</div>`;
  });

  for (let i = 0; i < offset; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const isToday = dateKey === todayKey;

    html += `
            <div class="calendar-day ${isToday ? "today" : ""}">
                ${day}
            </div>
        `;
  }

  container.innerHTML = html;
}

/* =====================================================
   SCHOOL LOCATION
===================================================== */

function setupSchoolLocation() {
  $("schoolLocationForm")?.addEventListener("submit", saveSchoolLocation);
}

function renderSchoolLocation() {
  const location = JSON.parse(
    localStorage.getItem("schoolLocation") || "null"
  );

  if (!location) return;

  if ($("schoolLatitude")) {
    $("schoolLatitude").value = location.latitude ?? "";
  }

  if ($("schoolLongitude")) {
    $("schoolLongitude").value = location.longitude ?? "";
  }

  if ($("schoolRadius")) {
    $("schoolRadius").value = location.radius ?? 100;
  }
}

function saveSchoolLocation(e) {
  e.preventDefault();

  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang dapat mengatur lokasi sekolah.");
    return;
  }

  const latitude = Number($("schoolLatitude")?.value);
  const longitude = Number($("schoolLongitude")?.value);
  const radius = Number($("schoolRadius")?.value || 100);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    radius <= 0
  ) {
    alert("Data lokasi sekolah tidak valid.");
    return;
  }

  localStorage.setItem("schoolLocation", JSON.stringify({
    latitude,
    longitude,
    radius
  }));

  alert("Lokasi sekolah berhasil disimpan.");
}

/* =====================================================
   MODALS
===================================================== */

function setupModals() {
  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
      const modalId = button.dataset.closeModal;
      hide($(modalId));
    });
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) hide(modal);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;

    document.querySelectorAll(".modal").forEach(hide);
    closeSidebar();
  });
}

function openModal(id) {
  show($(id));
}

function closeModal(id) {
  hide($(id));
}

/* =====================================================
   USER MENU
===================================================== */

function toggleUserMenu() {
  $("userMenu")?.classList.toggle("hidden");
}

document.addEventListener("click", e => {
  const menu = $("userMenu");
  const trigger = $("userMenuButton");

  if (
    menu &&
    !menu.contains(e.target) &&
    !trigger?.contains(e.target)
  ) {
    menu.classList.add("hidden");
  }
});

/* =====================================================
   EXPORT ATTENDANCE CSV
===================================================== */

function exportAttendanceCSV() {
  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang dapat mengekspor data.");
    return;
  }

  if (!attendance.length) {
    alert("Belum ada data absensi.");
    return;
  }

  const headers = [
    "Nama",
    "Kelas",
    "Tanggal",
    "Status",
    "Keterangan"
  ];

  const rows = attendance.map(item => [
    item.name,
    item.className,
    item.date,
    item.status,
    item.note || ""
  ]);

  const csvCell = value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers,
    ...rows
  ].map(row => row.map(csvCell).join(",")).join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rekap-absensi.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =====================================================
   RESET DATA
===================================================== */

function resetAllData() {
  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang dapat mereset data.");
    return;
  }

  const confirmed = confirm(
    "Yakin ingin menghapus seluruh data absensi?"
  );

  if (!confirmed) return;

  attendance = [];
  saveAttendance();

  renderDashboard();
  renderRecap();

  alert("Data absensi berhasil dihapus.");
}

/* =====================================================
   END OF SCRIPT
===================================================== */

console.log("Script absensi berhasil dimuat.");

function deleteAttendance(id) {
  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang bisa menghapus absensi.");
    return;
  }

  if (!confirm("Yakin ingin menghapus data absensi ini?")) {
    return;
  }

  attendance = attendance.filter(item => String(item.id) !== String(id));

  saveAttendance();
  renderRecap();
  renderDashboard();

  alert("Data absensi berhasil dihapus.");
}

function openStudentModal() {
  if (currentUser?.role !== "admin") {
    alert("Hanya admin yang bisa menambah siswa.");
    return;
  }

  const modal = document.getElementById("studentModal");

  if (!modal) {
    alert("Form tambah siswa tidak ditemukan di HTML.");
    return;
  }

  editingStudentId = null;
  document.getElementById("studentForm")?.reset();

  const title = document.getElementById("studentModalTitle");
  if (title) title.textContent = "Tambah Siswa";

  modal.classList.remove("hidden");
}