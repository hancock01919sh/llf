# Runbook: AWS container images

## Purpose
Build and run the three images that staging and prod run on ECS Fargate (TDD §9.2, D36). This is the contract between this repo and the pipelines and infrastructure in `AdCouncil/ending-wasted-food-ci` and `AdCouncil/ending-wasted-food-infra`.

## Who
James Steele (pipelines, ECS, IAM), with Art for the app side.

## The images
All three build from the repo root for `linux/arm64` (Graviton), run as the non-root `node` user, and take **no secrets at build time**. Each has a `buildspec.yaml` for CodeBuild that pushes to ECR and writes `imageDetail.json`.

| Image | Dockerfile | Buildspec | Port | Health check |
|---|---|---|---|---|
| web (Next.js standalone, SSR + ISR) | `apps/web/Dockerfile` | `apps/web/buildspec.yaml` | 3000 | `GET /healthz` → 200 |
| tool (Find My Tips) | `services/find-my-tips/Dockerfile` | `services/find-my-tips/buildspec.yaml` | 8787 | `GET /api/find-tips/status` → 200 |
| cms (Strapi 5) | `apps/cms/Dockerfile` | `apps/cms/buildspec.yaml` | 1337 | `GET /_health` → 204 |

## Task layout
- **Web service:** one task with two containers, **web** (essential, behind the ALB on 3000) and **tool** (sidecar on 8787, not exposed). Next.js proxies `/api/*` to `TIPS_URL=http://localhost:8787`. When the tool handlers move into Next.js route handlers (BD3244-87, D36), the sidecar goes away and nothing else changes.
- **CMS service:** one task, **cms** on 1337 behind the ALB's CMS host rule (IP allow-list, §5.4).

## Runtime environment
Secrets come from Secrets Manager or SSM through the task definition, never from the image or the repo.

**web**

| Variable | Value |
|---|---|
| `SITE_ENV` | `staging` or `prod` (only `prod` is indexable) |
| `SITE_URL` | The public origin, e.g. `https://longlivefood.org` |
| `CMS_URL` | The CMS origin inside the VPC (reads at runtime, ISR) |
| `CMS_TOKEN` | **Secret.** Read-only Strapi API token |
| `TIPS_URL` | `http://localhost:8787` |
| `NEXT_PUBLIC_GTM_ID` | GTM container, prod only |
| `BASIC_AUTH` | Staging only, `user:pass` (**secret**). Unset in prod |

**tool**

| Variable | Value |
|---|---|
| `AI_PROVIDER`, `AI_MODEL` | `gemini`, `gemini-3.8-flash` |
| `GEMINI_VERTEX`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | Vertex AI in Ad Council's project by Workload Identity Federation, no key (D37, #22) |
| `PROMPT_VERSION` | As in `render.yaml` |
| `CATALOG_URL` | The site's `/data/catalog.json` |
| `TRUSTED_PROXY_HOPS` | Proxies in front that append to `X-Forwarded-For` (CloudFront + ALB) |
| `QUOTA_DAILY_MODEL_CALLS` | Daily cap |

**cms**

| Variable | Value |
|---|---|
| `DATABASE_*` | RDS Postgres (password is a **secret**) |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | **Secrets** |
| `UPLOAD_PROVIDER` | `aws-s3` |
| `UPLOAD_BUCKET`, `AWS_REGION` | The media bucket and its region. The task role needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on it. No AWS keys |
| `MEDIA_BASE_URL` | The media domain (CloudFront, origin access control only) |
| `ADMIN_IP_ALLOWLIST`, `ADMIN_IP_TRUSTED_HOPS` | §5.4. `ADMIN_IP_OPEN` is never set outside dev |
| `DEPLOY_ENV` | `staging` or `prod` |

## Steps: build and run locally
```sh
docker build --platform linux/arm64 -f apps/web/Dockerfile -t llf-web .
docker build --platform linux/arm64 -f services/find-my-tips/Dockerfile -t llf-tool .
docker run --rm -p 8787:8787 llf-tool
docker run --rm -p 3000:3000 -e CMS_FIXTURES=1 -e TIPS_URL=http://host.docker.internal:8787 llf-web
```

## Verification
- `curl -s localhost:3000/healthz` returns 200, and `curl -s localhost:8787/api/find-tips/status` returns 200.
- `docker run --rm llf-web id -u` is not `0`.

## Escalation
Art → James Steele (AWS). Secrets: [rotate-secrets](./rotate-secrets.md).
