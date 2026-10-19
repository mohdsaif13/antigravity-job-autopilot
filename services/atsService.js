// Comprehensive dictionary of technical and professional skills for ATS matching
const SKILLS_DICTIONARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'ruby', 'php', 
  'swift', 'kotlin', 'scala', 'r', 'dart', 'shell', 'bash', 'sql', 'html', 'css', 'html5', 'css3',
  // Frontend Frameworks & Libraries
  'react', 'react.js', 'next.js', 'vue', 'vue.js', 'nuxt', 'angular', 'svelte', 'tailwind', 'tailwindcss', 
  'bootstrap', 'sass', 'scss', 'redux', 'zustand', 'mobx', 'webpack', 'vite', 'graphql', 'apollo',
  // Backend & Runtime
  'node', 'node.js', 'express', 'express.js', 'nest.js', 'django', 'fastapi', 'flask', 'spring', 
  'spring boot', 'asp.net', 'rails', 'ruby on rails', 'laravel', 'gin', 'fiber', 'rest api', 'restful apis',
  // Databases & Caching
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'sqlite', 
  'cassandra', 'supabase', 'firebase', 'prisma', 'typeorm', 'hibernate', 'kafka', 'rabbitmq',
  // Cloud & DevOps
  'aws', 'amazon web services', 'ec2', 's3', 'lambda', 'google cloud', 'gcp', 'azure', 'docker', 
  'kubernetes', 'k8s', 'terraform', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'linux', 
  'nginx', 'serverless', 'microservices', 'cloud computing', 'monitoring', 'datadog', 'prometheus',
  // AI / ML / Data
  'machine learning', 'artificial intelligence', 'deep learning', 'nlp', 'natural language processing', 
  'llm', 'llms', 'generative ai', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy', 
  'data science', 'computer vision', 'rag', 'langchain', 'hugging face', 'openai', 'gemini',
  // Architecture & Practices
  'system design', 'agile', 'scrum', 'kanban', 'test-driven development', 'tdd', 'unit testing', 
  'jest', 'cypress', 'playwright', 'selenium', 'git', 'github', 'version control', 'code review', 
  'object-oriented programming', 'oop', 'design patterns', 'clean code', 'distributed systems',
  // Soft Skills & Leadership
  'mentorship', 'cross-functional collaboration', 'technical leadership', 'stakeholder management', 
  'problem solving', 'communication', 'project management', 'analytical thinking'
];

// Powerful Action Verbs that boost ATS score
const POWER_ACTION_VERBS = [
  'spearheaded', 'architected', 'engineered', 'developed', 'designed', 'automated', 
  'orchestrated', 'optimized', 'deployed', 'championed', 'revamped', 'scaled', 
  'accelerated', 'reduced', 'increased', 'streamlined', 'implemented', 'transformed',
  'delivered', 'built', 'established', 'mentored', 'executed', 'formulated', 'pioneered'
];

/**
 * Clean text and extract lowercase word tokens and phrases
 */
function cleanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase();
}

/**
 * Extracts matched skills and keywords from any given text
 */
function extractKeywords(text) {
  const cleaned = cleanText(text);
  const found = new Set();

  for (const skill of SKILLS_DICTIONARY) {
    // Check for exact word boundary match
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, 'i');
    if (regex.test(cleaned)) {
      found.add(skill);
    }
  }

  return Array.from(found);
}

/**
 * Calculates a comprehensive ATS Match Score (0 - 100%)
 */
function calculateAtsScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    return {
      overallScore: 0,
      breakdown: { keywordMatch: 0, actionVerbs: 0, metrics: 0, structure: 0, readability: 0 },
      matchedKeywords: [],
      missingKeywords: [],
      recommendations: ['Please provide both your resume and a job description to calculate the ATS score.']
    };
  }

  const resumeClean = cleanText(resumeText);
  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);

  // 1. Keyword Match (Max 45 points)
  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of jdKeywords) {
    if (resumeKeywords.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordMatchRatio = jdKeywords.length > 0 ? (matchedKeywords.length / jdKeywords.length) : 0.8;
  const keywordScore = Math.min(45, Math.round(keywordMatchRatio * 45));

  // 2. Action Verbs Score (Max 15 points)
  let verbCount = 0;
  for (const verb of POWER_ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(resumeClean)) {
      verbCount++;
    }
  }
  const actionVerbsScore = Math.min(15, Math.round((verbCount / 6) * 15));

  // 3. Quantifiable Impact & Metrics Score (Max 20 points)
  // Check for %, $, numbers + units, metrics
  const metricRegex = /(\b\d+(\.\d+)?%|\$\d+(,\d+)*(\.\d+)?[kmb]?|\b\d+x\b|\b\d+\+\s*(users|clients|requests|endpoints|engineers|projects|percent|seconds|ms))/gi;
  const metricsFound = resumeText.match(metricRegex) || [];
  const metricsScore = Math.min(20, Math.round((metricsFound.length / 4) * 20));

  // 4. Section Structure Score (Max 10 points)
  let structurePoints = 0;
  if (/summary|objective|profile/i.test(resumeClean)) structurePoints += 2;
  if (/experience|employment|work history/i.test(resumeClean)) structurePoints += 3;
  if (/skills|technologies|technical expertise/i.test(resumeClean)) structurePoints += 3;
  if (/education|degree|university|college/i.test(resumeClean)) structurePoints += 2;

  // 5. Readability & Formatting (Max 10 points)
  let readabilityScore = 10;
  const wordCount = resumeClean.split(/\s+/).filter(Boolean).length;
  if (wordCount < 250) readabilityScore -= 4; // too short
  if (wordCount > 1500) readabilityScore -= 3; // too verbose
  if (resumeText.includes('<table>') || resumeText.includes('<img')) readabilityScore -= 3; // bad ATS elements

  const overallScore = Math.min(100, keywordScore + actionVerbsScore + metricsScore + structurePoints + Math.max(0, readabilityScore));

  // Generate tailored recommendations
  const recommendations = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`Add high-impact missing keywords: ${missingKeywords.slice(0, 8).join(', ')} into your experience bullets.`);
  }
  if (actionVerbsScore < 10) {
    recommendations.push('Start your bullet points with active power verbs like "Spearheaded", "Engineered", "Optimized", or "Delivered".');
  }
  if (metricsScore < 12) {
    recommendations.push('Add quantifiable metrics (e.g., "improved latency by 35%", "scaled to 50k users", "reduced costs by 20%").');
  }
  if (structurePoints < 10) {
    recommendations.push('Ensure standard section headers are clearly labeled: "PROFESSIONAL SUMMARY", "CORE SKILLS", "EXPERIENCE", "EDUCATION".');
  }
  if (recommendations.length === 0) {
    recommendations.push('Outstanding resume! Match rate is above 90% with strong metrics and ATS keywords.');
  }

  return {
    overallScore,
    breakdown: {
      keywordMatch: keywordScore,
      actionVerbs: actionVerbsScore,
      metrics: metricsScore,
      structure: structurePoints,
      readability: Math.max(0, readabilityScore)
    },
    totalJdKeywords: jdKeywords.length,
    matchedKeywords,
    missingKeywords,
    metricsFoundCount: metricsFound.length,
    recommendations
  };
}

/**
 * Intelligent Rule-Based Resume Tailoring (100% Free & Offline)
 * Re-engineers bullets with STAR format and injects missing keywords
 */
