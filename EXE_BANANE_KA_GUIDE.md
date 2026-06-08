# Nexus ERP Pro — Windows .exe Installer Banane Ka Guide

## Zaruri Cheezein (Prerequisites)
Pehle ye install karo apne Windows PC par:

1. **Node.js** (v20 ya usse upar)
   - Download: https://nodejs.org/en/download
   - Install karo → Next Next Finish
   - Verify: Command Prompt mein type karo: `node --version`

2. **Git** (optional but recommended)
   - Download: https://git-scm.com/download/win

---

## Step 1 — Project Setup

1. ZIP file ko kisi folder mein extract karo, jaise: `C:\Projects\nexus-erp-pro`
2. Command Prompt (ya PowerShell) kholo **Admin mode mein**
3. Project folder mein jao:
   ```
   cd C:\Projects\nexus-erp-pro
   ```

---

## Step 2 — Dependencies Install Karo

```bash
npm install
```

> Yeh thoda time lagega (2-5 minutes). Internet connection chahiye.
> Agar koi error aaye `better-sqlite3` ke liye, neeche "Common Errors" section dekho.

---

## Step 3 — App Icon Banao (Optional)

- `electron/` folder mein ek `icon.ico` file rakhni hogi (Windows icon)
- Free tool se PNG → ICO convert kar sakte ho: https://convertio.co/png-ico/
- File name bilkul `icon.ico` honi chahiye
- Agar icon nahi rakhna toh `package.json` mein se ye lines hata do:
  ```
  "icon": "electron/icon.ico"
  ```

---

## Step 4 — Build Karo

```bash
npm run build
```

Yeh do kaam karta hai:
- React frontend build karta hai → `dist/` folder
- Server bundle karta hai → `dist/server.cjs`

---

## Step 5 — Electron Installer Banao

```bash
npm run electron:pack
```

> Yeh 5-10 minutes lagta hai. Electron download karega (~100MB) aur installer pack karega.

---

## Step 6 — Installer Ready!

Build complete hone ke baad `release/` folder mein file milegi:

```
release/
  Nexus ERP Pro Setup 1.0.0.exe   ← YEH HAI AAPKA INSTALLER
```

**Is file ko kisi bhi Windows PC par le jao aur install karo!**

---

## Install Karne Ka Tarika (Dusre Computers Par)

1. `Nexus ERP Pro Setup 1.0.0.exe` copy karo USB ya Google Drive se
2. Double-click karo
3. Installation wizard follow karo
4. Desktop shortcut bana dega automatically
5. App khulega — data alag alag computer par alag alag rahega

---

## Gemini AI Feature (Optional)

Agar AI Assistant use karna ho:
1. https://aistudio.google.com/apikey par free API key banao
2. App mein Settings > AI Configuration mein key daalo
3. Bina key ke bhi baaki saari features kaam karengi

---

## Common Errors & Solutions

### Error: `better-sqlite3` prebuild not found
```bash
npm install --ignore-scripts
npm run electron:pack -- --config.asar=false
```

Ya phir:
```bash
npx electron-rebuild -f -w better-sqlite3
```

### Error: `ENOENT icon.ico`
`electron/icon.ico` file nahi hai. Ya toh icon file rakhni hogi ya package.json se icon line hatani hogi.

### Error: `Cannot find module 'vite'`
```bash
npm install vite --save-dev
```

### Error: Permission denied (Windows)
Command Prompt ko **Administrator** mode mein run karo.

---

## Project File Structure (Samajhne Ke Liye)

```
nexus-erp-pro/
├── electron/
│   ├── main.js         ← Electron entry point (app window + server start)
│   ├── preload.js      ← Security bridge
│   └── icon.ico        ← App icon (aapko add karna hoga)
├── src/                ← React frontend code
├── server.ts           ← Express + SQLite backend
├── dist/               ← Build output (auto-generated)
├── release/            ← Final installer (auto-generated)
└── package.json        ← Config
```

---

## Data Kahan Store Hota Hai?

Install karne ke baad data yahan store hota hai:
- **Windows:** `C:\Users\<YourName>\AppData\Roaming\nexus-erp-pro\erp.db`

Har computer ka data alag hota hai. Backup ke liye sirf `erp.db` file copy karo.

---

## Update Kaise Karein?

New version banao:
1. `package.json` mein `"version": "1.0.1"` karo
2. `npm run electron:pack` dobara chalao
3. Naya installer share karo — install karne par purana data safe rahega

---

*Koi dikkat aaye toh full error message copy karke poochhna.*
