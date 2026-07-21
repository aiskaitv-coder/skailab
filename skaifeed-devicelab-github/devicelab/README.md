# ΣΚΑΪ Feed — Device Lab (GitHub Actions, zero-install)

Τα tests (iPhone Safari/WebKit, Android Chrome, PWA standalone × smoke + screenshots)
τρέχουν **στο cloud** — τίποτα δεν εγκαθίσταται τοπικά.

## Εγκατάσταση στο repo (μία φορά, μέσα από το github.com)

1. Στο repo → **Add file → Upload files** → σύρε τον φάκελο `devicelab/` → Commit.
2. **Add file → Create new file** → στο όνομα γράψε ακριβώς:
   `.github/workflows/devicelab.yml`
   → κάνε paste το περιεχόμενο του devicelab.yml → Commit.

(Το βήμα 2 γίνεται με Create new file γιατί το drag&drop συχνά «χάνει»
φακέλους που ξεκινούν με τελεία.)

## Χρήση

**Αυτόματα:** σε κάθε push στο main (δηλ. κάθε deploy), το workflow περιμένει
90s το Netlify και μετά τρέχει τα 5 προφίλ πάνω στο live site.

**Χειροκίνητα:** Actions tab → «Device Lab (Safari/Chrome/PWA)» → **Run workflow**
→ (προαιρετικά άλλαξε URL, π.χ. deploy preview) → Run.

## Πού βλέπεις αποτελέσματα

Actions tab → κλικ στο run:
- ✅/❌ ανά test — τα ονόματα λένε τι απέτυχε και σε ποιο προφίλ
  (π.χ. «iphone-safari › 2. Service Worker»)
- Κάτω, **Artifacts**:
  - `screenshots` — 3 shots ανά προφίλ (σύγκρινε iphone-safari vs android-chrome)
  - `playwright-report` — unzip → άνοιξε το index.html
  - `test-results` — videos + trace.zip αποτυχιών. Το trace ανοίγει online
    στο https://trace.playwright.dev (σύρε το trace.zip εκεί — βλέπεις
    timeline, network, console, DOM snapshots ανά βήμα)

## Κόστος

GitHub Free: 2000 λεπτά Actions/μήνα. Κάθε run ≈ 8-10 λεπτά → ~200 runs/μήνα δωρεάν.

## Όρια

Ίδια με το τοπικό lab: πραγματικός Safari ENGINE (πιάνει CSS/JS/layout bugs),
όχι πραγματικό iOS (autoplay policies, scroll feel, PWA lifecycle). Για αυτά:
LambdaTest free real-device spot check.
