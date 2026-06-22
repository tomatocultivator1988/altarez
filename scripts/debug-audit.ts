import { chromium } from "playwright"
import { execSync } from "child_process"

async function main() {
  execSync("npx tsx scripts/seed.ts", { cwd: process.cwd(), stdio: "pipe" })
  const b = await chromium.launch({ headless: false, slowMo: 100 })
  const URL = "http://localhost:3022"

  // DEBUG 1: Public machinery page
  console.log("=== 1. Public Machinery ===")
  const p1 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p1.goto(`${URL}/machinery`); await p1.waitForTimeout(2000)
  const t1 = await p1.textContent("body")
  console.log("Has John Deere:", t1.includes("John Deere"))
  console.log("Has Kubota:", t1.includes("Kubota"))
  console.log("Has machinery:", t1.includes("machinery"))
  console.log("Has Machine:", t1.includes("Machine"))
  // Check using locator instead of textContent
  const jd = await p1.locator("text=John Deere").count()
  console.log("John Deere elements:", jd)
  // Check actual visible text
  const visibleText = await p1.locator("body").innerText()
  console.log("Visible text (first 300):", visibleText.slice(0, 300))
  await p1.close()

  // DEBUG 2: User detail modal
  console.log("\n=== 2. User Detail Modal ===")
  const p2 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p2.goto(URL)
  await p2.click("button:has-text('Log In')")
  await p2.waitForSelector("#login-email")
  await p2.fill("#login-email", "admin@agrimalachina.com")
  await p2.fill("#login-password", "admin123")
  await p2.click("button[type='submit']")
  await p2.waitForURL("**/admin/dashboard", { timeout: 10000 })
  
  await p2.goto(`${URL}/admin/users`); await p2.waitForTimeout(2000)
  const allBtns = await p2.locator("button").allTextContents()
  console.log("All buttons on users page:", JSON.stringify(allBtns.filter((x:string)=>x.trim()).slice(0,10)))
  
  // Try clicking the first user button (Admin User)
  const firstUserBtn = p2.locator("button:has-text('Admin User')").first()
  if (await firstUserBtn.count() > 0) {
    console.log("Found 'Admin User' button")
    await firstUserBtn.click(); await p2.waitForTimeout(1500)
    const modalText = await p2.textContent("body")
    console.log("Modal has email:", modalText.includes("email") || modalText.includes("@"))
    console.log("Modal has Phone:", modalText.includes("Phone"))
    // Dump dialog content
    const dialog = p2.locator("[role='dialog']")
    if (await dialog.count() > 0) {
      console.log("Dialog text:", (await dialog.textContent())?.slice(0, 300))
    }
  } else {
    // Try table row click
    console.log("Trying table row click...")
    await p2.locator("tr:has-text('Admin')").first().click(); await p2.waitForTimeout(1500)
  }
  await p2.close()

  // DEBUG 3: Admin logout dropdown
  console.log("\n=== 3. Admin Logout ===")
  const p3 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p3.goto(URL)
  await p3.click("button:has-text('Log In')")
  await p3.waitForSelector("#login-email")
  await p3.fill("#login-email", "admin@agrimalachina.com")
  await p3.fill("#login-password", "admin123")
  await p3.click("button[type='submit']")
  await p3.waitForURL("**/admin/dashboard", { timeout: 10000 })
  
  // Click the header avatar button
  const headerBtn = p3.locator("header button:has-text('AU')").first()
  await headerBtn.click(); await p3.waitForTimeout(1000)
  
  // Check all visible text after clicking
  const postClick = await p3.textContent("body")
  console.log("Log out text present:", postClick.includes("Log out") || postClick.includes("log out") || postClick.includes("Sign out"))
  
  // Check all buttons after click
  const allBtns3 = await p3.locator("button").allTextContents()
  console.log("Buttons after click:", JSON.stringify(allBtns3.filter((x:string)=>x.trim())))
  
  // Try dropdown menu
  const dropdownItems = await p3.locator("[role='menu'] button, [role='menu'] a, [role='menuitem']").allTextContents()
  console.log("Menu items:", JSON.stringify(dropdownItems.filter((x:string)=>x.trim())))
  await p3.close()

  // DEBUG 4: Farmer booking form
  console.log("\n=== 4. Farmer Booking Form ===")
  const p4 = await b.newPage({ viewport: { width: 1280, height: 720 } })
  await p4.goto(URL)
  await p4.click("button:has-text('Log In')")
  await p4.waitForSelector("#login-email")
  await p4.fill("#login-email", "pedro.gonzales@farmer.com")
  await p4.fill("#login-password", "farmer123")
  await p4.click("button[type='submit']")
  await p4.waitForURL("**/dashboard", { timeout: 10000 })
  
  await p4.goto(`${URL}/machinery`); await p4.waitForTimeout(1500)
  await p4.locator("a:has-text('John Deere')").first().click(); await p4.waitForTimeout(1500)
  
  console.log("URL:", p4.url())
  const rentBtn = p4.locator("a:has-text('Request')")
  console.log("Request Rental button count:", await rentBtn.count())
  if (await rentBtn.count() > 0) {
    await rentBtn.first().click(); await p4.waitForTimeout(2000)
    console.log("After click URL:", p4.url())
    const formText = await p4.textContent("body")
    console.log("Has date:", formText.includes("date"))
    console.log("Has Start:", formText.includes("Start"))
    console.log("Has hectares:", formText.includes("hectares"))
    console.log("Has Hectares:", formText.includes("Hectares"))
    console.log("Form text (first 400):", formText.slice(0, 400))
  }
  
  await p4.close()
  await b.close()
}
main().catch(e => console.error(e))
