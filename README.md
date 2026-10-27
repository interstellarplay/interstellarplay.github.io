# interstellarplay.com

Website of Interstellar Play, served by GitHub Pages from this repo (`main`).

| Path | What | Edited where |
| --- | --- | --- |
| `/` (`index.html`, `studio-icon.svg`, `og-studio.jpg`) | Studio home: one card per game | here |
| `/dodge-kingdom/` | Dodge Kingdom page | here (`index.html`); `privacy.html` comes from `store/privacy.html` in `interstellarplay/dodge-kingdom` |
| `/beat-my-ghost/` | Beat My Ghost page (moved from `/` on 2026-10-27, links one folder up) | here |
| `/privacy.html`, `/r/`, `/.well-known/`, `/app-ads.txt`, `art.js`, `favicon.svg`, `og.png` | Beat My Ghost: privacy policy, shared-run page, app links | `web/` in `interstellarplay/beat-my-ghost` |
| `/img/<game>/` | Images for the pages (compressed copies of the store art) | here |
| `style.css` | Shared base styles (buttons, cards, footer) | here and in `web/` of Beat My Ghost |

Copy single files from `web/` deliberately: copying the whole folder over the root would put the Beat
My Ghost page back on `/` and drop the studio home and the Dodge Kingdom page.

A new game gets its own folder (`/<game>/index.html` + `privacy.html`), an `img/<game>/` folder and a
card on the studio home.
