#!/usr/bin/env node
/**
 * Antigravity Job Autopilot - CLI Automation Tool
 * Usage:
 *   node scripts/run_job_search.js search <keywords> [--remote]
 *   node scripts/run_job_search.js recruiter <company> <role>
 *   node scripts/run_job_search.js ats <resumePath> <jdPath>
 */

const fs = require('fs');
const path = require('path');
const jobService = require('../services/jobService');
const atsService = require('../services/atsService');
const recruiterService = require('../services/recruiterService');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Antigravity Job Autopilot CLI (100% Free)
Commands:
  search <keywords> [--remote]     Search live jobs across free providers
  recruiter <company> <role>       Discover recruiter emails & search links
  ats <resumeFile> <jdFile>        Calculate ATS score & missing keywords
    `);
    process.exit(0);
  }

  if (command === 'search') {
    const query = args[1] || 'Software Engineer';
    const isRemote = args.includes('--remote');
    console.log(`\n🔍 Searching live jobs for: "${query}" (Remote: ${isRemote})...\n`);
    
    const results = await jobService.searchAllJobs({ query, remoteOnly: isRemote });
    console.log(`✅ Found ${results.totalFound} jobs (Cached: ${results.cachedAt}):\n`);
    
    results.jobs.slice(0, 10).forEach((job, idx) => {
      console.log(`${idx + 1}. [${job.company}] ${job.title}`);
      console.log(`   📍 ${job.location} | 💰 ${job.salary} | 🏷️  ${job.tags.slice(0, 4).join(', ')}`);
      console.log(`   🔗 Apply: ${job.applyUrl || job.url}\n`);
    });
  } else if (command === 'recruiter') {
    const company = args[1];
    const role = args[2] || 'Software Engineer';
    if (!company) {
      console.error('Error: Company name is required.');
      process.exit(1);
    }
    console.log(`\n🕵️ Gathering recruiter intelligence for: ${company} (${role})...\n`);
    const intel = recruiterService.findRecruiterIntel(company, role);
    console.log(`Domain: ${intel.domain}`);
    console.log(`\nPredicted Email Patterns:`);
    intel.emailPatterns.forEach(p => {
      console.log(`  • ${p.email.padEnd(35)} [${p.confidence} confidence - ${p.type}]`);
    });
    console.log(`\nSearch Links:`);
    console.log(`  LinkedIn Recruiters: ${intel.searchLinks.linkedinRecruiterSearch}`);
    console.log(`  Google Dork:         ${intel.searchLinks.googleDorkLinkedin}\n`);
  } else if (command === 'ats') {
    const resumePath = args[1];
    const jdPath = args[2];
    if (!resumePath || !jdPath) {
      console.error('Error: Paths to resume and job description text files are required.');
      process.exit(1);
    }
    const resumeText = fs.readFileSync(path.resolve(resumePath), 'utf8');
    const jdText = fs.readFileSync(path.resolve(jdPath), 'utf8');

    console.log(`\n🎯 Calculating ATS match score...\n`);
    const score = atsService.calculateAtsScore(resumeText, jdText);
    console.log(`=======================================`);
    console.log(`OVERALL ATS SCORE: ${score.overallScore}%`);
    console.log(`=======================================`);
    console.log(`Keyword Match:       ${score.breakdown.keywordMatch} / 45`);
    console.log(`Action Verbs:        ${score.breakdown.actionVerbs} / 15`);
    console.log(`Quantifiable Metrics:${score.breakdown.metrics} / 20`);
    console.log(`Section Structure:   ${score.breakdown.structure} / 10`);
    console.log(`Readability:         ${score.breakdown.readability} / 10`);
    console.log(`\nMatched Keywords (${score.matchedKeywords.length}): ${score.matchedKeywords.join(', ')}`);
    console.log(`\nMissing Keywords (${score.missingKeywords.length}): ${score.missingKeywords.join(', ')}`);
    console.log(`\nRecommendations:`);
    score.recommendations.forEach(r => console.log(`  • ${r}`));
    console.log('');
  }
}

main().catch(err => {
  console.error('CLI execution error:', err.message);
  process.exit(1);
});
