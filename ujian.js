// =========================================================================
// KONFIGURASI API (Ganti dengan URL Google Apps Script Anda)
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyaN7GSMJGYaCDOIJX-lhre6XSeGaBFCfu1f9gM5DiAGTv_GkD4hOx6qKpzl0uwGMy4JA/exec"; 
const TOKEN_UJIAN_AKTIF = "20260910";

// State data global untuk menyimpan daftar soal
let bankSoalAktif = [];

// Elemen DOM Ujian
const ujianAuthArea = document.getElementById('ujian-auth-area');
const ujianSoalArea = document.getElementById('ujian-soal-area');
const ujianHasilArea = document.getElementById('ujian-hasil-area');
const btnMulaiUjian = document.getElementById('btn-mulai-ujian');
const btnSubmitUjian = document.getElementById('btn-submit-ujian');
const inputNamaUjian = document.getElementById('ujian-nama-input');
const errorUjianAuth = document.getElementById('error-ujian-auth');
const errorSubmitUjian = document.getElementById('error-submit-ujian');
const kontenSoal = document.getElementById('konten-soal');
const namaAktifPeserta = document.getElementById('nama-aktif-peserta');
const bodyKlasemen = document.getElementById('body-klasemen');

// --- 1. Fungsi Muat Klasemen (Leaderboard) ---
function muatKlasemen() {
    fetch(`${WEB_APP_URL}?action=get_klasemen`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                bodyKlasemen.innerHTML = '';
                if (res.data.length === 0) {
                    bodyKlasemen.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada peserta yang ujian.</td></tr>';
                    return;
                }
                res.data.forEach((peserta, index) => {
                    let piala = index + 1;
                    if (index === 0) piala = '🥇';
                    else if (index === 1) piala = '🥈';
                    else if (index === 2) piala = '🥉';

                    bodyKlasemen.innerHTML += `
                        <tr>
                            <td style="text-align: center; font-weight: bold;">${piala}</td>
                            <td>${peserta.nama}</td>
                            <td style="text-align: center; font-weight: bold; color: var(--primary);">${peserta.skor}</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(() => {
            bodyKlasemen.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#d32f2f;">Gagal memuat klasemen.</td></tr>';
        });
}

// --- 2. Proses Validasi Nama & Token Sebelum Mulai Ujian ---
btnMulaiUjian.addEventListener('click', () => {
    const nama = inputNamaUjian.value.trim();
    // Ambil nilai token dari input dan jadikan huruf besar semua agar seragam
    const pin = document.getElementById('ujian-pin-input').value.trim().toUpperCase(); 

    // Cek apakah ada yang kosong
    if (!nama || !pin) {
        errorUjianAuth.innerText = "Mohon lengkapi nama dan Token ujian Anda!";
        return;
    }

    // Cek apakah Token yang dimasukkan BENAR
    if (pin !== TOKEN_UJIAN_AKTIF.toUpperCase()) {
        errorUjianAuth.innerText = "Afwan, Token ujian yang Anda masukkan salah atau ujian belum dibuka.";
        return;
    }

    btnMulaiUjian.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memvalidasi...';
    btnMulaiUjian.disabled = true;
    errorUjianAuth.innerText = "";

    // Lanjut periksa nama ke server jika Token benar
    fetch(`${WEB_APP_URL}?action=check_name&nama=${encodeURIComponent(nama)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success' && res.data.exists) {
                errorUjianAuth.innerText = "Afwan, nama Anda sudah terdaftar telah mengikuti ujian!";
                btnMulaiUjian.innerHTML = 'Buka & Mulai Ujian';
                btnMulaiUjian.disabled = false;
            } else {
                ambilSoalUjian(nama);
            }
        })
        .catch(() => {
            errorUjianAuth.innerText = "Gagal memverifikasi data dengan server.";
            btnMulaiUjian.innerHTML = 'Buka & Mulai Ujian';
            btnMulaiUjian.disabled = false;
        });
});

