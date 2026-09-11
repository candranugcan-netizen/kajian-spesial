// =========================================================================
// 1. KONFIGURASI UTAMA (PASTE URL WEB APP ANDA DI SINI)
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxyKOTNKonxzp6lp2V0WMc4xM7fhrmX9hftUiYnCUWxjMjxbp4zHEox-fLQtvYyB96k_A/exec"; 
// Contoh format: https://script.google.com/macros/s/XXXXX/exec

// Tanggal Target Kajian untuk Countdown (Format: YYYY-MM-DDTHH:MM:SS)
const TANGGAL_KAJIAN = "2026-09-10T08:00:00";


// =========================================================================
// 2. PRELOADER & INITIALIZATION (Menghilangkan Screen Loading)
// =========================================================================
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    // Beri sedikit jeda halus agar transisi terlihat elegan
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 500);

    // Jalankan fungsi pembaca jumlah peserta secara otomatis saat web dibuka
    muatJumlahPeserta();
});


// =========================================================================
// 3. DARK MODE TOGGLE (Fitur Mode Gelap)
// =========================================================================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

// Cek apakah user sebelumnya sudah mengaktifkan dark mode (tersimpan di browser)
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark'); // Simpan pilihan
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
});


// =========================================================================
// 4. COUNTDOWN TIMER (Hitung Mundur Acara)
// =========================================================================
function updateCountdown() {
    const targetTime = new Date(TANGGAL_KAJIAN).getTime();
    const now = new Date().getTime();
    const difference = targetTime - now;

    if (difference < 0) {
        document.getElementById('countdown').innerHTML = "<p style='color: var(--secondary); font-weight: bold;'>Kajian Sedang/Sudah Berlangsung</p>";
        return;
    }

    // Rumus matematika hitung mundur waktu
    const hari = Math.floor(difference / (1000 * 60 * 60 * 24));
    const jam = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((difference % (1000 * 60)) / 1000);

    // Tampilkan ke HTML
    document.getElementById('hari').innerText = hari < 10 ? '0' + hari : hari;
    document.getElementById('jam').innerText = jam < 10 ? '0' + jam : jam;
    document.getElementById('menit').innerText = menit < 10 ? '0' + menit : menit;
    document.getElementById('detik').innerText = detik < 10 ? '0' + detik : detik;
}
// Jalankan countdown setiap 1 detik sekali
setInterval(updateCountdown, 1000);


// =========================================================================
// 5. FAQ ACCORDION (Buka Tutup Pertanyaan)
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionContent = header.nextElementSibling;
            const isCurrentlyActive = header.classList.contains('active');

            // Tutup semua accordion yang sedang terbuka (opsional)
            accordionHeaders.forEach(otherHeader => {
                otherHeader.classList.remove('active');
                otherHeader.nextElementSibling.style.maxHeight = null;
            });

            // Buka accordion jika sebelumnya tidak aktif
            if (!isCurrentlyActive) {
                header.classList.add('active');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            }
        });
    });
});


/// =========================================================================
// 6. BACK TO TOP BUTTON (Tombol Kembali ke Atas)
// =========================================================================
const backToTopBtn = document.getElementById('back-to-top');

// Menampilkan atau menyembunyikan tombol saat layar di-scroll
window.addEventListener('scroll', () => {
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }
});

// Aksi ketika tombol diklik (kembali ke paling atas)
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// =========================================================================
// 7. BONUS: COUNTER PESERTA (Mengambil Data Realtime Dari Spreadsheet)
// =========================================================================
function muatJumlahPeserta() {
    const counterText = document.getElementById('peserta-counter');
    
    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(data => {
            console.log("Balasan dari Google Apps Script:", data);

            if (data.status === 'success') {
                // Ambil data utama
                let jumlahPendaftar = data.count ?? data.total ?? data.jumlah ?? data.data;

                // JIKA datanya masih berupa objek (bungkusan kotak), kita intip isinya!
                if (typeof jumlahPendaftar === 'object' && jumlahPendaftar !== null) {
                    // Coba ambil properti yang umum ada di dalamnya
                    jumlahPendaftar = jumlahPendaftar.count ?? jumlahPendaftar.total ?? jumlahPendaftar.jumlah ?? jumlahPendaftar.length ?? JSON.stringify(jumlahPendaftar);
                }
                
                counterText.innerText = `Jumlah Pendaftar Saat Ini: ${jumlahPendaftar} Peserta`;
            } else {
                counterText.innerText = "Gagal memuat jumlah pendaftar";
            }
        })
        .catch((error) => {
            console.error("Gagal melakukan fetch:", error);
            counterText.innerText = "Gagal terhubung ke database";
        });
}


