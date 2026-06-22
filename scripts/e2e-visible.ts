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
  console.log("Opening visible Chrome browser...")
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  })
  let passed = 0; let failed = 0
  function check(desc: string, ok: boolean) {
    if (ok) { passed++; console.log(`  ✓ ${desc}`) }
    else { failed++; console.log(`  ✗ ${desc}`) }
  }

  console.log("\nSeeding database...")
  reseed()

  // ═══════ ADMIN FLOW ═══════
  console.log("\n═══ ADMIN: Dashboard → Bookings → Approve → Doc Pickup → Doc Return ═══")
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p1, "admin@agrimalachina.com", "admin123")
  await p1.waitForURL("**/admin/dashboard", { timeout: 10000 })
  console.log("  Admin dashboard loaded")

  await p1.goto(`${URL}/admin/bookings`)
  await p1.waitForSelector("table", { timeout: 5000 })
  let t = await p1.textContent("body")
  check("All status badges render", t.includes("Waiting for Approval") && t.includes("Ongoing Rental") && t.includes("Completed"))
  check("No bugs on load", !t.includes("Booking not found"))

  // Click Approve on pending booking
  console.log("  Clicking Approve...")
  await p1.locator("button:has-text('Approve')").first().click()
  await p1.waitForTimeout(1500)
  t = await p1.textContent("body")
  check("No leak after Approve", !t.includes("Booking not found"))

  // Click Doc Pickup
  console.log("  Clicking Doc Pickup...")
  await p1.locator("button:has-text('Doc Pickup')").first().click()
  await p1.waitForTimeout(1000)
  check("Pickup dialog opens", await p1.locator("[role='dialog']").isVisible())
  console.log("  Closing dialog...")
  await p1.locator("button:has-text('Cancel')").click()
  await p1.waitForTimeout(500)

  // Click Doc Return  
  console.log("  Clicking Doc Return...")
  await p1.locator("button:has-text('Doc Return')").first().click()
  await p1.waitForTimeout(1000)
  check("Return dialog opens", await p1.locator("[role='dialog']").isVisible())
  console.log("  Closing dialog...")
  await p1.locator("button:has-text('Cancel')").click()
  await p1.waitForTimeout(500)

  // View booking detail
  console.log("  Clicking View link...")
  await p1.locator("a").filter({ hasText: /^View$/ }).first().click()
  await p1.waitForTimeout(1500)
  check("Admin can view booking detail", p1.url().includes("/bookings/"))
  const td = await p1.textContent("body")
  check("Documentation timeline renders", td.includes("Pickup Documentation"))

  await p1.close()

  // ═══════ LENDER FLOW ═══════
  console.log("\n═══ LENDER: Login → Bookings → Approve → Doc Pickup dialog ═══")
  reseed()
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p2, "juan.delacruz@lender.com", "lender123")
  await p2.waitForURL("**/dashboard", { timeout: 10000 })
  console.log("  Lender dashboard loaded")

  await p2.goto(`${URL}/bookings`); await p2.waitForTimeout(1500)
  console.log("  Clicking John Deere...")
  await p2.locator("a:has-text('John Deere')").first().click()
  await p2.waitForTimeout(1500)
  t = await p2.textContent("body")
  check("Lender sees Approve+Deny (pending)", t.includes("Approve") && t.includes("Deny"))
  check("Timeline shows pending", t.includes("Pickup Documentation"))

  console.log("  Clicking Approve...")
  await p2.locator("button:has-text('Approve')").click()
  await p2.waitForTimeout(1500)
  t = await p2.textContent("body")
  check("Doc Pickup button appears after approve", t.includes("Document Pickup"))

  console.log("  Opening Doc Pickup dialog...")
  await p2.locator("button:has-text('Document Pickup')").click()
  await p2.waitForTimeout(1000)
  check("Pickup dialog visible", await p2.locator("[role='dialog']").isVisible())
  await p2.locator("button:has-text('Cancel')").click(); await p2.waitForTimeout(500)
  await p2.close()

  // ═══════ FARMER FLOW ═══════
  console.log("\n═══ FARMER: Login → Bookings → Cancel ═══")
  reseed()
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p3, "pedro.gonzales@farmer.com", "farmer123")
  await p3.waitForURL("**/dashboard", { timeout: 10000 })
  console.log("  Farmer dashboard loaded")

  await p3.goto(`${URL}/bookings`); await p3.waitForTimeout(1500)
  await p3.locator("a:has-text('John Deere')").first().click(); await p3.waitForTimeout(1500)
  check("Farmer sees Cancel Booking", (await p3.textContent("body")).includes("Cancel Booking"))

  console.log("  Clicking Cancel Booking...")
  await p3.locator("button:has-text('Cancel Booking')").click()
  await p3.waitForTimeout(1500)
  check("Cancelled status shown", (await p3.textContent("body")).includes("Cancelled"))
  await p3.close()

  // ═══════ MARIA: Active booking + Doc Return ═══════
  console.log("\n═══ MARIA (lender): Active booking → Doc Return dialog ═══")
  reseed()
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p4, "maria.santos@lender.com", "lender123")
  await p4.waitForURL("**/dashboard", { timeout: 10000 })
  await p4.goto(`${URL}/bookings`); await p4.waitForTimeout(1500)
  await p4.locator("a:has-text('Power Tiller')").first().click(); await p4.waitForTimeout(1500)
  check("Maria sees Doc Return for active", (await p4.textContent("body")).includes("Document Return"))

  console.log("  Opening Doc Return dialog...")
  await p4.locator("button:has-text('Document Return')").click()
  await p4.waitForTimeout(1000)
  check("Return dialog opens for Maria", await p4.locator("[role='dialog']").isVisible())
  await p4.locator("button:has-text('Cancel')").click(); await p4.waitForTimeout(500)
  await p4.close()

  // ═══════ PERMISSION: Farmer can't document ═══════
  console.log("\n═══ PERMISSION: Farmer cannot document machinery they don't own ═══")
  reseed()
  const p5 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p5, "pedro.gonzales@farmer.com", "farmer123")
  await p5.waitForURL("**/dashboard", { timeout: 10000 })
  await p5.goto(`${URL}/bookings`); await p5.waitForTimeout(1500)
  await p5.locator("a:has-text('Kubota M7060')").first().click(); await p5.waitForTimeout(1500)
  check("Farmer blocked from Document Pickup", !(await p5.textContent("body")).includes("Document Pickup"))
  check("Farmer can still Cancel", (await p5.textContent("body")).includes("Cancel Booking"))
  await p5.close()

  // ═══════ ROUTE PROTECTION ═══════
  console.log("\n═══ SECURITY: Farmer blocked from admin routes ═══")
  const p6 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(p6, "pedro.gonzales@farmer.com", "farmer123")
  await p6.waitForURL("**/dashboard", { timeout: 10000 })

  await p6.goto(`${URL}/admin/bookings`); await p6.waitForTimeout(1500)
  check("Blocked from /admin/bookings", !p6.url().includes("/admin"))
  await p6.goto(`${URL}/admin/users`); await p6.waitForTimeout(1500)
  check("Blocked from /admin/users", !p6.url().includes("/admin"))
  await p6.goto(`${URL}/admin/machinery`); await p6.waitForTimeout(1500)
  check("Blocked from /admin/machinery", !p6.url().includes("/admin"))
  await p6.close()

  // ═══════ RESULTS ═══════
  console.log(`\n════════════════════════════════════════`)
  console.log(`RESULTS: ${passed} passed, ${failed} failed`)
  console.log(`════════════════════════════════════════`)
  console.log(`\nBrowser closing in 5 seconds...`)
  await new Promise(r => setTimeout(r, 5000))
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
