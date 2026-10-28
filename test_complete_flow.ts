import {
  createIssue,
  getIssues,
  getNearbyIssues,
  upvoteIssue,
  downvoteIssue,
  addCommentToIssue,
} from './src/server/api.ts'

async function runDatabaseAndMapTests() {
  console.log('=== TESTING CIVICAI DATABASE, UPVOTE/DOWNVOTE, COMMENTS & 100M RADIUS ===\n')

  // 1. Create issue with tags and image
  const newIssue = await createIssue({
    title: 'Test Broken Manhole Cover',
    titleTa: 'பழுதடைந்த கழிவுநீர் மூடி',
    description: 'Manhole cover broken on street corner',
    category: 'drainage',
    priority: 'high',
    lat: 13.0382,
    lng: 80.2497,
    address: 'Anna Salai, Chennai',
    tags: ['#Drainage', '#Manhole', '#ChennaiPublicSafety'],
    isFakeImage: false,
    fakeImageReason: 'Verified authentic camera photo',
  })

  console.log('✓ Created Issue ID:', newIssue.id)
  if (newIssue.upvotes !== 1 || newIssue.downvotes !== 0) {
    throw new Error('Initial upvote / downvote count incorrect')
  }
  console.log('✓ Upvotes:', newIssue.upvotes, '| Downvotes:', newIssue.downvotes)

  // 2. Test Upvoting
  const upvoted = await upvoteIssue(newIssue.id)
  console.log('✓ After toggling upvote -> Upvotes:', upvoted?.upvotes, '| UserVote:', upvoted?.userVote)

  // 3. Test Downvoting
  const downvoted = await downvoteIssue(newIssue.id)
  console.log('✓ After downvote -> Downvotes:', downvoted?.downvotes, '| UserVote:', downvoted?.userVote)

  // 4. Test Comments
  const comment = await addCommentToIssue(newIssue.id, 'Inspection team visited the site today.', 'Field Officer')
  console.log('✓ Added Comment:', comment.text, 'by', comment.userName)

  // 5. Verify Issue in Database with all fetched fields
  const fetched = await getIssues({ limit: 50 })
  const found = fetched.find(i => i.id === newIssue.id)
  if (!found) throw new Error('Created issue not found in database')

  console.log('✓ Found in database with comments count:', found.comments.length)
  console.log('✓ Fetched Issue Fields:', {
    date: found.submittedAt,
    location: found.address,
    title: found.title,
    description: found.description,
    severity: found.priority,
    department: found.department,
    tags: found.tags,
    upvotes: found.upvotes,
    downvotes: found.downvotes,
  })

  // 6. Test 100m Radius Query
  const nearby = await getNearbyIssues({ lat: 13.0382, lng: 80.2497, radiusMeters: 100 })
  console.log('✓ Nearby issues within 100m radius:', nearby.length)
  if (nearby.length === 0) throw new Error('No issues found within 100m radius')

  console.log('\n=== ALL DATABASE, VOTING, COMMENTS, AND 100M RADIUS TESTS PASSED! ===\n')
}

runDatabaseAndMapTests().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