// =========================================================================
// 8. VALIDASI FORM & PENGIRIMAN DATA (AJAX FETCH POST)
// =========================================================================
const formKajian = document.getElementById('form-kajian');
const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');
const errorWa = document.getElementById('error-wa');
const toast = document.getElementById('toast-success');
const closeToastBtn = document.getElementById('close-toast');

formKajian.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman reload saat klik submit

    const whatsappInput = document.getElementById('whatsapp').value.trim();

    // --- Validasi Nomor WhatsApp Indonesia (Anti-Spam & Error Handling) ---
    // Aturan: Hanya boleh angka, minimal 10 digit, harus berawalan format Indonesia (08 atau 62)
    const waPattern = /^(08|62)\d{8,13}$/;
    
    if (!waPattern.test(whatsappInput)) {
        errorWa.style.display = 'block';
        document.getElementById('whatsapp').focus();
        return; // Hentikan proses kirim jika salah format
    } else {
        errorWa.style.display = 'none'; // Sembunyikan error jika benar
    }

    // --- Mengubah State Tombol Menjadi Loading ---
    btnSubmit.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';

    // --- Mendapatkan IP Address & User Agent Secara Otomatis (Bonus) ---
    let userIP = "Tidak Diketahui";
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
    } catch (err) {
        console.log("Gagal mengambil IP Address pengguna.");
    }
    const userAgent = navigator.userAgent;

    // --- Mempersiapkan Data Formulir ---
    const formData = new FormData(formKajian);
    
    // Tambahkan data IP dan User Agent manual ke objek formulir
    const urlParams = new URLSearchParams();
    formData.forEach((value, key) => {
        urlParams.append(key, value);
    });
    urlParams.append('ip', userIP);
    urlParams.append('userAgent', userAgent);

    // --- Mengirim Data Menggunakan Fetch API (Method POST) ---
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Penting untuk menghindari error CORS di Google Apps Script
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlParams.toString()
    })
    .then(() => {
        // Karena kita menggunakan mode 'no-cors', Google tidak mengirim balik respon yang bisa dibaca,
        // Namun jika masuk ke blok .then(), artinya data berhasil terkirim ke server Google.
        
        // Tampilkan Toast Sukses Berbentuk Popup Elegan
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('show'); }, 100);
        
        // Reset seluruh inputan form
        formKajian.reset();
        
        // Perbarui counter jumlah peserta terbaru
        muatJumlahPeserta();
    })
    .catch(error => {
        alert("Mohon maaf, terjadi kesalahan jaringan. Silakan coba lagi. Error: " + error.message);
    })
    .finally(() => {
        // Kembalikan tombol ke keadaan semula
        btnSubmit.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    });
});

// Fungsi Menutup Toast Popup Sukses
closeToastBtn.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => { toast.classList.add('hidden'); }, 500);

});

// =========================================================================
// 9. FITUR LAPORAN KEUANGAN
// =========================================================================
const btnKeuangan = document.getElementById('btn-keuangan');
const modalKeuangan = document.getElementById('modal-keuangan');
const closeKeuangan = document.getElementById('close-keuangan');
const submitPin = document.getElementById('submit-pin');
const inputPin = document.getElementById('input-pin');
const errorPin = document.getElementById('error-pin');
const areaPin = document.getElementById('area-pin');
const areaLaporan = document.getElementById('area-laporan');
const bodyLaporan = document.getElementById('body-laporan');

// Buka Modal Keuangan
btnKeuangan.addEventListener('click', (e) => {
    e.preventDefault();
    modalKeuangan.classList.remove('hidden');
    areaPin.classList.remove('hidden');
    areaLaporan.classList.add('hidden');
    inputPin.value = '';
    errorPin.style.display = 'none';
});

// Tutup Modal
closeKeuangan.addEventListener('click', () => {
    modalKeuangan.classList.add('hidden');
});

