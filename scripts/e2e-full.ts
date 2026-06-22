import { chromium } from "playwright"
import { execSync } from "child_process"

const URL = "http://localhost:3022"

function reseed() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
}

async function login(page: any, email: string, password: string) {
  await page.goto(URL)
  await page.click("button:has-text('Log In')")
  await page.waitForSelector("#login-email", { timeout: 5000 })
  await page.fill("#login-email", email)
  await page.fill("#login-password", password)
  await page.click("button[type='submit']")
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  let passed = 0; let failed = 0
  function check(desc: string, ok: boolean) {
    if (ok) { passed++; console.log(`  ✓ ${desc}`) }
    else { failed++; console.log(`  ✗ ${desc}`) }
  }

  // ═══════════════════════════ TEST 1 ═══════════════════════════
  console.log("\n═══ Test 1: Admin — View booking detail via View link ═══")
  reseed()
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p1, "admin@agrimalachina.com", "admin123")
  await p1.waitForURL("**/admin/dashboard", { timeout: 10000 })

  await p1.goto(`${URL}/admin/bookings`)
  await p1.waitForSelector("table", { timeout: 5000 })
  check("Admin bookings page loaded", await p1.textContent("body").then(t => t.includes("All Bookings")))

  const viewLink = p1.locator("a").filter({ hasText: /^View$/ }).first()
  const viewHref = await viewLink.getAttribute("href")
  console.log(`  View link href: ${viewHref}`)
  await viewLink.click()
  await p1.waitForTimeout(2000)
  const detailUrl = p1.url()
  console.log(`  After click URL: ${detailUrl}`)
  const text1 = await p1.textContent("body")
  check("Navigated to booking detail (URL contains /bookings/)", detailUrl.includes("/bookings/"))
  check("Detail page shows Back link", text1.includes("Back"))
  check("DocumentationTimeline renders", text1.includes("Pickup Documentation"))
  await p1.close()

  // ═══════════════════════════ TEST 2 ═══════════════════════════
  console.log("\n═══ Test 2: Admin — buttons and dialogs ═══")
  reseed()
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p2, "admin@agrimalachina.com", "admin123")
  await p2.waitForURL("**/admin/dashboard", { timeout: 10000 })
  await p2.goto(`${URL}/admin/bookings`)
  await p2.waitForSelector("table", { timeout: 5000 })

  let t = await p2.textContent("body")
  check("Status: Waiting for Approval", t.includes("Waiting for Approval"))
  check("Status: Approved — Ready to Start", t.includes("Approved — Ready to Start"))
  check("Status: Ongoing Rental", t.includes("Ongoing Rental"))
  check("Status: Completed", t.includes("Completed"))
  check("Status: Denied", t.includes("Denied"))
  check("Status: Cancelled", t.includes("Cancelled"))
  check("No 'Booking not found'", !t.includes("Booking not found"))

  // Approve a pending booking
  const approveBtn = p2.locator("button:has-text('Approve')").first()
  check("Approve button exists", await approveBtn.count() > 0)
  if (await approveBtn.count() > 0) {
    await approveBtn.click(); await p2.waitForTimeout(2000)
    t = await p2.textContent("body")
    check("No leak after approve", !t.includes("Booking not found"))
    check("Approved status badge increased", t.includes("Approved — Ready to Start"))
  }

  // Doc Pickup dialog
  const dpBtn = p2.locator("button:has-text('Doc Pickup')").first()
  check("Doc Pickup button exists", await dpBtn.count() > 0)
  if (await dpBtn.count() > 0) {
    await dpBtn.click(); await p2.waitForTimeout(1500)
    const dlg = p2.locator("[role='dialog']")
    const dlgVisible = await dlg.isVisible()
    check("Pickup dialog opens", dlgVisible)
    if (dlgVisible) {
      const dText = await dlg.textContent()
      check("Dialog: hour meter field", dText.includes("Hour Meter Reading"))
      check("Dialog: equipment photo field", dText.includes("Equipment Photo"))
      check("Dialog: farmer selfie field", dText.includes("Farmer Selfie"))
      check("Dialog: hour meter photo field", dText.includes("Hour Meter Photo"))
      check("Dialog: cancel button", dText.includes("Cancel"))
      check("Dialog: confirm pickup button", dText.includes("Confirm Pickup"))
    }
    await p2.locator("button:has-text('Cancel')").click(); await p2.waitForTimeout(500)
  }

  // Doc Return dialog
  const drBtn = p2.locator("button:has-text('Doc Return')").first()
  check("Doc Return button exists", await drBtn.count() > 0)
  if (await drBtn.count() > 0) {
    await drBtn.click(); await p2.waitForTimeout(1500)
    const dlg = p2.locator("[role='dialog']")
    check("Return dialog opens", await dlg.isVisible())
    if (await dlg.isVisible()) {
      const dText = await dlg.textContent()
      check("Return: damage checkbox", dText.includes("Equipment has damage"))
      check("Return: confirm button", dText.includes("Confirm Return"))
    }
    await p2.locator("button:has-text('Cancel')").click(); await p2.waitForTimeout(500)
  }
  await p2.close()

  // ═══════════════════════════ TEST 3 ═══════════════════════════
  console.log("\n═══ Test 3: Lender — approve, deny, doc pickup ═══")
  reseed()
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p3, "juan.delacruz@lender.com", "lender123")
  await p3.waitForURL("**/dashboard", { timeout: 10000 })
  await p3.goto(`${URL}/bookings`); await p3.waitForTimeout(2000)

  // Juan has John Deere (pending) and Kubota (approved)
  await p3.locator("a:has-text('John Deere')").first().click(); await p3.waitForTimeout(1500)
  t = await p3.textContent("body")
  check("Lender sees John Deere detail", t.includes("John Deere"))
  check("Lender sees pending Approve button", t.includes("Approve"))
  check("Lender sees pending Deny button", t.includes("Deny"))
  check("Timeline shows Pickup Documentation heading", t.includes("Pickup Documentation"))
  const btn3 = await p3.locator("button").allTextContents()
  check("No Document Pickup yet (still pending)", !btn3.some((b: string) => b.includes("Document Pickup")))

  // Approve
  await p3.locator("button:has-text('Approve')").click(); await p3.waitForTimeout(1500)
  t = await p3.textContent("body")
  check("Booking shows Approved status", t.includes("Approved — Ready to Start"))
  const btn3b = await p3.locator("button").allTextContents()
  check("Document Pickup button appears after approve", btn3b.some((b: string) => b.includes("Document Pickup")))

  // Open pickup dialog
  await p3.locator("button:has-text('Document Pickup')").click(); await p3.waitForTimeout(1000)
  check("Lender pickup dialog opens", await p3.locator("[role='dialog']").isVisible())
  await p3.locator("button:has-text('Cancel')").click(); await p3.waitForTimeout(500)
  await p3.close()

  // ═══════════════════════════ TEST 4 ═══════════════════════════
  console.log("\n═══ Test 4: Farmer — cancel booking ═══")
  reseed()
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p4, "pedro.gonzales@farmer.com", "farmer123")
  await p4.waitForURL("**/dashboard", { timeout: 10000 })
  await p4.goto(`${URL}/bookings`); await p4.waitForTimeout(2000)

  await p4.locator("a:has-text('John Deere')").first().click(); await p4.waitForTimeout(1500)
  t = await p4.textContent("body")
  check("Farmer on John Deere detail", t.includes("John Deere"))
  check("Timeline visible to farmer", t.includes("Pickup Documentation"))
  check("Farmer sees Cancel Booking", t.includes("Cancel Booking"))

  await p4.locator("button:has-text('Cancel Booking')").click()
  await p4.waitForFunction(() => document.body.textContent?.includes("Cancelled"), null, { timeout: 8000 })
  t = await p4.textContent("body")
  check("Cancelled status shown", t.includes("Cancelled"))
  await p4.close()

  // ═══════════════════════════ TEST 5 ═══════════════════════════
  console.log("\n═══ Test 5: Permission — farmer cannot document ═══")
  reseed()
  const p5 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p5, "pedro.gonzales@farmer.com", "farmer123")
  await p5.waitForURL("**/dashboard", { timeout: 10000 })
  await p5.goto(`${URL}/bookings`); await p5.waitForTimeout(2000)

  await p5.locator("a:has-text('Kubota M7060')").first().click(); await p5.waitForTimeout(1500)
  t = await p5.textContent("body")
  const noDocPickup = !t.includes("Document Pickup")
  check("Farmer does NOT see Document Pickup (not owner)", noDocPickup)
  check("Farmer sees Cancel Booking", t.includes("Cancel Booking"))
  await p5.close()

  // ═══════════════════════════ TEST 6 ═══════════════════════════
  console.log("\n═══ Test 6: Admin route protection ═══")
  const p6 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p6, "pedro.gonzales@farmer.com", "farmer123")
  await p6.waitForURL("**/dashboard", { timeout: 10000 })

  await p6.goto(`${URL}/admin/bookings`); await p6.waitForTimeout(2000)
  check("Farmer redirected from /admin/bookings", !p6.url().includes("/admin"))

  await p6.goto(`${URL}/admin/users`); await p6.waitForTimeout(2000)
  check("Farmer redirected from /admin/users", !p6.url().includes("/admin"))

  await p6.goto(`${URL}/admin/machinery`); await p6.waitForTimeout(2000)
  check("Farmer redirected from /admin/machinery", !p6.url().includes("/admin"))
  await p6.close()

  // ═══════════════════════════ TEST 7 ═══════════════════════════
  console.log("\n═══ Test 7: Maria — Document Return for active ═══")
  reseed()
  const p7 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p7, "maria.santos@lender.com", "lender123")
  await p7.waitForURL("**/dashboard", { timeout: 10000 })
  await p7.goto(`${URL}/bookings`); await p7.waitForTimeout(2000)

  await p7.locator("a:has-text('Power Tiller')").first().click(); await p7.waitForTimeout(1500)
  t = await p7.textContent("body")
  check("Maria sees Power Tiller", t.includes("Power Tiller"))
  check("Maria sees Document Return (active booking)", t.includes("Document Return"))

  await p7.locator("button:has-text('Document Return')").click(); await p7.waitForTimeout(1000)
  check("Return dialog for Maria opens", await p7.locator("[role='dialog']").isVisible())
  await p7.locator("button:has-text('Cancel')").click(); await p7.waitForTimeout(500)
  await p7.close()

  // ═══════════════════════════ TEST 8 ═══════════════════════════
  console.log("\n═══ Test 8: All admin pages load ═══")
  reseed()
  const p8 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p8, "admin@agrimalachina.com", "admin123")
  await p8.waitForURL("**/admin/dashboard", { timeout: 10000 })

  await p8.goto(`${URL}/admin/machinery`); await p8.waitForTimeout(2000)
  t = await p8.textContent("body")
  check("Admin machinery page loads", t.includes("John Deere 6120M") || t.includes("All Machinery"))

  await p8.goto(`${URL}/admin/users`); await p8.waitForTimeout(2000)
  t = await p8.textContent("body")
  check("Admin users page loads", t.includes("Admin User") || t.includes("Users"))

  await p8.goto(`${URL}/admin/dashboard`); await p8.waitForTimeout(2000)
  t = await p8.textContent("body")
  check("Admin dashboard loads", t.includes("Dashboard") || t.includes("admin"))

  await p8.close()

  // ═══════════════════════════ RESULTS ═══════════════════════════
  console.log(`\n════════════════════════════════════════`)
  console.log(`E2E Results: ${passed} passed, ${failed} failed`)
  console.log(`════════════════════════════════════════`)
  if (failed > 0) process.exit(1)
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
