# Subreddit Testing Scripts

These scripts help identify which subreddits return 403 (Forbidden) or 404 (Not Found) errors so they can be removed from the dataset.

## Option 1: Browser Console (Recommended)

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. Open the browser's Developer Console (F12 or Cmd+Option+I on Mac)

4. Copy the entire contents of `scripts/test-subreddits-console.js` and paste it into the console

5. Press Enter and wait for the tests to complete (this will take several minutes)

6. The script will output:
   - Real-time progress for each subreddit
   - A summary table at the end
   - A JSON array of subreddits to remove

7. Copy the JSON array of subreddits to remove

## Option 2: Manual Testing

If you prefer to test manually, you can:

1. Run the app and hover over each city marker
2. Note which ones show "Subreddit is private or restricted" errors
3. Manually remove those entries from `src/data/citySubreddits.ts`

## Removing Failed Subreddits

Once you have the list of subreddits to remove:

1. Open `src/data/citySubreddits.ts`
2. Search for each subreddit name in the list
3. Delete the entire line containing that subreddit entry
4. Save the file

## Common Reasons for 403 Errors

- **Private subreddits**: Community is set to private
- **Restricted subreddits**: Community has posting restrictions
- **Banned subreddits**: Community was banned by Reddit
- **Quarantined subreddits**: Community is quarantined

## Notes

- The script includes a 500ms delay between requests to avoid rate limiting
- Testing all ~800 subreddits will take approximately 6-7 minutes
- Results are saved to `window.subredditTestResults` for further inspection