// Utilitas untuk format Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// Fungsi Render Tabel & Hitung Card
function renderLaporan(dataArray) {
    bodyLaporan.innerHTML = '';
    let totalMasuk = 0;
    let totalKeluar = 0;
    let saldoAkhir = 0;

    if (dataArray.length === 0) {
        bodyLaporan.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data keuangan.</td></tr>';
    } else {
        dataArray.forEach(row => {
            // Asumsi format row Apps Script: [Tanggal, Ket, Masuk, Keluar, Saldo]
            let masuk = parseFloat(row[2]) || 0;
            let keluar = parseFloat(row[3]) || 0;
            let saldo = parseFloat(row[4]) || 0;

            totalMasuk += masuk;
            totalKeluar += keluar;
            saldoAkhir = saldo; // Saldo mengikuti baris terakhir

            bodyLaporan.innerHTML += `
                <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td style="color: #2e7d32;">${masuk > 0 ? formatRupiah(masuk) : '-'}</td>
                    <td style="color: #c62828;">${keluar > 0 ? formatRupiah(keluar) : '-'}</td>
                    <td><strong>${formatRupiah(saldo)}</strong></td>
                </tr>
            `;
        });
    }

    // Update Angka di Card
    document.getElementById('card-masuk').innerText = formatRupiah(totalMasuk);
    document.getElementById('card-keluar').innerText = formatRupiah(totalKeluar);
    document.getElementById('card-saldo').innerText = formatRupiah(saldoAkhir);
}

// Proses Cek PIN & Ambil Data
submitPin.addEventListener('click', () => {
    const pin = inputPin.value.trim();
    if (!pin) return;

    submitPin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memeriksa...';
    submitPin.disabled = true;

    fetch(`${WEB_APP_URL}?action=get_keuangan&pin=${pin}`)
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                areaPin.classList.add('hidden');
                areaLaporan.classList.remove('hidden');
                renderLaporan(res.data);
            } else {
                errorPin.innerText = res.message || "PIN Salah!";
                errorPin.style.display = 'block';
            }
        })
        .catch(err => {
            errorPin.innerText = "Gagal terhubung ke server.";
            errorPin.style.display = 'block';
        })
        .finally(() => {
            submitPin.innerHTML = 'Buka Laporan';
            submitPin.disabled = false;
        });
});

// Fitur Toggle Form Tambah Kas
const btnTambahKas = document.getElementById('btn-tambah-kas');
const formKasArea = document.getElementById('form-kas-area');

btnTambahKas.addEventListener('click', () => {
    formKasArea.classList.toggle('hidden');
    if (!formKasArea.classList.contains('hidden')) {
        btnTambahKas.innerHTML = '<i class="fas fa-times"></i> Tutup';
        btnTambahKas.style.backgroundColor = '#d32f2f';
        btnTambahKas.style.color = '#fff';
    } else {
        btnTambahKas.innerHTML = '+ Tambah Data';
        btnTambahKas.style.backgroundColor = 'var(--secondary)';
        btnTambahKas.style.color = '#000';
    }
});

// Submit Data Kas Baru
const btnSubmitKas = document.getElementById('submit-kas-baru');
const pesanKas = document.getElementById('pesan-kas');

btnSubmitKas.addEventListener('click', () => {
    const pin = inputPin.value.trim(); // Gunakan PIN yang sudah berhasil login
    const tanggal = document.getElementById('kas-tanggal').value;
    const keterangan = document.getElementById('kas-keterangan').value.trim();
    const jenis = document.getElementById('kas-jenis').value;
    const nominal = document.getElementById('kas-nominal').value.trim();

    if (!tanggal || !keterangan || !nominal) {
        pesanKas.innerText = "Mohon lengkapi semua data!";
        pesanKas.style.color = "#d32f2f";
        return;
    }

    btnSubmitKas.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btnSubmitKas.disabled = true;
    pesanKas.innerText = "";

    // Siapkan data untuk dikirim (mode no-cors untuk hindari error Google)
    const urlParams = new URLSearchParams();
    urlParams.append('action', 'add_keuangan');
    urlParams.append('pin', pin);
    urlParams.append('tanggal', tanggal);
    urlParams.append('keterangan', keterangan);
    urlParams.append('jenis', jenis);
    urlParams.append('nominal', nominal);

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams.toString()
    })
    .then(() => {
        pesanKas.innerText = "Berhasil! Refresh tabel untuk melihat.";
        pesanKas.style.color = "#2e7d32";
        
        // Bersihkan form
        document.getElementById('kas-tanggal').value = '';
        document.getElementById('kas-keterangan').value = '';
        document.getElementById('kas-nominal').value = '';
        
        // Otomatis klik tombol "Buka Laporan" secara virtual untuk memuat ulang data terbaru
        setTimeout(() => {
            submitPin.click();
            btnTambahKas.click(); // Tutup form
        }, 1500);
    })
    .catch(error => {
        pesanKas.innerText = "Gagal menyimpan data jaringan.";
        pesanKas.style.color = "#d32f2f";
    })
    .finally(() => {
        btnSubmitKas.innerHTML = 'Simpan Data';
        btnSubmitKas.disabled = false;
    });
});
