---
name: job-autopilot
description: Autonomous job discovery, ATS resume optimizer, recruiter intelligence finder, and cold email outreach assistant. Activate when the user wants to search jobs, boost resume ATS match score, find recruiter contacts, or automate job applications with 100% free services.
---

# Antigravity Job Autopilot Skill

This skill allows Antigravity to autonomously search jobs, calculate ATS resume match scores, generate tailored STAR experience bullets, discover recruiter email patterns, and draft high-converting cold outreach pitches.

## Available Workflows

### 1. Job Search Aggregator
Run live job queries across Arbeitnow, RemoteOK, and Jobicy (100% Free, no keys required):
```bash
node scripts/run_job_search.js search "<keywords>" [--remote]
```
Example:
```bash
node scripts/run_job_search.js search "Full Stack React" --remote
```

### 2. Recruiter Intelligence & Email Predictor
Predict company recruiter email formats and generate Google Dork / LinkedIn people search links:
```bash
node scripts/run_job_search.js recruiter "<CompanyName>" "<RoleTitle>"
```
Example:
```bash
node scripts/run_job_search.js recruiter "Stripe" "Backend Engineer"
```

### 3. ATS Score & Keyword Matcher
Evaluate a resume against a target job description and extract missing keywords:
```bash
node scripts/run_job_search.js ats <path-to-resume> <path-to-job-description>
```

### 4. Interactive Web Dashboard
Launch the local web server to access the full visual dashboard, live score gauge, and 1-click auto-apply helper:
```bash
npm start
# Opens on http://localhost:3030
```
