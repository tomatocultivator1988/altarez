import { chromium } from "playwright"

async function main() {
  const b = await chromium.launch({ headless: true })
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } })

  // Test 1: Public machinery page (no auth)
  console.log("=== Test: Public Machinery ===")
  await p.goto("http://localhost:3022/machinery")
  await p.waitForTimeout(2000)
  console.log("URL:", p.url())
  const text = await p.textContent("body")
  console.log("Has John Deere:", text.includes("John Deere"))
  console.log("Has Kubota:", text.includes("Kubota"))
  const cards = await p.locator(".grid a, [class*='grid'] a").count()
  console.log("Machinery cards count:", cards)

  // Test 2: Click a machine card
  if (cards > 0) {
    const firstCard = p.locator("a:has-text('John Deere')").first()
    if (await firstCard.count() > 0) {
      await firstCard.click()
      await p.waitForTimeout(1500)
      const dt = await p.textContent("body")
      console.log("\nDetail page URL:", p.url())
      console.log("Has rate:", dt.includes("/ha") || dt.includes("hectare"))
      console.log("Has owner:", dt.includes("owner") || dt.includes("Owner") || dt.includes("by "))
    }
  }

  // Test 3: Machinery/manage should redirect (auth required)
  console.log("\n=== Test: /machinery/manage requires auth ===")
  await p.goto("http://localhost:3022/machinery/manage")
  await p.waitForTimeout(1500)
  console.log("URL:", p.url())
  console.log("Redirected away:", !p.url().includes("/machinery/manage") || p.url() === "http://localhost:3022/")

  await b.close()
}
main().catch(e => console.error(e))
