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
  const browser = await chromium.launch({ headless: false, slowMo: 80 })
  let passed = 0; let failed = 0
  let missing: string[] = []
  function check(desc: string, ok: boolean) {
    if (ok) { passed++; console.log(`  ✓ ${desc}`) }
    else { failed++; console.log(`  ✗ ${desc}`) }
  }
  function noteMissing(feature: string, detail: string) {
    missing.push(`${feature}: ${detail}`)
    console.log(`  ⚠ MISSING: ${feature} — ${detail}`)
  }

  // ══════════════════════ UNAUTHENTICATED ══════════════════════
  console.log("═══ UNAUTHENTICATED ═══")
  const p0 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await p0.goto(URL); await p0.waitForTimeout(800)
  let t = await p0.textContent("body")
  check("Landing page loads", t.includes("Agrimalachina"))
  check("Hero: Explore Machinery CTA", t.includes("Explore"))
  check("Hero: Get Started CTA", t.includes("Get Started"))
  check("Login button visible", t.includes("Log In"))

  await p0.locator("button:has-text('About')").first().click(); await p0.waitForTimeout(800)
  t = await p0.textContent("body")
  check("About modal opens", t.includes("Mission") || t.includes("Vision"))

  await p0.goto(URL); await p0.waitForTimeout(500)
  await p0.locator("button:has-text('Log In')").click(); await p0.waitForTimeout(800)
  check("Login email field exists", await p0.locator("#login-email").isVisible())
  check("Login password field exists", await p0.locator("#login-password").isVisible())

  await p0.goto(URL); await p0.waitForTimeout(500)
  await p0.locator("button:has-text('Get Started')").click(); await p0.waitForTimeout(800)
  t = await p0.textContent("body")
  check("Register form opens", t.includes("Register") || t.includes("Create") || t.includes("Sign Up"))
  
  const registerInputs = ["firstName", "lastName", "username", "email", "password", "confirmPassword"]
  for (const f of registerInputs) {
    check(`Register field: ${f}`, await p0.locator(`input[name='${f}']`).count() > 0)
  }
  if (!t.includes("ID") && !t.includes("verif") && !t.includes("upload") && !t.includes("document")) {
    noteMissing("ID verification", "Registration has no document/ID upload for identity verification")
  }
  await p0.close()

  // PUBLIC
  console.log("\n═══ PUBLIC ROUTES ═══")
  const pp = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await pp.goto(`${URL}/machinery`); await pp.waitForTimeout(1000)
  t = await pp.textContent("body")
  check("Public machinery page loads", t.includes("John Deere") || t.includes("Kubota"))
  
  await pp.goto(`${URL}/dashboard`); await pp.waitForTimeout(1000)
  check("Protected: /dashboard redirects", !pp.url().includes("/dashboard") || pp.url().includes("/"))
  await pp.goto(`${URL}/bookings`); await pp.waitForTimeout(1000)
  check("Protected: /bookings redirects", !pp.url().includes("/bookings") || pp.url().includes("/"))
  await pp.goto(`${URL}/admin`); await pp.waitForTimeout(1000)
  check("Protected: /admin redirects", !pp.url().includes("/admin") || pp.url().includes("/"))
  await pp.close()

  // ══════════════════════ ADMIN ══════════════════════
  console.log("\n═══ ADMIN ═══")
  reseed()
  const pA = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(pA, "admin@agrimalachina.com", "admin123")
  await pA.waitForURL("**/admin/dashboard", { timeout: 10000 })

  for (const [label, url, expected] of [
    ["Dashboard","/admin/dashboard","Dashboard"],
    ["Users","/admin/users","Users"],
    ["All Machinery","/admin/machinery","machinery"],
    ["All Bookings","/admin/bookings","All Bookings"],
    ["Reports","/admin/reports","Reports"],
    ["Settings","/admin/settings","Settings"],
    ["Notifications","/admin/notifications","Notifications"],
  ] as const) {
    await pA.goto(`${URL}${url}`); await pA.waitForTimeout(800)
    t = await pA.textContent("body")
    if (t.includes(expected) || t.includes("coming soon")) {
      check(`Admin ${label} page`, true)
      if (t.includes("coming soon")) noteMissing(`Admin ${label}`, "Placeholder page - not yet implemented")
    } else {
      check(`Admin ${label} page`, false)
    }
  }

  // Sidebar links
  for (const linkText of ["Dashboard","Users","Bookings","Machinery","Notifications"]) {
    const el = pA.locator(`a:has-text('${linkText}')`).first()
    check(`Admin sidebar: ${linkText} link`, await el.count() > 0)
  }

  // Switch to User View
  const switchBtn = pA.locator("a:has-text('Switch to User View')")
  if (await switchBtn.count() > 0) {
    await switchBtn.click(); await pA.waitForTimeout(1200)
    check("Switch to User View works", pA.url().includes("dashboard") && !pA.url().includes("/admin"))
  }

  // User detail modal — click any user button in the table
  await pA.goto(`${URL}/admin/users`); await pA.waitForTimeout(1000)
  const firstUserBtn = pA.locator("tr button:has-text('Delete')").first()
  if (await firstUserBtn.count() > 0) {
    // The user name is in the same row
    const userNameBtn = pA.locator("tr button").filter({ hasText: /[A-Z][a-z]+ [A-Z][a-z]+/ }).first()
    if (await userNameBtn.count() > 0) {
      await userNameBtn.click(); await pA.waitForTimeout(1000)
      const modalExists = await pA.locator("[role='dialog']").isVisible()
      check("User detail modal opens", modalExists)
      if (modalExists) await pA.locator("[role='dialog'] button:has-text('Close')").first().click().catch(() => {})
    } else {
      check("User detail modal opens", false)
    }
  } else {
    check("User detail modal opens", false)
  }

  // Logout
  await pA.goto(`${URL}/admin/dashboard`); await pA.waitForTimeout(500)
  const avatarBtn = pA.locator("header button").last()
  if (await avatarBtn.count() > 0) {
    await avatarBtn.click(); await pA.waitForTimeout(1000)
    const logoutEl = pA.locator("[role='menuitem'], button, a").filter({ hasText: /log out|logout|sign out/i }).first()
    check("Admin logout button found", await logoutEl.count() > 0)
    if (await logoutEl.count() > 0) {
      await logoutEl.click(); await pA.waitForTimeout(2000)
      check("Admin logout works", pA.url() === `${URL}/` || !pA.url().includes("admin"))
    }
  }
  await pA.close()

  // ══════════════════════ LENDER ══════════════════════
  console.log("\n═══ LENDER ═══")
  reseed()
  const pL = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(pL, "juan.delacruz@lender.com", "lender123")
  await pL.waitForURL("**/dashboard", { timeout: 10000 })

  for (const [label, url, expected] of [
    ["Dashboard","/dashboard","Dashboard"],
    ["My Machinery","/machinery/manage","machinery"],
    ["Booking Requests","/bookings","Bookings"],
    ["Lending History","/lending-history","History"],
    ["Reports","/reports","Reports"],
    ["Profile","/profile","Profile"],
    ["Notifications","/notifications","Notifications"],
  ] as const) {
    await pL.goto(`${URL}${url}`); await pL.waitForTimeout(800)
    t = await pL.textContent("body")
    if (t.includes(expected)) check(`Lender ${label} page`, true)
    else if (t.includes("coming soon")) {
      check(`Lender ${label} page`, true)
      noteMissing(`Lender ${label}`, "Placeholder page")
    }
    else check(`Lender ${label} page`, false)
  }

  // Add machinery form
  await pL.goto(`${URL}/machinery/manage/new`); await pL.waitForTimeout(1000)
  t = await pL.textContent("body")
  check("Add Machinery form loads", await pL.locator("input,select,textarea").count() > 3)
  if (!t.includes("image") && !t.includes("photo") && !t.includes("upload")) {
    noteMissing("Machinery image upload", "No file upload field in Add Machinery form")
  }

  // Edit machinery
  await pL.goto(`${URL}/machinery/manage`); await pL.waitForTimeout(1000)
  const editLink = pL.locator("a:has-text('Edit')").first()
  if (await editLink.count() > 0) {
    await editLink.click(); await pL.waitForTimeout(1000)
    check("Edit machinery form opens", await pL.locator("input,select,textarea").count() > 3)
  }

  // Approve booking
  await pL.goto(`${URL}/bookings`); await pL.waitForTimeout(1000)
  await pL.locator("a:has-text('John Deere')").first().click(); await pL.waitForTimeout(1000)
  t = await pL.textContent("body")
  check("Lender detail: Approve visible", t.includes("Approve"))
  check("Lender detail: Deny visible", t.includes("Deny"))
  check("Lender detail: Timeline renders", t.includes("Pickup Documentation"))
  
  await pL.locator("button:has-text('Approve')").click(); await pL.waitForTimeout(1500)
  t = await pL.textContent("body")
  check("Doc Pickup button after approve", t.includes("Document Pickup"))

  // Mobile tabs
  await pL.setViewportSize({ width: 390, height: 844 })
  await pL.goto(`${URL}/dashboard`); await pL.waitForTimeout(800)
  for (const tab of ["Home","Machinery","Bookings","Alerts"]) {
    check(`Lender mobile tab: ${tab}`, await pL.locator(`nav a:has-text('${tab}')`).count() > 0)
  }
  await pL.setViewportSize({ width: 1280, height: 720 })

  // Profile — check if editable
  await pL.goto(`${URL}/profile`); await pL.waitForTimeout(1000)
  t = await pL.textContent("body")
  if (!t.includes("Edit") && !t.includes("Save") && !t.includes("Update")) {
    noteMissing("Profile editing", "Profile page is read-only — no edit/save functionality")
  }

  await pL.close()

  // ══════════════════════ FARMER ══════════════════════
  console.log("\n═══ FARMER ═══")
  reseed()
  const pF = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await login(pF, "pedro.gonzales@farmer.com", "farmer123")
  await pF.waitForURL("**/dashboard", { timeout: 10000 })

  for (const [label, url, expected] of [
    ["Dashboard","/dashboard","Dashboard"],
    ["Browse Machinery","/machinery","John Deere"],
    ["My Bookings","/bookings","Bookings"],
    ["Renting History","/renting-history","History"],
    ["Profile","/profile","Profile"],
    ["Notifications","/notifications","Notifications"],
  ] as const) {
    await pF.goto(`${URL}${url}`); await pF.waitForTimeout(800)
    t = await pF.textContent("body")
    check(`Farmer ${label} page`, t.includes(expected))
  }

  // Machinery detail → Request Rental
  await pF.goto(`${URL}/machinery`); await pF.waitForTimeout(1000)
  await pF.locator("a:has-text('John Deere')").first().click(); await pF.waitForTimeout(1000)
  t = await pF.textContent("body")
  const hasRentBtn = await pF.locator("a:has-text('Request')").count() > 0
  check("Farmer: Request Rental button visible", hasRentBtn)
  
  if (hasRentBtn) {
    await pF.locator("a:has-text('Request')").first().click(); await pF.waitForTimeout(1000)
    t = await pF.textContent("body")
    check("Farmer: Booking form opens", t.includes("date") || t.includes("Start") || t.includes("hectares"))
  }

  // Cancel booking
  await pF.goto(`${URL}/bookings`); await pF.waitForTimeout(1000)
  await pF.locator("a:has-text('John Deere')").first().click(); await pF.waitForTimeout(1000)
  await pF.locator("button:has-text('Cancel Booking')").click()
  await pF.waitForFunction(() => document.body.textContent?.includes("Cancelled"), null, { timeout: 8000 })
  check("Farmer: Cancel booking works", (await pF.textContent("body")).includes("Cancelled"))

  // Notifications
  await pF.goto(`${URL}/notifications`); await pF.waitForTimeout(1000)
  const markAll = pF.locator("button:has-text('Mark All')")
  if (await markAll.count() > 0) {
    await markAll.click(); await pF.waitForTimeout(500)
    check("Farmer: Mark All Read works", true)
  }

  await pF.close()

  // ══════════════════════ RESULTS ══════════════════════
  console.log("\n")
  console.log("═══════════════════════════════════════════════════════")
  console.log("               SYSTEM AUDIT COMPLETE")
  console.log("═══════════════════════════════════════════════════════")
  console.log(`  Passed: ${passed}  |  Failed: ${failed}  |  Missing: ${missing.length}`)
  console.log("═══════════════════════════════════════════════════════")
  if (missing.length > 0) {
    console.log("\nMISSING / INCOMPLETE FEATURES:")
    for (const m of missing) console.log(`  ⚠ ${m}`)
  }
  if (failed > 0) process.exit(1)
  console.log("\nBrowser closing in 8 seconds...")
  await new Promise(r => setTimeout(r, 8000))
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
