# ⚡ Antigravity Job Autopilot (100% Free Automation Suite)

An end-to-end, fully automated job hunting and interview generation platform built for **Google Antigravity**. It scans multiple free job boards in real-time, optimizes and fixes your ATS resume score to **90%+**, uncovers recruiter email patterns and contact intel, drafts high-converting cold outreach pitches, and provides a 1-click application autofill assistant.

**Cost: $0.00 (Zero paid APIs, zero subscriptions).**

---

## 🌟 Key Capabilities

| Feature | Description | Cost / Service |
| :--- | :--- | :--- |
| **🧭 Real-Time Job Radar** | Aggregates hundreds of live tech, full-stack, frontend, and backend jobs. Filter by role, keywords, location, and remote-only. | **100% Free** (Arbeitnow API, RemoteOK API, Jobicy API) |
| **🎯 ATS Score Fixer & AI Tailoring** | Analyzes your resume against any target job description. Detects missing keywords, calculates ATS score (0-100%), and rewrites experience bullets in STAR format. | **100% Free** (Built-in Offline NLP + Google Gemini 1.5 Flash Free Tier) |
| **🕵️ Recruiter Intel Finder** | Extracts company domains and generates high-probability email patterns (`recruiting@`, `talent@`, `{first}.{last}@`). Generates instant 1-click LinkedIn and Google Dorks. | **100% Free** |
| **✉️ Cold Email Outreach Studio** | Generates tailored outreach pitches using 4 proven, high-conversion templates. Dispatches emails directly through your personal Gmail with zero spam flags. | **100% Free** (Gmail SMTP via Google App Passwords) |
| **⚡ 1-Click Application Autofill** | Drag-and-drop browser bookmarklet that instantly fills all personal, contact, portfolio, and cover letter fields on Greenhouse, Lever, Workday, etc. | **100% Free** (Native JavaScript Bookmarklet) |
| **📊 Kanban Pipeline Tracker** | Visual drag-and-drop tracker to monitor jobs across stages: `Saved` ➔ `ATS Tailored` ➔ `Applied` ➔ `Interviewing` ➔ `Offer`. | **100% Free** (Local JSON/SQLite Store) |
| **🤖 Antigravity CLI & Skill** | Chat-based triggers directly from Antigravity IDE or terminal via `.agents/skills/job-autopilot`. | **100% Free** |

---

## 🚀 Quick Start (Running in 30 Seconds)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mohdsaif13/antigravity-job-autopilot.git
cd antigravity-job-autopilot
npm install
```

### 2. Launch the Web Dashboard
```bash
npm start
```
Open **[http://localhost:3030](http://localhost:3030)** in your browser to access the modern dark-mode dashboard.

### 3. Or Run from the Command Line (CLI)
```bash
# Search live remote jobs:
node scripts/run_job_search.js search "Full Stack" --remote

# Uncover recruiter emails & Google search links for any company:
node scripts/run_job_search.js recruiter "Stripe" "Backend Engineer"

# Calculate ATS match score between resume and job description:
node scripts/run_job_search.js ats my_resume.txt job_desc.txt
```

---

## 📖 Step-by-Step Setup Guide (100% Free Tier)

### Step 1: Candidate Profile Setup
1. Go to **Tab 5 ("Profile & Free Setup")** in the web dashboard.
2. Fill in your name, email, phone, target job titles, core skills, LinkedIn, GitHub, and top achievement.
3. Click **"Save Profile & Settings"**.

### Step 2: Google Gemini AI (Optional - 100% Free Tier)
*Note: The platform includes a powerful offline NLP engine that works with $0 and 0 keys. If you want neural AI rewriting, Google AI Studio provides 1,500 requests per day for free.*
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and sign in with your Google account.
2. Click **"Create API Key"** and copy your free key.
3. Paste it into the **"Gemini API Key"** field in Tab 5.

### Step 3: Free Gmail Direct SMTP Delivery
Send cold outreach directly from your Gmail address:
1. Ensure **2-Step Verification** is enabled on your Google account.
2. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create a new App Password (name it `Antigravity Job Hunter`).
4. Copy the generated 16-character code (e.g., `abcd efgh ijkl mnop`).
5. Enter your Gmail address and the 16-character code in Tab 5.

### Step 4: Using the 1-Click Application Autofill Assistant
1. Click the **"⚡ 1-Click Autofill"** button in the top navigation bar.
2. Drag the **"Auto-Apply Helper"** button directly to your browser's bookmarks bar.
3. Whenever you open a job application on Greenhouse (`boards.greenhouse.io`), Lever (`jobs.lever.co`), or company portals, simply click the bookmark to fill all your details in 1 second!

---

## 🎯 How to Maximize Job Interviews (Pro Strategy)

1. **Never Apply with a Generic Resume**:
   - In Tab 1, pick a job and click **"🎯 ATS Match"**.
   - Check the **Missing Keywords** chips (red pills).
   - Click **"✨ Fix & Tailor Resume"** to automatically insert missing keywords and generate STAR bullet points with quantifiable metrics until your score hits **90%+**.
   - Copy or download the optimized resume.

2. **Reach Out to the Recruiter Before Applying**:
   - In Tab 1, click **"✉️ Cold Email"** for that job.
   - Click the LinkedIn search link to view the Technical Recruiters and Engineering Managers at that company.
   - Select the **"Direct Hiring Manager Pitch"** template.
   - Click **"Send via Free Gmail SMTP"** or **"Open in Mail App"**.
   - *Candidates who combine an ATS-optimized application with a direct recruiter email have a 3x higher interview rate.*

3. **Track Every Stage**:
   - In Tab 4, monitor your pipeline. As soon as you receive an interview invitation, move the card to **"Interviewing"** to stay organized.

---

## 🤖 Google Antigravity Customization

This project includes a native Antigravity skill in `.agents/skills/job-autopilot/SKILL.md` and rules in `.agents/rules/job-autopilot.md`.

You can ask Antigravity in the IDE:
> *"Search all remote Python jobs and find recruiter emails for the top 3 companies."*
> *"Analyze my resume against this job posting and tell me what keywords I am missing."*
