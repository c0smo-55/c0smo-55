# CLAUDE.md

GitHub profile README for @c0smo-55. `README.md` is the rendered profile;
`assets/` holds the SVG banner, divider, and project cards; `scripts/build_stats.py`
regenerates stats; `.github/workflows/` runs it.

## Design & animation skills

`.agents/skills/` vendors the [emilkowalski/skills](https://github.com/emilkowalski/skills)
pack, symlinked into `.claude/skills/`. Reach for them **without being asked** on any
design, UI, motion, or SVG work here:

| Skill | Use for |
| --- | --- |
| `animate` | Writing a new animation or transition |
| `review-animations` | Critiquing motion in a diff |
| `improve-animations` | Auditing motion across the repo, producing plans |
| `find-animation-opportunities` | Finding places that should animate |
| `animation-vocabulary` | Naming a motion effect |
| `apple-design` | Fluid/gesture UI, springs, materials, typography |
| `emil-design-eng` | UI polish and component-design judgment |
| `ask-sonner` | Anything involving the Sonner toast library |
| `pick-ui-library` | Choosing a frontend library |
| `prototype` | Exploring several UI directions behind a picker |

Upstream is MIT licensed; the notice is vendored alongside the skills at
`.agents/skills/LICENSE`.

### Local modification

`prototype`, `pick-ui-library`, and `review-animations` ship upstream with
`disable-model-invocation: true`, which limits them to explicit `/skill` invocation.
That line is removed here (and the two descriptions that advertised invoke-only were
reworded) so all ten trigger automatically.

`npx skills update` restores upstream frontmatter and undoes this. After any update,
re-strip `disable-model-invocation` and re-check those descriptions. The stale
`computedHash` entries in `skills-lock.json` for these three are expected — they
reflect the unmodified upstream files.
