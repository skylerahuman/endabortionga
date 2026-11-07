# Local development and deployment

Repository: `skylerahuman/endabortionga`.
Local working copy: `/home/sky/endabortionga`.

The initial SvelteKit preview source and prepared pipeline were imported from the
previous working copy; deployment now uses only this repository.

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run build
```

Node 22 is used locally and in CI. No secrets are needed to build. Movement accounts,
district registrations/history and communication preferences use SQLite at local
`.data/movement-map.sqlite`; production requires an explicit private persistent
`DATABASE_PATH`. This is separate from the legacy volunteers API's optional Neon
`DATABASE_URL`. See `plans/movement-map-operations.md` and `.env.example`.

Before using the new account APIs on the dev host, apply the persistent-state settings
from `deploy/eag-cicd.nix`: `/var/lib/eag-preview/movement.sqlite`, a private systemd
StateDirectory, and the display environment flags. Source/artifact pushes do not apply
host configuration. Never put account storage inside a versioned release directory.

## Branches

- `dev`: the full existing SvelteKit application at https://dev.endabortionga.org.
- `prd`: production, initially only `deploy/holding/` at https://endabortionga.org.
- `prd` is the default branch. There is no separate main branch.

Production is protected by a required PR, required `build` check and owner-only
update policy. Bootstrap branches were initialized before applying protections.
To reapply the GitHub configuration (Administration: write required), run:

```sh
node deploy/configure-github.mjs
# Only after that command succeeds:
sudo touch /var/lib/eag-deploy-secrets/production-enabled
sudo systemctl start eag-deploy.service
```

That command makes `prd` the default and applies two independent policies: PRs
and the `build` check are mandatory even for administrators, while only the
repository administrator (currently skylerahuman alone) bypasses the restriction
on updating prd. Do not grant other people administrator access. Force pushes and
branch deletion are blocked. No automation merges production PRs. Initial branch
bootstrap precedes protection.

Push work to dev or open a feature PR into dev.
Promote by opening a PR **from dev into prd**.

## Build and deployment

GitHub-hosted runners build on dev/prd pushes and PRs. The required `build` job
checks the production PR source, typechecks Svelte, runs blocking unit tests and
contiguous region coverage validation, builds SvelteKit and smoke-tests its HTTP server,
SQLite aggregate API and unavailable legacy volunteers response. The earlier baseline
typecheck/navigation failures are fixed. Third-party dependency audit findings still
need a separate review. Native dependency scripts run on the GitHub runner while
packaging better-sqlite3; never skip those scripts in the release dependency install.

Push builds upload `site-dev` / `site-prd` artifacts. Production artifacts contain
only the holding page, never the full application. Changing production to the
full site requires an explicit change to the package step, host routing and
reviewed production service configuration, promoted through a dev-to-prd PR.

The VM polls once per minute, selects a successful run of `tests.yml` from this
repository and the exact current branch HEAD, checks the artifact SHA-256 digest,
and safely extracts only regular files/directories. It does not execute package
scripts or artifact deployment scripts. Releases are root-owned and switched by
atomic symlink. Dev runs as the unprivileged eag-preview user with a health check
and automatic rollback on failure. PR builds never deploy.

The PAT is held only in a root-only systemd credential source, never in GitHub
Actions, git, logs or command arguments. The runner never receives VM credentials.
The host puller is installed independently at `/opt/eag-deploy/pull-release.py`;
repository changes do not auto-update it. Host configuration is in
`/home/sky/oci-dev-nixos/eag-cicd.nix` (a snapshot is in `deploy/eag-cicd.nix`).

```sh
sudo systemctl start eag-deploy.service
sudo journalctl -u eag-deploy.service -u eag-preview.service -n 50
sudo systemctl list-timers eag-deploy.timer
```

Current and previous releases are under `/var/lib/eag-releases/{dev,prd}/`.
To roll back manually, stop the deploy timer, atomically point `current` at the
`previous` release, and restart eag-preview for dev. Revert the offending commit
through the normal branch workflow before restarting the timer. Old releases are
retained; monitor disk usage and remove only unreferenced release directories.

## DNS and TLS

Point the apex `A` record to this VM; remove stale `AAAA` records unless IPv6 also
reaches this VM. Ports 80 and 443 must remain reachable. Caddy obtains and renews
TLS certificates automatically once DNS resolves correctly. Cloudflare DNS-only
mode is simplest for initial issuance; use Full (strict) if enabling its proxy.
The existing why.endabortionga.org backend and private admin/data remain untouched.
The dev host now serves this repository instead of the old EAG frontend.

## Credential rotation

Replace `/var/lib/eag-deploy-secrets/github-token` as root (mode 0600), then restart
the deploy service. The token needs repository Contents: read and Actions: read
for polling. Administrative API permissions needed to finish bootstrap are not needed
by the running puller; replace its credential with a least-privilege token when
convenient. Keep the production-enabled marker absent until protections succeed.
