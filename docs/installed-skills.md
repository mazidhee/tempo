# Design skill setup — October 1, 2026

App development remains paused. This setup adds tooling; it does not accept
Phase 1 or start the master build. The app checkpoint is `8881851`.

## Installed globally

These folders live under `C:\Users\USER\.codex\skills` and are available to
Codex on the next turn. Their files are outside this repository.

| Skill name | Public source | Installation |
| --- | --- | --- |
| `frontend-skill` | [OpenAI archive](https://github.com/openai/skills/tree/82d2c5b/skills/.curated/frontend-skill) | Official archived skill at ref `82d2c5b`; installed previously in this session. |
| `frontend-design` | [Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | `skills/frontend-design`, downloaded from public main. |
| `frontend-design-ilm` | [Ilm-Alan](https://github.com/Ilm-Alan/frontend-design) | Root skill, downloaded from public main. Only the frontmatter name was changed to avoid colliding with Anthropic; `UPSTREAM-SKILL.md` preserves the original. |
| `frontend-ui-standards` | [MaxHan7](https://github.com/MaxHan7/frontend-ui-standards-skill) | `frontend-ui-standards`, downloaded from public main. |

GitHub skills were installed with the official skill-installer Python helper,
using `--method download` and no GitHub credential environment variables.
The three new installed SKILL.md files were read. Their aesthetic defaults do
not override the user's explicit master brief or its prescribed Linear design.

## Installed in this project

[Impeccable](https://github.com/pbakaus/impeccable) was installed once with the
specific Codex/project scope requested by the user:

```powershell
npx --yes --ignore-scripts impeccable@4.1.0 install --providers=codex --scope=project --yes
```

- Skill and references: `.agents/skills/impeccable/`.
- Codex edit/stop hook configuration: `.codex/hooks.json`.
- Local Windows engine: `.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe`.
- Installer CLI version: `4.1.0`; installed skill metadata reports `4.3.1`,
  script VERSION reports `4.0.0`, and the engine reports `0.1.5`. These are
  separate upstream version labels, recorded as observed.

The installed SKILL.md and initialization instructions were read. The engine
successfully returned its version. The platform executable is ignored in Git;
the upstream launchers can obtain it again. No app source was changed.

Initialization has not run while development is paused. When the user resumes,
the skill's `init` playbook requires a user answer/approval round before writing
PRODUCT.md. For an actual UI task, follow its context command and matching
playbook. Preserve the master brief and the user's independent-review criteria.

## LobeHub installation awaiting the user's choice

The [requested LobeHub instructions](https://lobehub.com/skills/joaquincampo-codex-skills-frontend-design/skill.md)
were retrieved and read. They require Market client registration before
installation. Registration creates and stores client credentials and can
replace the CLI's saved Market credentials.

The user explicitly required confirmation before credentials or external
service setup, so registration and this installation have not run. A question
offers documented Market registration, a public GitHub alternative, or skipping
this skill. The linked old GitHub repository currently redirects to
`JoaquinCampo/Skills`, whose current main tree does not contain frontend-design;
an alternative would need a verified historical source.

No credentials were used and no Market account/client was configured.
