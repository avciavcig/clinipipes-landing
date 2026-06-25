# clinipipes.com — Sürüm Notları

| Sürüm | Portal eşlemesi | Özet |
|-------|-----------------|------|
| **v2.3** | Clinic-Portal V4.1.1 | V4.1.1 senkron: dayanıklılık pazarlama, admin portal sürüm probe |
| **v2.2** | V4.1.0 | Fiyat/kurulum platform-sync, demo capture |

## v2.3 — Portal V4.1.1 senkron (Haziran 2026)

- Landing admin: canlı portal sürümü (`/internal/platform-info`)
- FAQ & Pro plan: kurulum/teklif yedekleme
- `lib/portal-release.js` + `platform-sync.js` güncellemesi

## Senkron noktaları

| Nerede | Ne |
|--------|-----|
| Portal Süper Admin → Entegrasyon | `Clinic-Portal V4.1.1` + dayanıklılık paneli |
| Landing admin → Dashboard | Portal ↔ Landing senkron kartı |
| API | Portal `GET /internal/platform-info` (webhook imzalı) |
