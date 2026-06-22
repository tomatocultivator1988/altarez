import { chromium } from "playwright"
import { execSync } from "child_process"

async function main() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const b = await chromium.launch({ headless: true })
  
  // TEST: Admin clicks View link → what happens?
  console.log("=== TEST A: Admin View link ===")
  const p1 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p1.goto("http://localhost:3022")
  await p1.click("button:has-text('Log In')")
  await p1.waitForSelector("#login-email")
  await p1.fill("#login-email", "admin@agrimalachina.com")
  await p1.fill("#login-password", "admin123")
  await p1.click("button[type='submit']")
  await p1.waitForURL("**/admin/dashboard", { timeout: 10000 })
  
  await p1.goto("http://localhost:3022/admin/bookings")
  await p1.waitForSelector("table")
  
  // Find View link and get href
  const viewLink = p1.locator("a").filter({ hasText: /^View$/ }).first()
  const href = await viewLink.getAttribute("href")
  console.log("View link href:", href)
  
  // Navigate directly to that URL
  await p1.goto(`http://localhost:3022${href}`)
  await p1.waitForTimeout(2000)
  console.log("URL after direct nav:", p1.url())
  const t = await p1.textContent("body")
  console.log("Has Back link:", t.includes("Back"))
  console.log("Has Pickup Documentation:", t.includes("Pickup Documentation"))
  console.log("Has Booking not found:", t.includes("Booking not found"))
  console.log("Has error:", t.includes("error"))
  await p1.close()

  // TEST: Lender approve → Document Pickup button
  console.log("\n=== TEST B: Lender approve flow ===")
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const p2 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p2.goto("http://localhost:3022")
  await p2.click("button:has-text('Log In')")
  await p2.waitForSelector("#login-email")
  await p2.fill("#login-email", "juan.delacruz@lender.com")
  await p2.fill("#login-password", "lender123")
  await p2.click("button[type='submit']")
  await p2.waitForURL("**/dashboard", { timeout: 10000 })
  
  await p2.goto("http://localhost:3022/bookings"); await p2.waitForTimeout(2000)
  await p2.locator("a:has-text('John Deere')").first().click(); await p2.waitForTimeout(1500)
  
  console.log("URL:", p2.url())
  let txt = await p2.textContent("body")
  console.log("Buttons before approve:", JSON.stringify((await p2.locator("button").allTextContents()).filter((x: string) => x.trim())))
  console.log("Approved badge:", txt.includes("Approved — Ready to Start"))
  console.log("Waiting badge:", txt.includes("Waiting for Approval"))
  
  await p2.locator("button:has-text('Approve')").click()
  await p2.waitForTimeout(2500)
  
  console.log("\nURL after approve:", p2.url())
  txt = await p2.textContent("body")
  console.log("Buttons after approve:", JSON.stringify((await p2.locator("button").allTextContents()).filter((x: string) => x.trim())))
  console.log("Approved badge:", txt.includes("Approved — Ready to Start"))
  console.log("Doc Pickup text in page:", txt.includes("Document Pickup"))
  console.log("Pickup Documentation text:", txt.includes("Pickup Documentation"))
  
  // Check what visible buttons exist
  const allBtns = p2.locator("button")
  const cnt = await allBtns.count()
  for (let i = 0; i < cnt; i++) {
    const btn = allBtns.nth(i)
    const txt2 = await btn.textContent()
    const vis = await btn.isVisible()
    if (txt2?.trim()) console.log(`  Button "${txt2.trim()}" visible=${vis}`)
  }
  
  await p2.close()
  await b.close()
}
main().catch(e => { console.error(e); process.exit(1) })
