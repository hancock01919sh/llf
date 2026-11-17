# Gemini on Ad Council's Vertex AI (TDD D37)

How Gemini is set up in Ad Council's Google Cloud project, and how to finish or repeat it. Values here are IDs and names, never keys.

| | |
|---|---|
| Project | `iconic-indexer-513915-t1` ("Long-Live-Food", number `889077788394`), Ad Council's org and billing |
| Owners | Cat (Ad Council), Art (ddd) |
| Location | `us`, the US multi-region. Host `aiplatform.us.rep.googleapis.com`. **Never `global`** (no data residency) |
| Model on dev | `gemini-3.8-flash` (`AI_MODEL`) |
| Role | `projects/iconic-indexer-513915-t1/roles/llfGeminiInvoker`: `aiplatform.endpoints.predict` only |
| Service accounts | `llf-gemini-dev`, `llf-gemini-staging`, `llf-gemini-prod` (`@iconic-indexer-513915-t1.iam.gserviceaccount.com`) |
| WIF pool | `llf-aws` (global) |

Use a separate gcloud profile so your default one is untouched:
```sh
gcloud config configurations create adcouncil --no-activate
gcloud auth login --configuration=adcouncil
gcloud config set project iconic-indexer-513915-t1 --configuration=adcouncil
```
The commands below assume `C=--configuration=adcouncil` and `P=iconic-indexer-513915-t1`.

## 1. APIs, role, service accounts (done Nov 6)
```sh
gcloud services enable aiplatform.googleapis.com iam.googleapis.com iamcredentials.googleapis.com \
  sts.googleapis.com apikeys.googleapis.com orgpolicy.googleapis.com $C
gcloud iam roles create llfGeminiInvoker --project=$P --title="LLF Gemini invoker" \
  --permissions=aiplatform.endpoints.predict --stage=GA $C
for e in dev staging prod; do
  gcloud iam service-accounts create llf-gemini-$e --display-name="LLF Find My Tips Gemini ($e)" $C
  gcloud projects add-iam-policy-binding $P --condition=None $C \
    --member=serviceAccount:llf-gemini-$e@$P.iam.gserviceaccount.com \
    --role=projects/$P/roles/llfGeminiInvoker
done
gcloud iam workload-identity-pools create llf-aws --location=global $C
```

## 2. Dev and local: no Vertex key (Nov 12)
Dev (Render) and local keep **ddd's capped Gemini API key** (TDD D25, D33), not Vertex. A Vertex key bound to `llf-gemini-dev` isn't possible: Ad Council's org policy `iam.managed.disableServiceAccountApiKeyCreation` allows service-account keys only for `generativelanguage.googleapis.com`, and changing it needs their org admin. We tried on Nov 12 (`FLOW_APIKEY_SERVICE_ACCOUNT_BINDING_FAILED_PRECONDITION`) and decided it isn't needed: dev only processes test inputs.

`llf-gemini-dev` stays in place, unused, in case we ever test Vertex from dev (with a short-lived token from a developer's own `gcloud` sign-in, not a key).

## 3. Staging and prod: Workload Identity Federation (waits on BD3244-77)
No keys. Each environment's ECS task role signs in to Google with its AWS identity. Needs the AWS account IDs and the web task-role names from James Steele.
```sh
NUM=889077788394
# One provider per AWS account (non-prod, prod).
gcloud iam workload-identity-pools providers create-aws llf-aws-nonprod \
  --workload-identity-pool=llf-aws --location=global --account-id=<NONPROD_ACCOUNT_ID> $C
gcloud iam workload-identity-pools providers create-aws llf-aws-prod \
  --workload-identity-pool=llf-aws --location=global --account-id=<PROD_ACCOUNT_ID> $C
# Only that environment's web task role may act as its service account.
gcloud iam service-accounts add-iam-policy-binding llf-gemini-staging@$P.iam.gserviceaccount.com $C \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/llf-aws/attribute.aws_role/arn:aws:sts::<NONPROD_ACCOUNT_ID>:assumed-role/<STAGING_WEB_TASK_ROLE>"
gcloud iam service-accounts add-iam-policy-binding llf-gemini-prod@$P.iam.gserviceaccount.com $C \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/llf-aws/attribute.aws_role/arn:aws:sts::<PROD_ACCOUNT_ID>:assumed-role/<PROD_WEB_TASK_ROLE>"
# The credential config holds no secret; it goes in the task as a file or env var.
gcloud iam workload-identity-pools create-cred-config \
  projects/$NUM/locations/global/workloadIdentityPools/llf-aws/providers/llf-aws-prod \
  --service-account=llf-gemini-prod@$P.iam.gserviceaccount.com --aws --output-file=gcp-wif-prod.json
```
- **Fargate has no EC2 metadata service.** Google's library can't find AWS credentials on its own there, so the token source (BD3244-87) passes a custom AWS credentials supplier that reads the ECS container credentials, then hands the Google token to the `gemini` adapter's `getAccessToken`.
- Staging and prod set `GEMINI_VERTEX=1`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=us`, and no `GEMINI_API_KEY`.

## 4. Check it works
```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token $C)" -H 'content-type: application/json' \
  "https://aiplatform.us.rep.googleapis.com/v1/projects/$P/locations/us/publishers/google/models/gemini-3.8-flash:generateContent" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Reply with ok."}]}]}'
```
`200` means it works. A new project or newly enabled API can return 404 for a few minutes.

## Still with Ad Council (BD3244-86)
- Billing alerts: set up by Cat (Nov 9). They notify; they don't cap spend.
- The abuse-monitoring logging exemption request to Google, so prompts aren't kept for abuse review.
