import { chromium } from "playwright"
import { execSync } from "child_process"

async function main() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const b = await chromium.launch({ headless: true })
  const p = await b.newPage()

  // Listen for console errors
  p.on("pageerror", err => console.log("PAGE ERROR:", err.message))
  
  await p.goto("http://localhost:3022")
  await p.click("button:has-text('Log In')")
  await p.waitForSelector("#login-email")
  await p.fill("#login-email", "juan.delacruz@lender.com")
  await p.fill("#login-password", "lender123")
  await p.click("button[type='submit']")
  await p.waitForURL("**/dashboard", { timeout: 10000 })

  await p.goto("http://localhost:3022/bookings"); await p.waitForTimeout(2000)
  await p.locator("a:has-text('John Deere')").first().click()
  await p.waitForTimeout(2000)

  const tc = await p.locator("body").textContent() || ""
  console.log("Before approve — Has Approve:", tc.includes("Approve"))
  
  // Check for any error text
  const errEl = await p.locator("p").filter({ hasText: "error" }).count()
  console.log("Error elements before:", errEl)

  // Click Approve
  console.log("Clicking Approve...")
  await p.locator("button:has-text('Approve')").click()
  
  // Wait — should show "Updating..." then reload
  await p.waitForTimeout(500)
  const working = await p.locator("body").innerText()
  console.log("After click (500ms):", working.includes("Updating") ? "Updating..." : "Not updating")
  
  // Check if action is blocked
  await p.waitForTimeout(5000)
  const tc2 = await p.locator("body").textContent() || ""
  console.log("Page text after wait:", tc2.slice(0, 500))
  console.log("Has 'Approved':", tc2.includes("Approved"))
  console.log("Has 'Document Pickup':", tc2.includes("Document Pickup"))
  console.log("Has 'error':", tc2.includes("error"))
  console.log("Has 'Booking not found':", tc2.includes("Booking not found"))
  
  // Dump all buttons
  const btns = await p.locator("button").allTextContents()
  console.log("Buttons:", JSON.stringify(btns.filter((x: string) => x.trim())))

  // Check URL — did reload happen?
  console.log("URL:", p.url())

  await b.close()
}
main().catch(console.error)
