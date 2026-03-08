# 🎵 Altai Music Downloader - Kullanım Kılavuzu

Bu program, YouTube videolarını en yüksek kalitede ses dosyalarına (MP3, WAV, FLAC, M4A) dönüştüren **tamamen bağımsız (standalone)** profesyonel bir araçtır. Altai Squad topluluğu için "tıkla-çalıştır" mantığıyla geliştirilmiştir.

---

## 🚀 Adım Adım Kullanım Rehberi

Bilgisayarınıza hiçbir şey kurmanıza gerek yoktur. Sadece şu adımları izleyin:

### 1. Programı Çalıştırın
`dist` klasörü içindeki **`altaysound-bot.exe`** dosyasına çift tıklayın. Siyah bir komut penceresi açılacak ve ardından tarayıcınızda (Chrome, Edge vb.) kontrol paneli otomatik olarak belirecektir.

### 2. Dosyaların Hazırlanması (Sadece İlk Seferde)
Programı ilk kez çalıştırdığınızda, yanına otomatik olarak şu dosyalar çıkartılacaktır:
*   `ffmpeg.exe` ve `ffprobe.exe`: Dönüştürme işlemleri için.
*   `yt-dlp.exe`: İndirme işlemleri için.
**Önemli:** Bu dosyaları silmeyin, programın çalışması için gereklidirler.

### 3. Müziğinizi İndirin
*   YouTube linkini kutucuğa yapıştırın.
*   İstediğiniz ses formatını (MP3, WAV, FLAC vb.) seçin.
*   **"İndirmeyi Başlat"** butonuna basın.

---

## 🛠 Bilmeniz Gereken Önemli Noktalar

*   **İndirme Konumu:** İndirdiğiniz tüm müzikler, **`.exe` dosyasını nereye koyduysanız doğrudan o klasöre** kaydedilir.
*   **Bağımsız Çalışma:** Bu program Python, Java veya başka bir ek yazılım gerektirmez. Her şey tek bir paketin içindedir.
*   **Formatlar:** 
    *   **MP3:** Her cihazda çalışır.
    *   **FLAC:** En yüksek (stüdyo) kalitedir.
    *   **WAV:** Kayıpsız ses formatıdır.

---

## ❓ Sıkça Sorulan Sorular (FAQ)

**S: Program açılıyor ama indirme başlamıyor?**
C: YouTube linkinin doğru olduğundan ve internet bağlantınızın olduğundan emin olun.

**S: Dosyalar neden `.webm` olarak kalıyor?**
C: Klasördeki `ffmpeg.exe` ve `ffprobe.exe` dosyalarının silinmediğinden emin olun. Eğer silindiyse programı kapatıp tekrar açın, otomatik olarak yeniden oluşacaklardır.

**S: Bu program güvenli mi?**
C: Evet, tamamen açık kaynaklıdır ve sadece belirttiğiniz linkten veri indirir. Virüs uyarısı alırsanız "Yine de çalıştır" diyebilirsiniz (imzasız uygulama olduğu için Windows uyarı verebilir).

---

**Yapımcı:** [Altai Squad](https://github.com/Taka-source14)
