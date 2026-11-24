# Modu (โมดู): Moduro mascot

Modu คือผู้ช่วยประจำแบรนด์ Moduro ตัวเป็นบล็อกโมดูลสี Volt lime มีบล็อกสี Moduro indigo วางทับมุมบนขวาแบบเดียวกับโลโก้ Step Up ใช้เป็นหน้าตาของผู้ช่วย AI ในผลิตภัณฑ์ ในแชต และบนโซเชียล

## ไฟล์

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `index.html` | Character sheet: โครงสร้าง, 8 อารมณ์, playground, การใช้ในแชต, สี, น้ำเสียง, กฎทำและไม่ทำ |
| `modu.js` | ตัววาด Modu เป็น SVG ใช้ได้ทั้งในเบราว์เซอร์ (`window.Modu`) และ Node (`require('./modu.js')`) |
| `svg/` | SVG สำเร็จรูป: `modu-<อารมณ์>.svg` (ทั้งตัว), `avatar-<อารมณ์>.svg` (เฉพาะหัว), `modu-happy-on-<พื้น>.svg`, `avatar-mini.svg` (16–24 px) |
| `scripts/export.js` | สร้างไฟล์ใน `svg/` ใหม่: `node scripts/export.js` |

## โครงสร้าง (viewBox 200 × 200)

- **ตัว**: บล็อก Volt lime `#B6F23A` 120 × 120 มุมโค้ง 30 (25% ตามกฎโลโก้)
- **เสาสัญญาณ**: บล็อก Moduro indigo `#5B6CFF` 44 × 44 มุมโค้ง 11 วางทับมุมบนขวา มีวงตัดสีพื้น 5 หน่วย
- **แขนขา**: บล็อก Ink `#0E1116` (บนพื้นมืดใช้ Cloud `#F4F6F8`) วางหลังตัว
- **หน้า**: ตาแคปซูล Ink 2 ดวง ปากเส้นเดียว ไม่มีจมูก ไม่มีแก้ม
- **อวตาร**: ครอปเฉพาะหัวที่ viewBox `31 16 168 168`

## อารมณ์

`happy` ยิ้ม · `joy` ดีใจ · `think` กำลังคิด · `focus` ตั้งใจทำงาน · `surprised` ว้าว · `wink` ขยิบตา · `sleepy` พักอยู่ · `oops` อุ๊ปส์

ท่า: `idle` ยืน · `wave` โบกมือ · `cheer` ชูแขน
พื้น: `light` · `dark` · `indigo` · `lime` · `mono`

## ใช้ในโค้ด

```js
const Modu = require('./modu.js');

Modu.svg({ expression: 'think', avatar: true });             // อวตารในแชต
Modu.svg({ expression: 'joy', pose: 'cheer', palette: 'dark' });
Modu.svg({ avatar: true, mini: true });                       // favicon, 16–24 px
Modu.svg({ expression: 'happy', cssVars: true });             // สีตาม CSS variables --modu-body, --modu-limb, --modu-ground ...
```

ตัวเลือก: `expression`, `pose`, `palette`, `colors` (ทับสีบางส่วน), `avatar`, `mini`, `shadow`, `ring`, `mouth`, `cssVars`, `title`

แอนิเมชันใช้ class ใน SVG: `.modu-eyes` (กะพริบ), `.modu-wave-arm` (โบกมือ), `.modu-antenna` (กะพริบตอนคิด), `.modu-dots` (จุดสามจุด) ดูตัวอย่าง CSS ใน `index.html`

## กฎสั้น ๆ

- วงตัดรอบเสาสัญญาณใช้สีเดียวกับพื้นหลังเสมอ
- บนพื้น Lime เปลี่ยนตัวเป็นสีขาว ห้ามวางตัว Lime บนพื้น Lime
- ห้ามยืดสัดส่วน ห้ามเปลี่ยนสีตัว ห้ามตัดเสาสัญญาณออก
- อารมณ์ `oops` ต้องมาคู่กับข้อความที่บอกสาเหตุและวิธีแก้
- Modu ไม่มีเพศ ใช้คำลงท้ายกลาง ๆ เช่น "นะ"

## รอบที่ 2: 4 แนวทางจาก Pinterest

`concepts/` เก็บแบบรอบที่ 2 ที่วาดจากการดูพินมาสคอตบน Pinterest: **A Visor** (หุ่นยนต์ของเล่นหน้าจอเรืองแสง), **B Mochi** (ก้อนนุ่มตาโต), **C Sticker** (การ์ตูนเส้นหนาย้อนยุค), **D Pixel** (เพื่อนพิกเซล 8 บิต)

- `concepts/index.html`: หน้าเปรียบเทียบ 4 แบบ
- `concepts/concepts.js`: `ModuConcepts.draw('visor' | 'mochi' | 'sticker' | 'pixel', { expression, avatar })`
- `concepts/svg/`: ตัวเต็มและอวตาร 4 อารมณ์ของแต่ละแบบ สร้างใหม่ด้วย `node scripts/export-concepts.js`

## รอบที่ 3: Modu Visor แบบ 3D

`visor3d/` คือแบบ Visor ที่ปั้นใหม่เป็นโมเดล 3D (three.js) มี 3 ทรง: **Classic** (ยืนสองขา), **Hover** (ลอยตัว มีวงแหวนไฟ), **Hoodie** (ใส่ฮู้ดสีคราม) และสีหน้าบนจอ 8 แบบ

- `visor3d/index.html`: หน้าแสดงโมเดล 3D แบบหมุนได้ พร้อมภาพนิ่งทุกแบบ
- `visor3d/modu3d.js`: ตัวโมเดล `createViewer(canvas, { variant, expression })` และ `viewer.render({ variant, expression, crop, width, height })` ที่คืนค่าเป็น PNG
- `visor3d/renders/`: PNG พื้นใส ตัวเต็ม 1024 px (`classic.png`, `hover.png`, `hoodie.png`) และครอปหัว 512 px ทุกสีหน้า (`<ทรง>-<สีหน้า>.png`)
- เรนเดอร์ใหม่: `npm install` แล้ว `npm run render`
