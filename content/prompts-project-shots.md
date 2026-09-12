# Prompts images projets — CX Systems (site web)

**Format conseillé :** 16:9 ou 3:2 · haute résolution · style produit réel  
**Fichiers cibles :** `website/assets/shot-{id}.png`  
**À éviter partout :** purple neon, glassmorphism générique, robots IA, stock smiling people, logos Microsoft/fake brands

---

## Palette par projet

| Projet | Couleurs principales | Ambiance |
|--------|----------------------|----------|
| **FidApp** | `#0B1F2A` navy, `#F07A3A` coral, `#FFE8D6` cream | Retail chaud, QR |
| **Food Group ERP** | `#0F2744` steel, `#3D8B6E` sage, `#E8EEF4` ice | Data / direction |
| **2R Parts** | `#1A1C1E` charcoal, `#E85D04` signal orange, `#C4C8CC` metal | Comptoir atelier |
| **JobGate** | `#121826` ink, `#4F7CAC` steel blue, `#F2F4F7` mist | Studio recrut. |
| **TimeTrack Pro** | `#0D2B24` forest, `#3DDC97` mint, `#E7F5EF` mist | Terrain / GPS |
| **Hospital BI** | `#F7FAFC` clinical, `#0E7490` medical teal, `#334155` slate | Hôpital clean |
| **GestiPro** | `#1C1917` ink, `#B54A2A` copper, `#EBE6DC` paper | Commerce MA |
| **Opti Gest** | `#0C4A6E` optic blue, `#E0F2FE` ice, `#94A3B8` silver | Optique |
| **GPSI** | `#111827` slate, `#F59E0B` amber ticket, `#E5E7EB` panel | Support IT |

---

## 01 — FidApp → `shot-fidapp.png`

```
Product UI hero shot for a Moroccan retail loyalty SaaS named FidApp.
Realistic smartphone + laptop composition on a dark navy desk (#0B1F2A).
Phone shows a clean PWA screen with a large coral QR code (#F07A3A) and visit counter; laptop shows a merchant dashboard with soft cream cards (#FFE8D6) and coral accents.
Shallow depth of field, soft window light from the left, subtle Casablanca café atmosphere in the blurred background (no readable logos).
Professional product photography, cinematic but restrained, 16:9, ultra sharp UI, no people faces, no purple glow, no 3D cartoon icons.
```

---

## 02 — Food Group ERP → `shot-foodgroup-erp.png`

```
Executive BI / ERP workspace visual for a food distribution company data project.
Widescreen monitor on a steel-blue desk (#0F2744) showing a Power BI-like dashboard: sales, stock, finance KPI cards in sage green (#3D8B6E) on an ice-gray canvas (#E8EEF4).
Beside the screen: a thin printed schema sheet with abstract table lines (no real company names).
Cool daylight, corporate photography, serious and clean, 16:9, no cartoons, no neon, no stock handshake photos.
```

---

## 03 — 2R Parts → `shot-2rparts.png`

```
Desktop POS software for an auto-parts counter, product photo style.
Charcoal matte Windows laptop (#1A1C1E) open on a metal workshop counter, screen showing a PyQt-like inventory + checkout UI with signal-orange (#E85D04) primary buttons and metallic gray panels (#C4C8CC).
Blurred shelves of car filters and oil cans in the background (no brands).
Hard practical lighting, documentary product shot, 16:9, realistic UI typography, no people, no glossy startup aesthetic.
```

---

## 04 — JobGate → `shot-jobgate.png`

```
Recruitment video interview platform visual, professional and calm.
Dark ink studio desk (#121826) with a laptop showing a video interview studio UI: candidate frame, record controls, soft steel-blue accents (#4F7CAC) on mist-gray panels (#F2F4F7).
A small webcam LED glows subtly. Abstract waveform line under the video area.
Quiet office photography, 16:9, no purple gradients, no sci-fi holograms, no stock HR stock photos of smiling teams.
```

---

## 05 — TimeTrack Pro → `shot-timetrack.png`

```
B2B field attendance SaaS cover image.
Forest-green backdrop (#0D2B24) with a phone and tablet: phone shows GPS geofence map with mint pins (#3DDC97); tablet shows an HR attendance dashboard on mint mist (#E7F5EF).
Outdoor construction-site soft blur behind (Casablanca light), no logos, no faces.
Documentary product photography, 16:9, crisp UI, natural light, no neon cyber look.
```

---

## 06 — Profiling hospitalier → `shot-hospital.png`

```
Hospital data profiling / BI tool visual.
Clinical white desk (#F7FAFC), laptop showing an anomaly-detection report UI: teal charts (#0E7490), slate text (#334155), Excel-like source panel on the left fading into a clean consolidated dashboard on the right.
Soft hospital corridor light, sterile and precise, 16:9.
No blood, no patients, no medical logos, no cartoon DNA, no purple AI brain.
```

---

## 07 — GestiPro → `shot-gestipro.png`

```
Multi-tenant SaaS for Moroccan shops and restaurants, editorial product shot.
Warm paper desk (#EBE6DC) with a laptop showing a stock + daily ops web app in copper accents (#B54A2A) on ink UI (#1C1917 light mode panels).
A ceramic coffee cup and a paper order ticket beside the laptop (no brands).
Crafted Casablanca commerce mood, 16:9, realistic UI, no generic purple SaaS templates.
```

---

## 08 — Opti Gest → `shot-optigest.png`

```
Desktop app for an optical shop management system named Opti Gest.
MacBook and Windows laptop side by side on a glass desk, screens showing client file + prescription + invoice UI in optic blue (#0C4A6E) and ice (#E0F2FE) with silver UI chrome (#94A3B8).
A pair of eyeglasses rests in the foreground, softly out of focus.
Bright clean retail lighting, premium product photography, 16:9, no people, no fake brand lenses logos.
```

---

## 09 — GPSI → `shot-gpsi.png`

```
Internal IT service desk software visual for asset management and SLA tickets.
Slate dark desk (#111827), ultrawide monitor showing a ticket board with amber priority tags (#F59E0B) and light panel cards (#E5E7EB), inventory list of laptops and monitors on the side.
A closed laptop and ethernet cable in the foreground.
Corporate IT photography, 16:9, realistic UI, no robot mascots, no neon matrix, no purple glow.
```

---

## Prompt commun (à coller à la fin de chaque génération)

```
Style: real product photography for a serious Moroccan software studio portfolio.
Aspect ratio 16:9, 4K, sharp readable UI mock, subtle film grain, no watermarks, no typography outside the UI screens unless specified.
```

## Après génération

1. Renommer en `shot-fidapp.png`, `shot-2rparts.png`, etc.  
2. Placer dans `website/assets/`  
3. Dans l’admin → Projet → Photos, ou mettre à jour `photos` dans `data/store.json` :
   `"photos": ["/assets/shot-xxx.png"]`
