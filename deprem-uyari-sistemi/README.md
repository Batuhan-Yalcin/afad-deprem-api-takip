# AFAD Deprem Uyarı Sistemi

![Deprem Uyarı Sistemi](https://img.shields.io/badge/Versiyon-1.0.0-red)

Türkiye genelinde meydana gelen depremleri gerçek zamanlı olarak takip edebileceğiniz modern ve interaktif bir web uygulaması. AFAD verilerini kullanarak son 7 gün içindeki tüm deprem aktivitelerini harita üzerinde ve liste halinde görüntülemenizi sağlar.

## 🌟 Özellikler

- **Gerçek Zamanlı Veri**: AFAD API kullanarak Türkiye'deki en güncel deprem verilerini gösterir
- **İnteraktif Harita**: Depremlerin konumlarını ve büyüklüklerini harita üzerinde görselleştirir
- **Filtreleme Seçenekleri**: İl bazında veya deprem büyüklüğüne göre filtreleme
- **Bildirim Sistemi**: Önemli depremler için tarayıcı bildirimleri (izin gerektirir)
- **Duyarlı Tasarım**: Mobil cihazlar dahil tüm ekran boyutlarına uyumlu arayüz
- **Modern Görsel Efektler**: Şık animasyonlar ve dinamik renk geçişleri

## 🛠️ Kullanılan Teknolojiler

### Frontend
- **Next.js**: React tabanlı modern web framework
- **React**: Kullanıcı arayüzü geliştirmek için JavaScript kütüphanesi
- **Tailwind CSS**: Hızlı ve duyarlı tasarım için CSS framework'ü
- **React Icons**: Kullanıcı arayüzü ikonları
- **Framer Motion**: Animasyonlar ve geçiş efektleri için
- **Leaflet**: İnteraktif harita görüntüleme

### Backend
- **Next.js API Routes**: Harici API'lerle iletişim için sunucu taraflı API
- **Axios**: HTTP istekleri için
- **AFAD API**: Türkiye'deki deprem verilerinin resmi kaynağı

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel geliştirme ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

```bash
# Projeyi klonlayın
git clone https://github.com/kullaniciadi/deprem-uyari-sistemi.git

# Proje dizinine gidin
cd deprem-uyari-sistemi

# Gerekli paketleri yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak uygulamayı görüntüleyebilirsiniz.



### Veri Akışı
1. AFAD API'den deprem verileri düzenli aralıklarla çekilir
2. Veriler ön uçta işlenir ve filtrelenir
3. Kullanıcı arayüzü, verileri harita ve liste olarak görselleştirir
4. Kullanıcı filtreleri uygulayarak spesifik depremleri görüntüleyebilir

### Bileşenler
- **EarthquakeCard**: Deprem bilgilerini gösteren kart bileşeni
- **EarthquakeMap**: Leaflet kullanarak depremleri harita üzerinde gösteren bileşen
- **LocationFilter**: İl bazlı filtreleme için bileşen

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak isterseniz:

1. Bu repo'yu fork edin
2. Kendi branch'inizi oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin ozellik/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Önemli Not

Bu uygulama sadece bilgilendirme amaçlıdır. Acil durumlarda resmi kaynaklara ve yetkililere başvurun. AFAD'ın resmi web sitesi: [https://deprem.afad.gov.tr](https://deprem.afad.gov.tr)
