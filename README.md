# BEK Agents Platform

Control room for the COD workflow: Store Builder, Product Scout, Creative Swiper, Pricing, Campaign Structure, Gemini Creator and Analyst.

- Static site (HTML, CSS, JS). No build step. Works on GitHub Pages.
- Everything is stored **encrypted** (AES-GCM, PBKDF2 key from your passphrase) in the browser only. Nothing sensitive is ever in this repo. The page has a strict Content-Security-Policy and cannot send data anywhere.
- A **Vault** tab keeps API keys and tokens encrypted. Use **Data → Export encrypted backup** to keep a copy.
- Each agent card has coach notes and a **Copy brief** button that builds the exact prompt to give Claude.
- **Scout board** tracks products through the pipeline and exports/imports CSV (same columns as the Google Sheet).
- **Calculator** tab embeds https://bahakhmeissi.github.io/cod_calculator/ (Mauritania included).

The platform does not launch campaigns. Product choice, creative instructions and launching stay with you.
