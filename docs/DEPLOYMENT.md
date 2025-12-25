# GCP Deployment Guide

Production deployment guide for deploying the GoTrailhead e-commerce application to GCP using Cloud Run, Cloud SQL, and GitHub Actions.

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [GCP Infrastructure Setup](#gcp-infrastructure-setup)
  - [1. Create GCP Project](#1-create-gcp-project)
  - [2. Enable Required APIs](#2-enable-required-apis)
  - [3. Cloud SQL Instance](#3-cloud-sql-instance)
  - [4. Artifact Registry](#4-artifact-registry)
  - [5. Secret Manager](#5-secret-manager)
  - [6. Service Accounts](#6-service-accounts)
- [Cloud Run Services](#cloud-run-services)
  - [Backend Service](#backend-service)
  - [Frontend Service](#frontend-service)
- [Stripe Webhook Configuration](#stripe-webhook-configuration)
- [GitHub Actions CI/CD Setup](#github-actions-cicd-setup)
  - [Repository Secrets](#repository-secrets)
  - [Workflow Files](#workflow-files)
  - [Update Environment Variables](#update-environment-variables)

---

## Architecture Overview

- **Frontend**: Next.js 15 on Cloud Run
- **Backend**: Go API on Cloud Run
- **Database**: Cloud SQL (MySQL 8.0)
- **Container Registry**: Artifact Registry
- **Secrets Management**: Secret Manager
- **CI/CD**: GitHub Actions
- **Payment**: Stripe Webhooks

---

## Prerequisites

- Google Cloud Platform account with billing enabled
- GitHub repository with appropriate access
- Stripe account for payment processing

---

## GCP Infrastructure Setup

### 1. Create GCP Project

```bash
# Note the PROJECT_ID for later use
gcloud projects create PROJECT_ID --name="GoTrailhead"
gcloud config set project PROJECT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Cloud SQL Instance

**Create MySQL Instance:**
- Instance ID: `gotrailhead-mysql`
- Database Version: MySQL 8.0
- Region: `us-central1` (Tokyo)
- Availability: Single zone
- Network: Enable both Private IP and Public IP

**Create Database:**
```sql
CREATE DATABASE gotrailhead_db CHARACTER SET utf8mb4;
```

**Create User:**
```sql
CREATE USER 'gotrailhead_user'@'%' IDENTIFIED BY 'GENERATED_PASSWORD';
GRANT ALL PRIVILEGES ON gotrailhead_db.* TO 'gotrailhead_user'@'%';
FLUSH PRIVILEGES;
```

**Save for later:**
- Cloud SQL connection name: `PROJECT_ID:REGION:INSTANCE_ID`
- Database user password

### 4. Artifact Registry

```bash
gcloud artifacts repositories create gotrailhead-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="GoTrailhead container images"
```

**Repository path:** `us-central1-docker.pkg.dev/PROJECT_ID/gotrailhead-repo`

### 5. Secret Manager

Create secrets for sensitive configuration:

```bash
# Database password
echo -n "DB_PASSWORD_VALUE" | gcloud secrets create DB_PASSWORD --data-file=-

# JWT secret (generate with: go run generate_secret.go)
echo -n "JWT_SECRET_VALUE" | gcloud secrets create JWT_SECRET --data-file=-

# Stripe secret key
echo -n "STRIPE_SECRET_KEY_VALUE" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-

# Stripe webhook secret (obtain after configuring webhook)
echo -n "STRIPE_WEBHOOK_SECRET_VALUE" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

### 6. Service Accounts

**Create deployment service account:**
```bash
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"
```

**Grant required roles:**
```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL=github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"
```

**Create service account key:**
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=${SA_EMAIL}
```

**Grant runtime permissions to default service account:**
```bash
COMPUTE_SA=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudsql.client"
```

---

## Cloud Run Services

### Backend Service

```bash
gcloud run deploy gotrailhead-backend \
  --image=gcr.io/cloudrun/hello \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DB_USER=gotrailhead_user,DB_NAME=gotrailhead_db,DB_SOCKET_PATH=/cloudsql/CONNECTION_NAME" \
  --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest" \
  --add-cloudsql-instances=CONNECTION_NAME
```

**Note the backend URL** for frontend configuration and Stripe webhook.

### Frontend Service

```bash
gcloud run deploy gotrailhead-frontend \
  --image=gcr.io/cloudrun/hello \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="API_BASE_URL=BACKEND_URL"
```

**Note the frontend URL** for application access.

---

## Stripe Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Create webhook endpoint:
   - **URL**: `BACKEND_URL/api/orders/webhook`
   - **Events**: `checkout.session.completed`
   - **Description**: GoTrailhead Order Processing
3. Copy the **signing secret** and add to Secret Manager:

```bash
echo -n "whsec_..." | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

4. Update backend service to include the webhook secret (if not already added).

---

## GitHub Actions CI/CD Setup

### Repository Secrets

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Value |
|------------|-------|
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project ID |
| `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL connection name |
| `ARTIFACT_REGISTRY_REPO` | Full repository path |
| `GOOGLE_CLOUD_SA_KEY` | Service account JSON key (entire file contents) |
| `CLOUD_RUN_REGION` | `us-central1` |
| `CLOUD_RUN_BACKEND_SERVICE` | `gotrailhead-backend` |
| `CLOUD_RUN_BACKEND_URL` | Backend Cloud Run URL |
| `CLOUD_RUN_FRONTEND_SERVICE` | `gotrailhead-frontend` |
| `CLOUD_RUN_FRONTEND_URL` | Frontend Cloud Run URL |
| `CLOUD_RUN_FRONTEND_DOMAIN` | Frontend domain (without https://) |

### Workflow Files

Ensure the following workflow files exist:
- `.github/workflows/backend-cd.yml`
- `.github/workflows/frontend-cd.yml`

These workflows will automatically:
1. Build Docker images on push to `main`
2. Push images to Artifact Registry
3. Deploy to Cloud Run
4. Run database migrations (backend)

---

### Update Environment Variables

```bash
# Update backend
gcloud run services update gotrailhead-backend \
  --region=us-central1 \
  --update-env-vars=KEY=VALUE

# Update frontend
gcloud run services update gotrailhead-frontend \
  --region=us-central1 \
  --update-env-vars=KEY=VALUE
```
