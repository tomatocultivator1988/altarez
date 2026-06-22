import { chromium } from "playwright"
import { execSync } from "child_process"

async function main() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const b = await chromium.launch({ headless: true })
  let p = 0, f = 0
  function check(d: string, ok: boolean) { if(ok){p++;console.log(`  ✓ ${d}`)}else{f++;console.log(`  ✗ ${d}`)} }

  // TEST FIX 1: Switch to User View
  console.log("=== FIX 1: Admin Switch to User View ===")
  const pA = await b.newPage()
  await pA.goto("http://localhost:3022")
  await pA.click("button:has-text('Log In')")
  await pA.waitForSelector("#login-email")
  await pA.fill("#login-email", "admin@agrimalachina.com")
  await pA.fill("#login-password", "admin123")
  await pA.click("button[type='submit']")
  await pA.waitForURL("**/admin/dashboard", { timeout: 10000 })
  console.log("Admin logged in")
  
  await pA.goto("http://localhost:3022/admin/dashboard"); await pA.waitForTimeout(500)
  const sw = pA.locator("a:has-text('Switch to User View')")
  console.log("Switch link exists:", await sw.count() > 0)
  const href = await sw.getAttribute("href")
  console.log("Switch link href:", href)
  
  if (await sw.count() > 0) {
    await sw.first().click()
    // Use a more flexible wait
    await pA.waitForFunction(() => window.location.pathname === "/dashboard", null, { timeout: 10000 })
    console.log("After click URL:", pA.url())
    check("Switch to /dashboard", pA.url().includes("/dashboard") && !pA.url().includes("/admin"))
  }
  await pA.close()

  // TEST FIX 2: Approve → Doc Pickup
  console.log("\n=== FIX 2: Lender Approve → Doc Pickup ===")
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const pL = await b.newPage()
  await pL.goto("http://localhost:3022")
  await pL.click("button:has-text('Log In')")
  await pL.waitForSelector("#login-email")
  await pL.fill("#login-email", "juan.delacruz@lender.com")
  await pL.fill("#login-password", "lender123")
  await pL.click("button[type='submit']")
  await pL.waitForURL("**/dashboard", { timeout: 10000 })
  console.log("Juan logged in")

  await pL.goto("http://localhost:3022/bookings"); await pL.waitForTimeout(2000)
  await pL.locator("a:has-text('John Deere')").first().click()
  await pL.waitForTimeout(2000)

  const tc = await pL.locator("body").textContent() || ""
  console.log("Has Approve:", tc.includes("Approve"))
  console.log("Has Deny:", tc.includes("Deny"))

  // Click Approve
  await pL.locator("button:has-text('Approve')").click()
  console.log("Clicked Approve — waiting for reload...")
  
  // window.location.reload() should fire. Wait for the page to finish reloading.
  try {
    await pL.waitForLoadState("networkidle", { timeout: 15000 })
  } catch {
    console.log("Network idle timeout — checking anyway")
  }
  await pL.waitForTimeout(3000)
  
  const tc2 = await pL.locator("body").textContent() || ""
  const btns = await pL.locator("button").allTextContents()
  console.log("URL after reload:", pL.url())
  console.log("Buttons:", JSON.stringify(btns.filter((x: string) => x.trim())))
  console.log("Has 'Document Pickup':", tc2.includes("Document Pickup"))
  check("Doc Pickup appears after approve", tc2.includes("Document Pickup"))

  await b.close()
  console.log(`\nResults: ${p} passed, ${f} failed`)
}
main().catch(console.error)
