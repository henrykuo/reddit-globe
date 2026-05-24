/**
 * Copy and paste this into your browser console while the app is running
 * It will test all subreddits and show which ones return 403 errors
 */

(async function testSubreddits() {
  // Import the city data
  const { citySubreddits } = await import('/src/data/citySubreddits.ts');
  
  const PROXY_URL = 'https://corsproxy.io/?';
  const DELAY_MS = 500; // Half second delay to avoid rate limiting
  
  console.log(`🧪 Testing ${citySubreddits.length} subreddits...`);
  console.log('This will take approximately', Math.round(citySubreddits.length * DELAY_MS / 1000 / 60), 'minutes\n');
  
  const results = {
    success: [],
    forbidden: [],
    notFound: [],
    other: []
  };

  for (let i = 0; i < citySubreddits.length; i++) {
    const city = citySubreddits[i];
    
    try {
      const redditUrl = `https://www.reddit.com/r/${city.subreddit}/hot.json?limit=1`;
      const response = await fetch(
        `${PROXY_URL}${encodeURIComponent(redditUrl)}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      const result = {
        subreddit: city.subreddit,
        city: city.city,
        country: city.country,
        status: response.status
      };

      if (response.ok) {
        results.success.push(result);
        console.log(`✅ [${i + 1}/${citySubreddits.length}] r/${city.subreddit}`);
      } else if (response.status === 403) {
        results.forbidden.push(result);
        console.log(`❌ [${i + 1}/${citySubreddits.length}] r/${city.subreddit} - 403 FORBIDDEN`);
      } else if (response.status === 404) {
        results.notFound.push(result);
        console.log(`⚠️  [${i + 1}/${citySubreddits.length}] r/${city.subreddit} - 404 NOT FOUND`);
      } else {
        results.other.push(result);
        console.log(`❓ [${i + 1}/${citySubreddits.length}] r/${city.subreddit} - ${response.status}`);
      }
    } catch (error) {
      results.other.push({
        subreddit: city.subreddit,
        city: city.city,
        country: city.country,
        error: error.message
      });
      console.log(`❓ [${i + 1}/${citySubreddits.length}] r/${city.subreddit} - ERROR: ${error.message}`);
    }

    // Delay between requests
    if (i < citySubreddits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ 403 Forbidden: ${results.forbidden.length}`);
  console.log(`⚠️  404 Not Found: ${results.notFound.length}`);
  console.log(`❓ Other errors: ${results.other.length}`);
  console.log('='.repeat(80));

  // Print detailed lists
  if (results.forbidden.length > 0) {
    console.log('\n❌ 403 FORBIDDEN SUBREDDITS:');
    console.table(results.forbidden);
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  404 NOT FOUND SUBREDDITS:');
    console.table(results.notFound);
  }

  if (results.other.length > 0) {
    console.log('\n❓ OTHER ERRORS:');
    console.table(results.other);
  }

  // Generate list of subreddits to remove
  const toRemove = [...results.forbidden, ...results.notFound];
  if (toRemove.length > 0) {
    console.log('\n🗑️  SUBREDDITS TO REMOVE:');
    console.log('Copy this array:');
    console.log(JSON.stringify(toRemove.map(r => r.subreddit), null, 2));
  }

  // Store results globally for further inspection
  window.subredditTestResults = results;
  console.log('\n💾 Results saved to window.subredditTestResults');
  
  return results;
})();
