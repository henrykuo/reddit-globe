/**
 * Script to test all subreddits and identify which ones return 403 errors
 * Run with: node scripts/test-subreddits.js
 */

import { citySubreddits } from '../src/data/citySubreddits.ts';

const PROXY_URL = 'https://corsproxy.io/?';
const DELAY_MS = 1000; // 1 second delay between requests to avoid rate limiting

async function testSubreddit(subreddit) {
  try {
    const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=1`;
    const response = await fetch(
      `${PROXY_URL}${encodeURIComponent(redditUrl)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    return {
      subreddit,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    return {
      subreddit,
      status: 'ERROR',
      ok: false,
      error: error.message,
    };
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllSubreddits() {
  console.log(`Testing ${citySubreddits.length} subreddits...\n`);
  
  const results = {
    success: [],
    forbidden: [],
    notFound: [],
    other: [],
  };

  for (let i = 0; i < citySubreddits.length; i++) {
    const city = citySubreddits[i];
    const result = await testSubreddit(city.subreddit);
    
    // Categorize results
    if (result.ok) {
      results.success.push(result);
      console.log(`✓ [${i + 1}/${citySubreddits.length}] r/${result.subreddit} - OK`);
    } else if (result.status === 403) {
      results.forbidden.push(result);
      console.log(`✗ [${i + 1}/${citySubreddits.length}] r/${result.subreddit} - 403 FORBIDDEN`);
    } else if (result.status === 404) {
      results.notFound.push(result);
      console.log(`✗ [${i + 1}/${citySubreddits.length}] r/${result.subreddit} - 404 NOT FOUND`);
    } else {
      results.other.push(result);
      console.log(`? [${i + 1}/${citySubreddits.length}] r/${result.subreddit} - ${result.status}`);
    }

    // Delay to avoid rate limiting
    if (i < citySubreddits.length - 1) {
      await delay(DELAY_MS);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Success: ${results.success.length}`);
  console.log(`✗ 403 Forbidden: ${results.forbidden.length}`);
  console.log(`✗ 404 Not Found: ${results.notFound.length}`);
  console.log(`? Other errors: ${results.other.length}`);
  console.log('='.repeat(60));

  // Print subreddits to remove
  if (results.forbidden.length > 0) {
    console.log('\n403 FORBIDDEN SUBREDDITS TO REMOVE:');
    console.log('='.repeat(60));
    results.forbidden.forEach(r => {
      console.log(`r/${r.subreddit}`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n404 NOT FOUND SUBREDDITS TO REMOVE:');
    console.log('='.repeat(60));
    results.notFound.forEach(r => {
      console.log(`r/${r.subreddit}`);
    });
  }

  if (results.other.length > 0) {
    console.log('\nOTHER ERRORS:');
    console.log('='.repeat(60));
    results.other.forEach(r => {
      console.log(`r/${r.subreddit} - ${r.status} ${r.error || ''}`);
    });
  }

  return results;
}

// Run the test
testAllSubreddits().catch(console.error);
