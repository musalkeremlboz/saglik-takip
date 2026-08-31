# Sağlık Takip — 3 Aylık Program

Musa'nın 1 Eylül – 30 Kasım 2026 programının takip uygulaması.

**Canlı:** https://musalkeremlboz.github.io/saglik-takip/

> ⚠️ **Neden Vercel değil:** Vercel'in yükleme uçları Türkiye ağından engelli
> (8 deploy denemesi aynı noktada asıldı; `vercel.com` 200 dönerken yükleme
> tamamlanmıyor). Yayın GitHub Pages'e alındı, deploy GitHub Actions ile yapılıyor.
> `npm run verify` workflow'da build kapısı — testler düşerse yayına çıkmaz.

## Ne yapar

- **Faz duyarlı günlük plan** — oruç / refeeding / kilo verme fazlarına göre liste otomatik değişir
- **Offline-first** — IndexedDB doğruluk kaynağı; uçak modunda tam çalışır
- **Sabah öz-kontrolü** — EKG olmadığı için 5 maddelik nörolojik + kardiyak tarama
- **Ölçüm ekranı** — kilo, nabız, **nabız ritmi**, tansiyon; eşik aşımında uyarı

## Mimari kararlar (04-Uygulama-Mimarisi.md'den)

| Seçim | Gerekçe |
|---|---|
| Vite + React + TS | Build adımı bir **güvenlik özelliği**: hata build'de yakalanır, telefonda beyaz ekran olmaz |
| IndexedDB kaynak | Ağ olmadan tam işlevsellik, 0 ms etkileşim |
| Program kodda, log DB'de | `src/data/*.ts` düzenlemek migration gerektirmez |
| Streak YOK | Abstinence violation effect — kümülatif sayaç + minimum seviye kullanılıyor |

## Güvenlik kuralları (kodda zorunlu tutuluyor)

`npm run verify` her build öncesi çalışır ve şunları doğrular:

- **B6 ≤ 12 mg/gün** (EFSA UL) — B6 nöropatisi Wernicke'yi taklit eder
- Faz sınırları ve tarih hesapları
- Gün aşırı kalemlerin doğru filtrelenmesi
- Refeeding'de "elektroliti DÜŞÜRME" ve "B Complex'i ARTIRMA" uyarılarının varlığı

## Komutlar

```bash
npm run dev       # geliştirme
npm run verify    # mantık testleri
npm run check     # verify + build (deploy öncesi)
npm run build
vercel deploy --prod --yes
```

## Sonraki aşamalar

3. Supabase replika + outbox flush + sync rozeti
4. Antrenman / uyku / tahlil ekranları
5. Animasyon cilası, View Transitions
6. `.ics` üretimi, bildirimler
