import { analyzeCivicImage } from './src/ai/pipeline.ts'
import { classifyIssueCategory } from './src/ai/flows/classify-issue-category.ts'
import { detectIssueSeverity } from './src/ai/flows/detect-issue-severity.ts'
import { routeIssueToDepartment } from './src/ai/flows/route-issue-to-department.ts'
import { generateSmartReportTitle } from './src/ai/flows/generate-smart-report-title.ts'
import { runCivicChatFlow } from './src/ai/flows/chat.ts'
import { CivicCategoryEnum } from './src/ai/types.ts'

async function runTests() {
  console.log('=== CIVICAI IMAGE-FIRST WORKFLOW VALIDATION SUITE ===\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`)
      passed++
    } else {
      console.error(`✗ FAIL: ${testName}`)
      failed++
    }
  }

  // 1. Test classifyIssueCategory Flow
  console.log('--- 1. Testing classifyIssueCategory Flow ---')
  const samplePotholeUri = 'data:image/jpeg;base64,' + Buffer.from('fake-pothole-image-data-sample-string-representing-asphalt-damage-1234567890').toString('base64')
  const classification = await classifyIssueCategory({
    photoDataUri: samplePotholeUri,
    description: 'Road damage near signal',
  })
  assert(classification.categoryEnum in CivicCategoryEnum, 'Classification returns valid CivicCategoryEnum')
  assert(classification.confidence >= 0 && classification.confidence <= 100, `Confidence is valid percentage: ${classification.confidence}%`)
  assert(classification.isCivicIssue === true, 'Detected as a civic issue')
  assert(typeof classification.label === 'string' && classification.label.length > 0, `English label: ${classification.label}`)
  assert(typeof classification.labelTa === 'string' && classification.labelTa.length > 0, `Tamil label: ${classification.labelTa}`)

  // 2. Test detectIssueSeverity Flow
  console.log('\n--- 2. Testing detectIssueSeverity Flow ---')
  const severityResult = await detectIssueSeverity({
    photoDataUri: samplePotholeUri,
    category: CivicCategoryEnum.ROADS,
    description: 'Deep road crater',
  })
  assert(['low', 'medium', 'high', 'critical'].includes(severityResult.severity), `Severity level: ${severityResult.severity}`)
  assert(severityResult.reason.length > 5, `Severity Reason (EN): ${severityResult.reason}`)
  assert(severityResult.reasonTa.length > 5, `Severity Reason (TA): ${severityResult.reasonTa}`)

  // 3. Test routeIssueToDepartment Flow
  console.log('\n--- 3. Testing routeIssueToDepartment Flow ---')
  const routingResult = await routeIssueToDepartment({
    category: CivicCategoryEnum.ROADS,
    severity: severityResult.severity,
  })
  assert(routingResult.suggestedDepartment.includes('Roads'), `Department recommendation: ${routingResult.suggestedDepartment}`)
  assert(routingResult.departmentConfidence >= 80, `Department confidence: ${routingResult.departmentConfidence}%`)

  // 4. Test generateSmartReportTitle Flow
  console.log('\n--- 4. Testing generateSmartReportTitle Flow ---')
  const titleResult = await generateSmartReportTitle({
    category: CivicCategoryEnum.ROADS,
    description: 'Big pothole near Teynampet signal',
  })
  assert(titleResult.title.length > 0, `Generated Title (EN): ${titleResult.title}`)
  assert(titleResult.titleTa.length > 0, `Generated Title (TA): ${titleResult.titleTa}`)

  // 5. Test Chat Flow
  console.log('\n--- 5. Testing runCivicChatFlow ---')
  const chatEn = await runCivicChatFlow({ message: 'How do I report a pothole?', locale: 'en' })
  const chatTa = await runCivicChatFlow({ message: 'புகார் செய்வது எப்படி?', locale: 'ta' })
  assert(chatEn.reply.length > 0, `Chat reply (EN): ${chatEn.reply}`)
  assert(chatTa.reply.length > 0, `Chat reply (TA): ${chatTa.reply}`)

  // 6. Test Combined analyzeCivicImage Pipeline
  console.log('\n--- 6. Testing Full analyzeCivicImage Pipeline ---')
  const pipelineResult = await analyzeCivicImage({
    photoDataUri: samplePotholeUri,
    mimeType: 'image/jpeg',
    fileSizeBytes: 2048,
    description: 'Road damage near signal',
    locale: 'en',
  })
  assert(pipelineResult.success === true, 'Pipeline executed successfully')
  assert(!!pipelineResult.data, 'Pipeline returns complete data payload')
  if (pipelineResult.data) {
    assert(pipelineResult.data.categoryEnum in CivicCategoryEnum, `Pipeline category: ${pipelineResult.data.categoryEnum}`)
    assert(pipelineResult.data.suggestedDepartment.length > 0, `Pipeline suggested department: ${pipelineResult.data.suggestedDepartment}`)
    assert(pipelineResult.data.severity.length > 0, `Pipeline severity: ${pipelineResult.data.severity}`)
  }

  // 7. Test Input Validation Failures
  console.log('\n--- 7. Testing Input Validation Error Handling ---')
  const invalidResult = await analyzeCivicImage({
    photoDataUri: 'invalid-non-base64',
    mimeType: 'image/jpeg',
    fileSizeBytes: 2048,
  })
  assert(invalidResult.success === false, 'Rejects invalid base64 data')
  assert(invalidResult.error?.code === 'invalidImage', `Error code: ${invalidResult.error?.code}`)

  // 8. Test Non-Civic Image Handling
  console.log('\n--- 8. Testing Non-Civic Image Detection ---')
  const nonCivicResult = await analyzeCivicImage({
    photoDataUri: samplePotholeUri,
    mimeType: 'image/jpeg',
    fileSizeBytes: 2048,
    description: 'My pet cat playing with food selfie',
    locale: 'ta',
  })
  assert(nonCivicResult.success === true, 'Handles non-civic input gracefully')
  if (nonCivicResult.data) {
    assert(nonCivicResult.data.isCivicIssue === false, 'Correctly flags isCivicIssue = false')
  }

  console.log(`\n==================================================`)
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`)
  console.log(`==================================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test suite exception:', err)
  process.exit(1)
})
