# Accessible Flashcard App v1 - Final Review & Checklist

An audio-first PWA for English learning, specifically designed for blind users utilizing an Xbox controller.

## ✅ v1 Completion Checklist
These features have been implemented, tested, and deployed at [anki.1dragon.xyz](https://anki.1dragon.xyz).

### 1. Learner Experience (Audio-First)
- [x] **PWA Foundation**: Fullscreen support, offline-ready manifest, and optimized for iPhone Safari.
- [x] **Smart Voice Selection**: Automatically finds "Neural" or "Enhanced" Siri/Google voices for premium sound.
- [x] **FSRS Algorithm**: Spaced repetition tracking logic to optimize long-term memory.
- [x] **Pronoun Modernization**: All interfaces and speech cues use "Bạn" for a professional, general utility feel.
- [x] **Due Filtering**: App only shows cards that are actually due for review.
- [x] **Completed State**: Audio prompt when all daily tasks are finished.

### 2. Multi-Modal Feedback (The "Answer Cue" Feature)
- [x] **Audio Beeps**: High-pitch "Ding" for success, Low-pitch "Buzz" for mistakes (Web Audio API).
- [x] **Vibration Feedback**: Physical haptic rumble on the Xbox controller when a button is pressed.

### 3. Controller & Input
- [x] **Xbox Controller Integration**: Seamless Bluetooth support with connection announcement.
- [x] **Full Input Support**: 
    - **Xbox**: A (Again), B (Good), Y (Repeat).
    - **Keyboard**: A, B, Y keys.
    - **Touch**: Big, clickable on-screen A/B/Y buttons.

### 4. Admin & Data
- [x] **Admin Panel /admin**: Password protected (`learn123`).
- [x] **Card Management**: Add manually or bulk-import via CSV.
- [x] **Preview Mode**: Test TTS voice directly in the admin panel before saving.
- [x] **Cloud Sync**: Persistence powered by Vercel KV (Redis).

---

## 🚀 v2 Backlog (Forward Looking)
*Keeping this here so we don't lose the vision for the next version.*

### High Priority
- [ ] **Custom PWA Icons**: Generate high-premium icons for iPhone Home Screen.
- [ ] **Volume Controls**: On-screen or via controller (D-Pad) to adjust TTS volume independently.
- [ ] **Progress Stats**: A simple "Học được 50 từ/100 từ" audio summary.

### Enhancements
- [ ] **Anki .apkg Import**: Support for native Anki deck files.
- [ ] **Offline Card Cache**: Ensure practice works even if the user goes through a tunnel (Service Workers).
- [ ] **Multiple Decks**: Categorize words by topic (e.g., Food, Travel).

### Technical
- [ ] **Service Worker**: Cache the whole app and TTS voices (where supported).
- [ ] **Login with Google**: For admin panel if we need multi-user support.

---

## 🛠️ Verification for the Family
**URL**: [https://anki.1dragon.xyz](https://anki.1dragon.xyz)
**Siri Lệnh**: "Hey Siri, Học Từ Vựng" → Mở `webapp://anki.1dragon.xyz`
**Tay Cầm**: Bật Bluetooth, app sẽ báo "Đã kết nối" kèm tiếng Bíp.
