const fs = require('fs');
const content = fs.readFileSync('src/data/citySubreddits.ts', 'utf8');

// Extract all city entries
const regex = /\{\s*subreddit:\s*'([^']+)',\s*city:\s*'([^']+)',\s*country:\s*'([^']+)',\s*latitude:\s*([-\d.]+),\s*longitude:\s*([-\d.]+)\s*\}/g;
const cities = [];
let match;

while ((match = regex.exec(content)) !== null) {
  cities.push({
    subreddit: match[1],
    city: match[2],
    country: match[3],
    latitude: parseFloat(match[4]),
    longitude: parseFloat(match[5])
  });
}

// Find duplicates by coordinates
const coordMap = new Map();
cities.forEach(city => {
  const key = `${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}`;
  if (!coordMap.has(key)) {
    coordMap.set(key, []);
  }
  coordMap.get(key).push(city);
});

// Print duplicates
console.log('Duplicate coordinates found:\n');
let totalDuplicates = 0;
coordMap.forEach((cities, coords) => {
  if (cities.length > 1) {
    console.log(`Location: ${coords}`);
    cities.forEach(c => {
      console.log(`  - r/${c.subreddit} (${c.city}, ${c.country})`);
    });
    console.log();
    totalDuplicates += cities.length - 1;
  }
});

console.log(`Total duplicate entries: ${totalDuplicates}`);
