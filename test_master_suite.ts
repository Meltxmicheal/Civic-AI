import { searchLocationOSM, reverseGeocodeOSM, createCircleGeoJSON } from "./src/services/mapService.ts"
import { checkForDuplicateIssues } from "./src/services/duplicateDetectionService.ts"
import { determineDepartmentRouting } from "./src/services/routingService.ts"
import { civicIssueService } from "./src/services/civicIssueService.ts"
import { analyzeCivicImage } from "./src/ai/pipeline.ts"
import { CivicCategoryEnum } from "./src/ai/types.ts"

async function runMasterTestSuite() {
  console.log("=================================================================")
  console.log(" CIVICAI MASTER PLATFORM VALIDATION & GEOSPATIAL TEST SUITE ")
  console.log("=================================================================\n")

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName} ${detail ? `(${detail})` : ""}`)
      passed++
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `[${detail}]` : ""}`)
      failed++
    }
  }

  // --- 1. OpenStreetMap Geocoding & Pan-India Reverse Geocoding ---
  console.log("--- 1. Testing OpenStreetMap Nominatim & Geocoding ---")
  const velloreSearch = await searchLocationOSM("Katpadi")
  assert(velloreSearch.length > 0, "Location search returns results for Katpadi", `Found ${velloreSearch.length} results`)

  const adminChennai = await reverseGeocodeOSM(13.0382, 80.2497)
  assert(adminChennai.country === "India", "Reverse geocode identifies Country as India")
  assert(adminChennai.state === "Tamil Nadu", "Reverse geocode identifies State as Tamil Nadu")
  assert(
    adminChennai.district.toLowerCase().includes("chennai") ||
      adminChennai.formattedAddress.toLowerCase().includes("chennai"),
    "Reverse geocode identifies District as Chennai",
    adminChennai.district
  )

  const adminVellore = await reverseGeocodeOSM(12.9698, 79.1378)
  assert(
    adminVellore.district.toLowerCase().includes("vellore") ||
      adminVellore.district.includes("வேலூர்") ||
      adminVellore.formattedAddress.toLowerCase().includes("vellore") ||
      adminVellore.formattedAddress.includes("வேலூர்"),
    "Reverse geocode identifies Vellore District",
    adminVellore.district
  )

  // --- 2. Accuracy & Nearby Search Radius Circle GeoJSON ---
  console.log("\n--- 2. Testing Accuracy & Radius GeoJSON Polygons ---")
  const circle100m = createCircleGeoJSON(80.2497, 13.0382, 100)
  assert(circle100m.type === "Feature", "Circle GeoJSON is valid Feature")
  assert(circle100m.geometry.type === "Polygon", "Circle geometry is Polygon")
  assert(circle100m.geometry.coordinates[0].length >= 64, "Circle polygon has 64 interpolated vertices")

  // --- 3. 100-Meter Duplicate Detection Engine ---
  console.log("\n--- 3. Testing 100-Meter Geospatial Duplicate Detection ---")
  // Case A: Near existing Teynampet pothole (13.0382, 80.2497) with road category
  const dupCheckSame = await checkForDuplicateIssues({
    lat: 13.0384, // ~25 meters away
    lng: 80.2498,
    category: "road",
    title: "Big pothole on main road",
    radiusMeters: 100,
  })
  assert(dupCheckSame.isDuplicateFound === true, "Identifies nearby pothole as duplicate within 100m", `Distance: ${dupCheckSame.distanceMeters}m`)

  // Case B: Same location but completely different category (e.g. streetlight)
  const dupCheckDiff = await checkForDuplicateIssues({
    lat: 13.0384,
    lng: 80.2498,
    category: "streetlight",
    title: "Broken streetlight lamp post",
    radiusMeters: 100,
  })
  assert(dupCheckDiff.isDuplicateFound === false || dupCheckDiff.matchConfidence < 60, "Different category at same location is not auto-duplicate")

  // Case C: Same category but far away (>500m away)
  const dupCheckFar = await checkForDuplicateIssues({
    lat: 13.0900, // ~6 km away
    lng: 80.2700,
    category: "road",
    title: "Pothole in North Chennai",
    radiusMeters: 100,
  })
  assert(dupCheckFar.isDuplicateFound === false, "Distant issue (>100m) is not flagged as duplicate")

  // --- 4. Pan-India Location-Aware Department Routing Engine ---
  console.log("\n--- 4. Testing Location-Aware Department Routing Engine ---")
  // Route A: Chennai Road
  const routeChennaiRoad = determineDepartmentRouting({
    category: "road",
    severity: "high",
    location: { country: "India", state: "Tamil Nadu", district: "Chennai", localBody: "Greater Chennai Corporation" },
  })
  assert(routeChennaiRoad.finalDepartment.includes("Greater Chennai Corporation"), "Routes Chennai road to GCC", routeChennaiRoad.finalDepartment)

  // Route B: Vellore Road
  const routeVelloreRoad = determineDepartmentRouting({
    category: "road",
    severity: "high",
    location: { country: "India", state: "Tamil Nadu", district: "Vellore", localBody: "Vellore City Municipal Corporation", localBodyType: "corporation" },
  })
  assert(routeVelloreRoad.finalDepartment.includes("Vellore"), "Routes Vellore road to Vellore Corporation", routeVelloreRoad.finalDepartment)

  // Route C: Chennai Water (CMWSSB)
  const routeWaterChennai = determineDepartmentRouting({
    category: "water",
    severity: "critical",
    location: { country: "India", state: "Tamil Nadu", district: "Chennai" },
  })
  assert(routeWaterChennai.finalDepartment.includes("CMWSSB"), "Routes Chennai water to CMWSSB", routeWaterChennai.finalDepartment)

  // Route D: Bengaluru Water (BWSSB)
  const routeWaterBlr = determineDepartmentRouting({
    category: "water",
    severity: "critical",
    location: { country: "India", state: "Karnataka", district: "Bengaluru Urban" },
  })
  assert(routeWaterBlr.finalDepartment.includes("BWSSB"), "Routes Bengaluru water to BWSSB", routeWaterBlr.finalDepartment)

  // --- 5. Civic Issue Data Service & MongoDB Operations ---
  console.log("\n--- 5. Testing Civic Issue Data Access Layer ---")
  const allIssues = await civicIssueService.getIssues({ limit: 10 })
  assert(allIssues.length > 0, "Retrieves initial civic issues collection", `Total: ${allIssues.length}`)

  // Test new issue submission
  const created = await civicIssueService.createIssue({
    category: "road",
    title: "Test Pothole Report",
    titleTa: "சோதனை குழி அறிக்கை",
    description: "Automated test complaint verification",
    lat: 12.9698,
    lng: 79.1378,
    state: "Tamil Nadu",
    district: "Vellore",
    localBody: "Vellore City Municipal Corporation",
  })
  assert(!!created.id, "Successfully creates civic issue with tracking ID", created.id)

  // Test upvote
  const upvoted = await civicIssueService.upvoteIssue(created.id)
  assert(upvoted !== null && upvoted.supportersCount >= 2, "Successfully upvotes complaint", `Supporters: ${upvoted?.supportersCount}`)

  // Test comment
  const comment = await civicIssueService.addComment(created.id, "Verification test comment", "QA Bot")
  assert(comment.text.includes("Verification"), "Successfully appends citizen comment", comment.text)

  // Test transparency analytics
  const stats = await civicIssueService.getTransparencyStats()
  assert(stats.total > 0, "Calculates aggregate transparency analytics", `Total: ${stats.total}, Resolved: ${stats.resolved}`)

  // --- 6. Live AI Vision & Smart Title Generation ---
  console.log("\n--- 6. Testing Live AI Vision & Classification ---")
  const samplePhotoUri =
    "data:image/jpeg;base64," +
    Buffer.from(
      "civic-road-asphalt-crack-crater-sample-data-1234567890-extra-sample-data-for-pothole-imagery-testing-purposes-1234567890"
    ).toString("base64")
  const aiResult = await analyzeCivicImage({
    photoDataUri: samplePhotoUri,
    mimeType: "image/jpeg",
    fileSizeBytes: 2048,
    locale: "en",
  })
  if (!aiResult.success) {
    console.error("AI Result Error detail:", aiResult.error)
  }
  assert(aiResult.success === true, "AI Vision pipeline executes successfully", aiResult.error?.message)
  if (aiResult.data) {
    assert(aiResult.data.categoryEnum in CivicCategoryEnum, "AI returns valid category enum", aiResult.data.categoryEnum)
    assert(aiResult.data.smartTitle.length > 0, "AI generates smart title", aiResult.data.smartTitle)
    assert(aiResult.data.smartDescription.length > 0, "AI generates smart description", aiResult.data.smartDescription)
  }

  console.log("\n=================================================================")
  console.log(` MASTER TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`)
  console.log("=================================================================\n")

  if (failed > 0) process.exit(1)
}

runMasterTestSuite().catch((err) => {
  console.error("Master test suite exception:", err)
  process.exit(1)
})
