# TimeTracker Pro

Aplicație de time tracking și management proiecte pentru echipe mici.

## Funcționalități
- ⏱️ Timer start/stop pe proiecte și taskuri
- 👥 Gestionare clienți
- 📁 Proiecte cu culori
- ✅ Taskuri tip Kanban (De făcut / În lucru / Finalizat)
- 📊 Rapoarte cu export Excel
- 👫 Management echipă cu roluri Admin/Membru

## Variabile de mediu necesare pe Vercel
Adaugă aceste variabile în Settings → Environment Variables pe Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://iyrqlykoncdvwxvkkzqq.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=sb_publishable__eykofWOosR_96oIW_fL4Q_zrM1kxMm
```

## Tech Stack
- Next.js 14
- Tailwind CSS
- Supabase (auth + database)
- lucide-react (icons)
- xlsx (export Excel)
