import { chromium } from "playwright"
import { execSync } from "child_process"

async function main() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  console.log("Seed done")
  const b = await chromium.launch({ headless: true })

  // ======== BUG 2: Owner should not see Request Rental ========
  console.log("\n=== BUG 2: Owner should not see Request Rental ===")
  const p1 = await b.newPage()
  await p1.goto("http://localhost:3022")
  await p1.click("button:has-text('Log In')")
  await p1.waitForSelector("#login-email")
  await p1.fill("#login-email", "juan.delacruz@lender.com")
  await p1.fill("#login-password", "lender123")
  await p1.click("button[type='submit']")
  await p1.waitForURL("**/dashboard", { timeout: 10000 })

  await p1.goto("http://localhost:3022/machinery/"); await p1.waitForTimeout(1500)
  await p1.locator("a:has-text('John Deere')").first().click(); await p1.waitForTimeout(1500)
  const tc = await p1.locator("body").textContent() || ""
  const hasRent = tc.includes("Request Rental")
  console.log(`Juan (owner) sees "Request Rental": ${hasRent}`)
  console.log(hasRent ? "BUG 2: STILL BROKEN - owner sees Request Rental" : "BUG 2: FIXED - owner cannot request own machinery")
  await p1.close()

  // ======== BUG 3: Lender My Machinery ========
  console.log("\n=== BUG 3: Lender My Machinery empty ===")
  const p2 = await b.newPage()
  await p2.goto("http://localhost:3022")
  await p2.click("button:has-text('Log In')")
  await p2.waitForSelector("#login-email")
  await p2.fill("#login-email", "juan.delacruz@lender.com")
  await p2.fill("#login-password", "lender123")
  await p2.click("button[type='submit']")
  await p2.waitForURL("**/dashboard", { timeout: 10000 })

  await p2.goto("http://localhost:3022/machinery/manage"); await p2.waitForTimeout(3000)
  const tc2 = await p2.locator("body").innerText()
  const hasJohn = tc2.includes("John Deere")
  const hasKubota = tc2.includes("Kubota")
  const hasEmpty = tc2.includes("No machinery yet")
  console.log(`Has John Deere: ${hasJohn}`)
  console.log(`Has Kubota: ${hasKubota}`)
  console.log(`No machinery yet: ${hasEmpty}`)
  if (hasJohn && hasKubota) console.log("BUG 3: FIXED - machinery visible")
  else if (hasEmpty) console.log("BUG 3: STILL BROKEN - shows 'No machinery yet'")
  await p2.close()

  // ======== BUG 1: RLS "more than one row" ========
  console.log("\n=== BUG 1: RLS subquery error ===")
  const p3 = await b.newPage()
  await p3.goto("http://localhost:3022")
  await p3.click("button:has-text('Log In')")
  await p3.waitForSelector("#login-email")
  await p3.fill("#login-email", "pedro.gonzales@farmer.com")
  await p3.fill("#login-password", "farmer123")
  await p3.click("button[type='submit']")
  await p3.waitForURL("**/dashboard", { timeout: 10000 })

  await p3.goto("http://localhost:3022/bookings"); await p3.waitForTimeout(1500)
  await p3.locator("a:has-text('John Deere')").first().click(); await p3.waitForTimeout(2000)
  const tc3 = await p3.locator("body").innerText()
  const hasRowError = tc3.includes("more than one row") || tc3.includes("subquery")
  const hasBkNotFound = tc3.includes("Booking not found")
  console.log(`Has RLS error: ${hasRowError}`)
  console.log(`Has 'Booking not found': ${hasBkNotFound}`)
  if (hasRowError) console.log("BUG 1: STILL BROKEN - subquery error persists")
  else if (hasBkNotFound) console.log("BUG 1: PARTIAL - no RLS error but booking not found")
  else if (tc3.includes("John Deere")) console.log("BUG 1: FIXED - booking detail loads correctly")
  await p3.close()

  await b.close()
}
main().catch(console.error)
