# AGENTS.md — Factory Energy Monitoring (Prototype)

คำแนะนำสำหรับ AI agent / ผู้ร่วมพัฒนา ที่ทำงานกับ repo นี้

## ภาพรวมโปรเจกต์

Dashboard prototype หน้าเดียวสำหรับเฝ้าระวังการใช้พลังงานไฟฟ้าในโรงงานแยกตามโซน
ประกอบด้วย summary cards, กราฟแนวโน้มรายชั่วโมง (Chart.js), และตารางสถานะรายโซน

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| [index.html](index.html) | โครงหน้าจอทั้งหมด (cards / chart / table) — โหลดไลบรารีผ่าน CDN |
| [app.js](app.js) | mock data, status logic, render functions, date picker handler |
| [README.md](README.md) | เอกสารโปรเจกต์และวิธีรัน |

ไม่มี build step, ไม่มี package.json — เป็น vanilla JS ล้วน

## วิธีรัน

```sh
python -m http.server 8000
# เปิด http://localhost:8000
```

หรือเปิด index.html ตรง ๆ ในเบราว์เซอร์ก็ได้

## กฎสำคัญ (Scope ของ Prototype)

- **ใช้ mock data เท่านั้น** — ข้อมูลทั้งหมดอยู่ใน `baseZones` ใน app.js
  ห้ามเชื่อม API จริง, database จริง, หรือใส่ API key / credentials ใด ๆ
- **สถานะต้องคำนวณจากตัวเลข ไม่ hardcode** — ผ่าน `getStatus()`:
  Critical = เกิน threshold, Warning = ≥ 80% ของ threshold, Normal = ต่ำกว่านั้น
- **ข้อมูลตามวันที่ต้อง deterministic** — `generateZonesForDate()` ใช้ seeded random
  (เลือกวันเดิมได้ข้อมูลเดิมเสมอ) วันที่ `2026-06-11` (BASE_DATE) ใช้ `baseZones` ตรง ๆ เป็นวัน demo
- **Status badge ใช้ icon + ข้อความ** ไม่ใช้สีอย่างเดียว (accessibility)
- อย่าเพิ่ม feature ใหม่หรือ dependency ใหม่โดยไม่ได้รับการร้องขอ

## Convention

- Styling ใช้ Tailwind CSS 4 + daisyUI 5 ผ่าน CDN (dark theme) — class ใส่ใน HTML ตรง ๆ
- Render functions แยกตามส่วนหน้าจอ: `renderSummary()`, `renderChart()`, `renderZoneTable()`
  และเรียกรวมผ่าน `renderAll()`
- Comment ในโค้ดเป็นภาษาไทยปนอังกฤษได้ ตามสไตล์เดิมของไฟล์

## การตรวจสอบก่อน commit

- เปิดหน้าเว็บแล้วต้องไม่มี error ใน browser console
- เปลี่ยนวันที่ใน date picker แล้ว cards / chart / table ต้องอัปเดตสอดคล้องกันทั้งหมด
- ตาราง Zone Status ต้องเรียง Critical → Warning → Normal
