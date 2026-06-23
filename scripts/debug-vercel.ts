import { chromium } from "playwright"

async function main() {
  const b = await chromium.launch({ headless: true })
  const URL = "https://altarez.vercel.app"
  
  // Bug 3: My Machinery
  console.log("=== Bug 3: My Machinery ===")
  const p1 = await b.newPage()
  await p1.goto(URL)
  await p1.click("button:has-text('Log In')")
  await p1.waitForSelector("#login-email")
  await p1.fill("#login-email", "juan.delacruz@lender.com")
  await p1.fill("#login-password", "lender123")
  await p1.click("button[type='submit']")
  await p1.waitForURL("**/dashboard", { timeout: 15000 })
  
  await p1.goto(`${URL}/machinery/manage`); await p1.waitForTimeout(4000)
  const tm = await p1.locator("body").innerText()
  console.log("Has John Deere:", tm.includes("John Deere"))
  console.log("Has Kubota:", tm.includes("Kubota"))
  console.log("Has 'No machinery yet':", tm.includes("No machinery yet"))
  await p1.close()

  // Bug 1: RLS error on booking detail
  console.log("\n=== Bug 1: RLS subquery error ===")
  const p2 = await b.newPage()
  await p2.goto(URL)
  await p2.click("button:has-text('Log In')")
  await p2.waitForSelector("#login-email")
  await p2.fill("#login-email", "pedro.gonzales@farmer.com")
  await p2.fill("#login-password", "farmer123")
  await p2.click("button[type='submit']")
  await p2.waitForURL("**/dashboard", { timeout: 15000 })

  await p2.goto(`${URL}/bookings`); await p2.waitForTimeout(2000)
  await p2.locator("a:has-text('John Deere')").first().click()
  await p2.waitForTimeout(3000)
  const tc2 = await p2.locator("body").innerText()
  console.log("Has 'more than one row':", tc2.includes("more than one row"))
  console.log("Has 'Booking not found':", tc2.includes("Booking not found"))
  console.log("Has 'John Deere':", tc2.includes("John Deere"))
  await p2.close()

  // Bug 2: Owner Request Rental
  console.log("\n=== Bug 2: Owner Request Rental ===")
  const p3 = await b.newPage()
  await p3.goto(URL)
  await p3.click("button:has-text('Log In')")
  await p3.waitForSelector("#login-email")
  await p3.fill("#login-email", "juan.delacruz@lender.com")
  await p3.fill("#login-password", "lender123")
  await p3.click("button[type='submit']")
  await p3.waitForURL("**/dashboard", { timeout: 15000 })

  await p3.goto(`${URL}/machinery`); await p3.waitForTimeout(2000)
  await p3.locator("a:has-text('John Deere')").first().click()
  await p3.waitForTimeout(2000)
  const tc3 = await p3.locator("body").textContent() || ""
  console.log("Has Request Rental:", tc3.includes("Request Rental"))
  await p3.close()

  await b.close()
}
main().catch(console.error)