// --- 3. Fungsi Ambil Lembar Soal ---
function ambilSoalUjian(namaPeserta) {
    fetch(`${WEB_APP_URL}?action=get_soal`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                bankSoalAktif = res.data;
                kontenSoal.innerHTML = '';
                
                bankSoalAktif.forEach((soal, index) => {
                    kontenSoal.innerHTML += `
                        <div class="blok-soal" style="background-color: var(--bg-main); border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <div class="teks-pertanyaan" style="font-weight:bold; margin-bottom:15px;">${index + 1}. ${soal.pertanyaan}</div>
                            <div class="wadah-opsi" style="display:flex; flex-direction:column; gap:10px;">
                                <label class="label-opsi"><input type="radio" name="soal_${soal.no}" value="A" style="margin-right:10px;"> A. ${soal.opsiA}</label>
                                <label class="label-opsi"><input type="radio" name="soal_${soal.no}" value="B" style="margin-right:10px;"> B. ${soal.opsiB}</label>
                                <label class="label-opsi"><input type="radio" name="soal_${soal.no}" value="C" style="margin-right:10px;"> C. ${soal.opsiC}</label>
                                
                            </div>
                        </div>
                    `;
                });

                namaAktifPeserta.innerText = namaPeserta;
                ujianAuthArea.classList.add('hidden');
                ujianSoalArea.classList.remove('hidden');
            } else {
                errorUjianAuth.innerText = "Gagal mengambil lembar soal.";
            }
        })
        .catch(() => {
            errorUjianAuth.innerText = "Terjadi kesalahan jaringan saat memuat soal.";
        })
        .finally(() => {
            btnMulaiUjian.innerHTML = 'Mulai Ujian';
            btnMulaiUjian.disabled = false;
        });
}

// --- 4. Proses Kumpul & Kirim Jawaban ---
btnSubmitUjian.addEventListener('click', () => {
    const nama = inputNamaUjian.value.trim();
    let paketJawaban = {};
    let adaYangBelumDiisi = false;

    bankSoalAktif.forEach(soal => {
        const opsiDipilih = document.querySelector(`input[name="soal_${soal.no}"]:checked`);
        if (opsiDipilih) {
            paketJawaban[soal.no] = opsiDipilih.value;
        } else {
            adaYangBelumDiisi = true;
        }
    });

    if (adaYangBelumDiisi) {
        errorSubmitUjian.innerText = "Mohon selesaikan dan jawab seluruh soal sebelum dikirim!";
        return;
    }

    if (!confirm("Apakah Anda yakin ingin mengumpulkan semua jawaban sekarang?")) return;

    btnSubmitUjian.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim & Memeriksa Jawaban...';
    btnSubmitUjian.disabled = true;
    errorSubmitUjian.innerText = "";

    const urlParams = new URLSearchParams();
    urlParams.append('action', 'submit_ujian');
    urlParams.append('nama', nama);
    urlParams.append('jawaban', JSON.stringify(paketJawaban));

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams.toString()
    })
    .then(() => {
        ujianSoalArea.classList.add('hidden');
        ujianHasilArea.classList.remove('hidden');
        
        setTimeout(() => {
            muatKlasemen();
            
            // Cari skor terbaru peserta dari database klasemen untuk dimunculkan langsung
            fetch(`${WEB_APP_URL}?action=get_klasemen`)
                .then(r => r.json())
                .then(res => {
                    const dataUser = res.data.find(p => p.nama.toLowerCase() === nama.toLowerCase());
                    if (dataUser) {
                        document.getElementById('skor-akhir-peserta').innerText = dataUser.skor;
                        document.getElementById('detail-skor-peserta').innerText = `Barakallahu fiik, lembar jawaban Anda berhasil diperiksa.`;
                    }
                });
        }, 2500);
    })
    .catch(() => {
        errorSubmitUjian.innerText = "Terjadi masalah saat mengirim jawaban.";
        btnSubmitUjian.innerHTML = 'Kirim Semua Jawaban';
        btnSubmitUjian.disabled = false;
    });
});

// --- 5. Inisialisasi Pertama Kali ---
document.addEventListener('DOMContentLoaded', () => {
    muatKlasemen();
});