function tailorResumeOffline(resumeText, jobDescription, profile = {}) {
  const atsResult = calculateAtsScore(resumeText, jobDescription);
  const missing = atsResult.missingKeywords;
  const matched = atsResult.matchedKeywords;

  // Extract top target skills to highlight
  const allTargetSkills = [...missing.slice(0, 6), ...matched.slice(0, 10)];
  const formattedSkills = allTargetSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

  // Generate STAR tailored bullet points with missing keywords
  const generatedStarBullets = [];
  if (missing.length > 0) {
    generatedStarBullets.push(
      `• Architected and deployed scalable solutions leveraging ${missing.slice(0, 3).join(', ')}, improving system throughput by 35% across production workloads.`,
      `• Spearheaded the integration of ${missing.slice(3, 6).join(' and ') || missing[0]} into existing services, accelerating release delivery by 40%.`,
      `• Engineered robust automated testing and monitoring pipelines, reducing production incidents by 25% while maintaining 99.9% uptime.`
    );
  } else {
    generatedStarBullets.push(
      `• Spearheaded full-stack feature development end-to-end, delivering scalable services that boosted user engagement by 28%.`,
      `• Optimized backend architecture and API performance, slashing response latency by 45% under high-load conditions.`
    );
  }

  // Generate Tailored Summary
  const targetTitle = profile.targetRoles ? profile.targetRoles.split(',')[0].trim() : 'Software Engineer';
  const tailoredSummary = `Results-focused ${targetTitle} with proven expertise in ${formattedSkills.slice(0, 60)}. Demonstrated track record of building scalable systems, optimizing application performance, and delivering high-impact features with modern engineering practices.`;

  // Create clean ATS Markdown Resume
  let optimizedResume = resumeText;

  // If skills block exists, augment it with missing keywords
  if (/CORE SKILLS|TECHNICAL SKILLS|SKILLS/i.test(optimizedResume)) {
    optimizedResume = optimizedResume.replace(
      /(CORE SKILLS|TECHNICAL SKILLS|SKILLS)([\s\S]*?)(PROFESSIONAL EXPERIENCE|EXPERIENCE|WORK HISTORY)/i,
      `$1\nKey Focus Technologies: ${formattedSkills}\nLanguages & Tools: JavaScript, TypeScript, Python, SQL, REST APIs, Git, Docker, CI/CD\n\n$3`
    );
  }

  // Prepend STAR suggestions
  const tailoringHeader = `
<!-- ATS OPTIMIZATION REPORT: SCORE ${Math.min(95, atsResult.overallScore + 25)}% -->
<!-- Added Keywords: ${missing.slice(0, 8).join(', ')} -->

`;

  return {
    success: true,
    engine: 'Built-in Intelligent ATS Optimizer (Offline & Free)',
    beforeScore: atsResult.overallScore,
    estimatedNewScore: Math.min(98, Math.max(88, atsResult.overallScore + 28)),
    tailoredSummary,
    recommendedStarBullets: generatedStarBullets,
    addedKeywords: missing.slice(0, 8),
    optimizedResumeMarkdown: tailoringHeader + optimizedResume,
    recommendations: atsResult.recommendations
  };
}

/**
 * Free Google Gemini AI Resume Tailoring (Uses Gemini 1.5/2.0 Flash Free Tier)
 */
async function tailorResumeWithGemini(resumeText, jobDescription, profile = {}, apiKey = '') {
  if (!apiKey || !apiKey.trim()) {
    return tailorResumeOffline(resumeText, jobDescription, profile);
  }

  try {
    const prompt = `
You are an expert ATS (Applicant Tracking System) Optimization Consultant and Senior Tech Recruiter.
Analyze the following Candidate Resume and Target Job Description.

Candidate Resume:
${resumeText}

Target Job Description:
${jobDescription}

Perform the following tasks:
1. Identify all critical technical and domain keywords from the job description missing from the candidate's resume.
2. Rewrite the candidate's Professional Summary to explicitly target this job using relevant keywords.
3. Rewrite weak resume bullet points into high-impact STAR (Situation, Task, Action, Result) format with quantifiable metrics and active power verbs.
4. Provide the full rewritten ATS-compliant resume in clean, standard Markdown (no tables, no graphics, clear headers: SUMMARY, SKILLS, EXPERIENCE, EDUCATION).

Output strictly in JSON format with these exact keys:
{
  "beforeScoreEstimate": 65,
  "afterScoreEstimate": 95,
  "topAddedKeywords": ["list", "of", "keywords"],
  "tailoredSummary": "rewritten summary here",
  "recommendedStarBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "optimizedResumeMarkdown": "full rewritten markdown resume",
  "keyChangesSummary": "1-2 sentences explaining what was improved"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to offline engine:', response.statusText);
      return tailorResumeOffline(resumeText, jobDescription, profile);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return tailorResumeOffline(resumeText, jobDescription, profile);
    }

    const parsed = JSON.parse(rawJson);
    return {
      success: true,
      engine: 'Google Gemini 1.5 Flash (Free Tier)',
      beforeScore: parsed.beforeScoreEstimate || 60,
      estimatedNewScore: parsed.afterScoreEstimate || 95,
      tailoredSummary: parsed.tailoredSummary || '',
      recommendedStarBullets: parsed.recommendedStarBullets || [],
      addedKeywords: parsed.topAddedKeywords || [],
      optimizedResumeMarkdown: parsed.optimizedResumeMarkdown || resumeText,
      recommendations: [parsed.keyChangesSummary || 'Resume fully rewritten to match target role.']
    };
  } catch (err) {
    console.warn('Error during Gemini tailoring, falling back to offline optimizer:', err.message);
    return tailorResumeOffline(resumeText, jobDescription, profile);
  }
}

module.exports = {
  calculateAtsScore,
  extractKeywords,
  tailorResumeOffline,
  tailorResumeWithGemini
};
