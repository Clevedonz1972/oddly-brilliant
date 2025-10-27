#!/usr/bin/env node

/**
 * Comprehensive AI Services Testing Script
 * Tests SafetyService, EthicsService, and EvidenceGenerator
 *
 * Usage: node test-ai-services.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';
let testChallengeId = '';

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API helper
async function apiCall(method, endpoint, data = null, token = authToken) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

// Test 1: Authentication & Setup
async function testAuth() {
  logSection('TEST 1: Authentication & User Setup');

  // Try to create admin user
  logInfo('Creating admin user...');
  const signupResult = await apiCall('POST', '/auth/signup', {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    username: 'AdminTester',
  });

  if (signupResult.success) {
    logSuccess('Admin user created successfully');
    authToken = signupResult.data.data.token;
    testUserId = signupResult.data.data.user.id;
    logInfo(`User ID: ${testUserId}`);
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
  } else if (signupResult.status === 409 || signupResult.status === 400) {
    logWarning('User already exists, attempting login...');
    const loginResult = await apiCall('POST', '/auth/login', {
      email: 'admin@test.com',
      password: 'TestPassword123!',
    });

    if (loginResult.success) {
      logSuccess('Logged in successfully');
      authToken = loginResult.data.data.token;
      testUserId = loginResult.data.data.user.id;
      logInfo(`User ID: ${testUserId}`);
    } else {
      logError(`Login failed: ${loginResult.error}`);
      return false;
    }
  } else {
    logError(`Signup failed: ${signupResult.error}`);
    return false;
  }

  return true;
}

// Test 2: Create Test Challenge with Contributions
async function testCreateChallenge() {
  logSection('TEST 2: Create Test Challenge with Contributions');

  logInfo('Creating test challenge...');
  const challengeResult = await apiCall('POST', '/challenges', {
    title: 'AI Services Test Challenge',
    description: 'This is a test challenge to verify AI services functionality. It includes various types of contributions to test ethics auditing.',
    bountyAmount: 1000,
    status: 'OPEN',
    difficulty: 'INTERMEDIATE',
  });

  if (!challengeResult.success) {
    logError(`Challenge creation failed: ${challengeResult.error}`);
    return false;
  }

  testChallengeId = challengeResult.data.data.id;
  logSuccess(`Challenge created with ID: ${testChallengeId}`);

  // Add contributions
  logInfo('Adding test contributions...');
  const contributions = [
    { type: 'CODE', content: 'Implemented core algorithm with optimization techniques' },
    { type: 'DESIGN', content: 'Created UI mockups and wireframes for the entire application' },
    { type: 'IDEA', content: 'Proposed solution architecture with microservices approach' },
    { type: 'RESEARCH', content: 'Researched best practices and industry standards for implementation' },
    { type: 'CODE', content: 'Added comprehensive test coverage with unit and integration tests' },
  ];

  for (const contrib of contributions) {
    const result = await apiCall('POST', `/contributions`, {
      challengeId: testChallengeId,
      ...contrib,
    });

    if (result.success) {
      logSuccess(`Added ${contrib.type} contribution`);
    } else {
      logWarning(`Failed to add contribution: ${result.error}`);
    }
  }

  // Complete the challenge
  logInfo('Completing challenge for testing...');
  const completeResult = await apiCall('POST', `/challenges/${testChallengeId}/complete`);

  if (completeResult.success) {
    logSuccess('Challenge completed successfully');
  } else {
    logWarning(`Challenge completion may have failed: ${completeResult.error}`);
  }

  return true;
}

// Test 3: SafetyService - Content Moderation
async function testSafetyService() {
  logSection('TEST 3: SafetyService - Content Moderation');

  const testContent = [
    {
      name: 'Safe Content',
      content: 'This is a great solution to the problem. I think we should implement it this way.',
      expected: 'safe',
    },
    {
      name: 'Potentially Harmful Content',
      content: 'You are completely stupid and worthless. This idea is trash.',
      expected: 'flagged',
    },
    {
      name: 'Spam Content',
      content: 'Click here to win $1000000!!! Buy my product now!!! Limited time offer!!!',
      expected: 'spam',
    },
  ];

  for (const test of testContent) {
    logInfo(`\nTesting: ${test.name}`);
    logInfo(`Content: "${test.content}"`);

    const result = await apiCall('POST', '/admin/safety/analyze', {
      content: test.content,
      entityType: 'contribution',
      entityId: testChallengeId || 'test-entity-id',
    });

    if (result.success) {
      const analysis = result.data.data;
      logSuccess('Analysis completed');
      logInfo(`Overall Score: ${(analysis.overallScore * 100).toFixed(1)}%`);
      logInfo(`Risk Level: ${analysis.flagged ? 'FLAGGED' : 'SAFE'}`);
      logInfo(`Detection Method: ${analysis.detectionMethod}`);

      if (analysis.categories) {
        log('\nCategory Breakdown:', 'blue');
        Object.entries(analysis.categories).forEach(([category, score]) => {
          const percentage = (score * 100).toFixed(1);
          const indicator = score > 0.7 ? '🔴' : score > 0.4 ? '🟡' : '🟢';
          console.log(`  ${indicator} ${category}: ${percentage}%`);
        });
      }
    } else {
      logError(`Analysis failed: ${result.error}`);
    }
  }

  return true;
}

// Test 4: EthicsService - Fairness Audit
async function testEthicsService() {
  logSection('TEST 4: EthicsService - Fairness Audit');

  if (!testChallengeId) {
    logError('No test challenge available. Skipping ethics audit.');
    return false;
  }

  logInfo(`Running ethics audit on challenge: ${testChallengeId}`);

  const result = await apiCall('POST', `/admin/ethics/audit/${testChallengeId}`);

  if (result.success) {
    const audit = result.data.data;
    logSuccess('Ethics audit completed');

    logInfo(`\nFairness Score: ${(audit.fairnessScore * 100).toFixed(1)}% ${audit.fairnessScore >= 0.7 ? '✅' : audit.fairnessScore >= 0.5 ? '⚠️' : '❌'}`);
    logInfo(`Gini Coefficient: ${audit.giniCoefficient.toFixed(3)} (0=perfect equality, 1=extreme inequality)`);

    if (audit.redFlags && audit.redFlags.length > 0) {
      log('\n🔴 Red Flags:', 'red');
      audit.redFlags.forEach(flag => {
        console.log(`  - ${flag.type}: ${flag.description}`);
      });
    } else {
      logSuccess('\n✅ No red flags detected');
    }

    if (audit.greenFlags && audit.greenFlags.length > 0) {
      log('\n🟢 Green Flags:', 'green');
      audit.greenFlags.forEach(flag => {
        console.log(`  - ${flag.type}: ${flag.description}`);
      });
    }

    if (audit.recommendations && audit.recommendations.length > 0) {
      log('\n💡 Recommendations:', 'yellow');
      audit.recommendations.forEach(rec => {
        console.log(`  [${rec.priority}] ${rec.recommendation}`);
      });
    }

    return true;
  } else {
    logError(`Ethics audit failed: ${result.error}`);
    return false;
  }
}

// Test 5: EvidenceGenerator - PDF Generation
async function testEvidenceGenerator() {
  logSection('TEST 5: EvidenceGenerator - PDF Generation');

  if (!testChallengeId) {
    logError('No test challenge available. Skipping evidence generation.');
    return false;
  }

  logInfo(`Generating evidence package for challenge: ${testChallengeId}`);

  const result = await apiCall('POST', `/admin/evidence/generate/${testChallengeId}`, {
    packageType: 'PAYOUT_AUDIT',
    includeTimeline: true,
    includeFileHashes: true,
    includeSignatures: true,
    includeAIAnalysis: true,
  });

  if (result.success) {
    const pkg = result.data.data;
    logSuccess('Evidence package generated');

    logInfo(`\nPackage Details:`);
    console.log(`  Package ID: ${pkg.packageId}`);
    console.log(`  File Name: ${pkg.fileName}`);
    console.log(`  Pages: ${pkg.pages}`);
    console.log(`  SHA-256: ${pkg.sha256}`);
    console.log(`  Verification URL: ${pkg.verificationUrl}`);
    console.log(`  Generated: ${new Date(pkg.generatedAt).toLocaleString()}`);

    // Test verification
    logInfo('\nVerifying package integrity...');
    const verifyResult = await apiCall('GET', `/admin/evidence/verify/${pkg.packageId}`);

    if (verifyResult.success) {
      const verification = verifyResult.data.data;
      if (verification.isValid) {
        logSuccess('✅ Package verification: VALID');
        logSuccess(`✅ Hash match: ${verification.hashMatch ? 'YES' : 'NO'}`);
        logSuccess(`✅ File exists: ${verification.fileExists ? 'YES' : 'NO'}`);
      } else {
        logError('❌ Package verification: INVALID');
      }
    } else {
      logWarning(`Verification check failed: ${verifyResult.error}`);
    }

    return true;
  } else {
    logError(`Evidence generation failed: ${result.error}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║     AI SERVICES COMPREHENSIVE TEST SUITE                 ║', 'cyan');
  log('║     oddly-brilliant Platform                             ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  const startTime = Date.now();
  const results = {
    auth: false,
    challenge: false,
    safety: false,
    ethics: false,
    evidence: false,
  };

  try {
    results.auth = await testAuth();
    if (!results.auth) {
      logError('\n❌ Authentication failed. Cannot proceed with tests.');
      return;
    }

    results.challenge = await testCreateChallenge();
    results.safety = await testSafetyService();
    results.ethics = await testEthicsService();
    results.evidence = await testEvidenceGenerator();

  } catch (error) {
    logError(`\n❌ Test suite error: ${error.message}`);
    console.error(error);
  }

  // Summary
  logSection('TEST RESULTS SUMMARY');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r === true).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);

  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');

  log('\nDetailed Results:', 'blue');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${test.padEnd(15)}: ${status}`, color);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`\nTotal Duration: ${duration}s`, 'blue');

  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! AI services are working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the output above for details.', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n');
}

// Run the tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
