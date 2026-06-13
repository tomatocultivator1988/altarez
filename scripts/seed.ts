import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "../.env.local") })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
)

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

const BARANGAYS = ["Brgy. Agcuyawan", "Brgy. Alimodian", "Brgy. Badiangan", "Brgy. Banban", "Brgy. Carabalan", "Brgy. Dala", "Brgy. Igtambo", "Brgy. Lantangan"]

const NOW = new Date()

async function createUser(email: string, password: string, meta: Record<string, string>): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  })
  if (error) {
    if (error.status === 409 || error.message?.includes("already registered")) {
      const { data: list } = await supabase.auth.admin.listUsers()
      const found = list?.users.find((u) => u.email === email)
      if (found) return found.id
    }
    console.error(`  ✗ Failed to create ${email}: ${error.message}`)
    process.exit(1)
  }
  return data.user.id
}

async function main() {
  console.log("🌱 Seeding Agrimalachina...\n")

  // ── 1. Clean existing seed data ──────────────────────────────────
  console.log("─ Cleaning existing seed data...")
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const seedEmails = [
    "admin@agrimalachina.com",
    "juan.delacruz@lender.com",
    "maria.santos@lender.com",
    "pedro.gonzales@farmer.com",
    "ana.reyes@farmer.com",
    "carlos.mendoza@farmer.com",
  ]
  for (const user of users) {
    if (seedEmails.includes(user.email!)) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) console.warn(`  Warning: could not delete ${user.email}: ${error.message}`)
      else console.log(`  Deleted ${user.email}`)
    }
  }

  // ── 2. Create users ────────────────────────────────────────────
  console.log("\n─ Creating users...")
  const adminId = await createUser("admin@agrimalachina.com", "admin123", {
    role: "admin", first_name: "Admin", last_name: "User", username: "admin",
  })
  const juanId = await createUser("juan.delacruz@lender.com", "lender123", {
    role: "lender", first_name: "Juan", last_name: "Dela Cruz", username: "juan.delacruz",
  })
  const mariaId = await createUser("maria.santos@lender.com", "lender123", {
    role: "lender", first_name: "Maria", last_name: "Santos", username: "maria.santos",
  })
  const pedroId = await createUser("pedro.gonzales@farmer.com", "farmer123", {
    role: "farmer", first_name: "Pedro", last_name: "Gonzales", username: "pedro.gonzales",
  })
  const anaId = await createUser("ana.reyes@farmer.com", "farmer123", {
    role: "farmer", first_name: "Ana", last_name: "Reyes", username: "ana.reyes",
  })
  const carlosId = await createUser("carlos.mendoza@farmer.com", "farmer123", {
    role: "farmer", first_name: "Carlos", last_name: "Mendoza", username: "carlos.mendoza",
  })
  console.log("  ✓ All 6 users created")

  // ── 3. Update profiles ──────────────────────────────────────────
  console.log("\n─ Updating profiles...")
  const { error: p1 } = await supabase.from("profiles").upsert({ id: adminId, role: "admin", first_name: "Admin", last_name: "User", username: "admin", phone_number: "09171234567", barangay: "Brgy. Igtambo", address: "Mina, Iloilo" })
  if (p1) console.warn(`  Admin profile: ${p1.message}`)
  const { error: p2 } = await supabase.from("profiles").upsert({ id: juanId, role: "lender", first_name: "Juan", last_name: "Dela Cruz", username: "juan.delacruz", phone_number: "09181234568", barangay: "Brgy. Alimodian", address: "Mina, Iloilo" })
  if (p2) console.warn(`  Juan profile: ${p2.message}`)
  const { error: p3 } = await supabase.from("profiles").upsert({ id: mariaId, role: "lender", first_name: "Maria", last_name: "Santos", username: "maria.santos", phone_number: "09191234569", barangay: "Brgy. Carabalan", address: "Mina, Iloilo" })
  if (p3) console.warn(`  Maria profile: ${p3.message}`)
  const { error: p4 } = await supabase.from("profiles").upsert({ id: pedroId, role: "farmer", first_name: "Pedro", last_name: "Gonzales", username: "pedro.gonzales", phone_number: "09201234570", barangay: "Brgy. Banban", address: "Mina, Iloilo", is_fca_member: true })
  if (p4) console.warn(`  Pedro profile: ${p4.message}`)
  const { error: p5 } = await supabase.from("profiles").upsert({ id: anaId, role: "farmer", first_name: "Ana", last_name: "Reyes", username: "ana.reyes", phone_number: "09211234571", barangay: "Brgy. Lantangan", address: "Mina, Iloilo" })
  if (p5) console.warn(`  Ana profile: ${p5.message}`)
  const { error: p6 } = await supabase.from("profiles").upsert({ id: carlosId, role: "farmer", first_name: "Carlos", last_name: "Mendoza", username: "carlos.mendoza", phone_number: "09221234572", barangay: "Brgy. Dala", address: "Mina, Iloilo", is_fca_member: true })
  if (p6) console.warn(`  Carlos profile: ${p6.message}`)
  console.log("  ✓ All profiles updated")

  // ── 4. Update lender_profiles ──────────────────────────────────
  console.log("\n─ Updating lender profiles...")
  const { error: l1 } = await supabase.from("lender_profiles").upsert({ id: juanId, hectares: 12.5, farm_location: "Brgy. Alimodian, Mina, Iloilo", equipment_count: 4 })
  if (l1) console.warn(`  Juan lender: ${l1.message}`)
  const { error: l2 } = await supabase.from("lender_profiles").upsert({ id: mariaId, hectares: 8.0, farm_location: "Brgy. Carabalan, Mina, Iloilo", equipment_count: 4 })
  if (l2) console.warn(`  Maria lender: ${l2.message}`)
  console.log("  ✓ Lender profiles updated")

  // ── 5. Insert machinery ────────────────────────────────────────
  console.log("\n─ Inserting machinery...")
  const machinery = [
    { owner_id: juanId, machine_name: "John Deere 6120M", machine_type: "4wd_tractor", description: "120 HP 4WD tractor with rotavator and trailer. Ideal for large-scale land preparation.", serial_number: "JD-6120M-2024-001", hectares_capacity: 5, rate_per_hour: 1500, barangay: "Brgy. Alimodian", image_url: null, status: "active" },
    { owner_id: juanId, machine_name: "Kubota M7060", machine_type: "hand_tractor", description: "70 HP hand tractor with disc plow and harrow. Perfect for small to medium farms.", serial_number: "KT-M7060-2024-002", hectares_capacity: 2, rate_per_hour: 500, barangay: "Brgy. Alimodian", image_url: null, status: "active" },
    { owner_id: juanId, machine_name: "Yanmar Combine Harvester", machine_type: "harvester", description: "4-row combine harvester with GPS guidance. Cuts and threshes in one pass.", serial_number: "YR-4R-2024-003", hectares_capacity: 8, rate_per_hour: 2500, barangay: "Brgy. Igtambo", image_url: null, status: "active" },
    { owner_id: juanId, machine_name: "GrainPro Dryer 10T", machine_type: "dryer", description: "10-ton capacity recirculating grain dryer. Maintains grain quality with even drying.", serial_number: "GP-10T-2024-004", hectares_capacity: 10, rate_per_hour: 800, barangay: "Brgy. Igtambo", image_url: null, status: "active" },
    { owner_id: mariaId, machine_name: "Power Tiller FT-300", machine_type: "floating_tiller", description: "Floating power tiller for wetland rice paddies. Excellent flotation in muddy fields.", serial_number: "PT-FT300-2024-005", hectares_capacity: 1.5, rate_per_hour: 400, barangay: "Brgy. Carabalan", image_url: null, status: "active" },
    { owner_id: mariaId, machine_name: "Isuzu Farm Truck 4x4", machine_type: "hauling", description: "4x4 farm truck with hydraulic lift bed. Hauls palay, fertilizers, and equipment.", serial_number: "IS-4x4-2024-006", hectares_capacity: 0, rate_per_hour: 1200, barangay: "Brgy. Carabalan", image_url: null, status: "active" },
    { owner_id: mariaId, machine_name: "Satake Rice Miller S-10", machine_type: "miller", description: "Satake single-pass rice mill. Produces premium milled rice with minimal breakage.", serial_number: "ST-S10-2024-007", hectares_capacity: 3, rate_per_hour: 600, barangay: "Brgy. Lantangan", image_url: null, status: "active" },
    { owner_id: mariaId, machine_name: "Multi-Purpose Craft Shop", machine_type: "craft_establishment", description: "Fully equipped crafts and repair shop for agricultural implements and machinery.", serial_number: "MPC-001-2024-008", hectares_capacity: 0, rate_per_hour: 0, barangay: "Brgy. Lantangan", image_url: null, status: "maintenance" },
  ]
  const { data: machineryInserted, error: machErr } = await supabase.from("machinery").insert(machinery).select()
  if (machErr) { console.error("  ✗ Machinery insert failed:", machErr.message); process.exit(1) }
  const [jdTractor, kubota, combine, dryer, tiller, truck, miller, craft] = machineryInserted!
  console.log("  ✓ 8 machinery entries inserted")

  // ── 6. Insert bookings ─────────────────────────────────────────
  console.log("\n─ Inserting bookings...")
  const bookings = [
    { machinery_id: jdTractor.id, renter_id: pedroId, owner_id: juanId, status: "pending", requested_hectares: 3, starting_date: addDays(NOW, 1), ending_date: addDays(NOW, 3), estimated_hours: 12, total_amount: 18000, notes: "Need for land preparation before rainy season. Prefer morning schedule." },
    { machinery_id: kubota.id, renter_id: pedroId, owner_id: juanId, status: "approved", requested_hectares: 1.5, starting_date: addDays(NOW, 7), ending_date: addDays(NOW, 9), estimated_hours: 8, total_amount: 4000, notes: "For secondary tillage on my 2-hectare lot." },
    { machinery_id: tiller.id, renter_id: anaId, owner_id: mariaId, status: "active", requested_hectares: 1, starting_date: addDays(NOW, -2), ending_date: addDays(NOW, 1), estimated_hours: 6, total_amount: 2400, notes: "Emergency tillage — need to catch up with planting schedule." },
    { machinery_id: combine.id, renter_id: anaId, owner_id: juanId, status: "completed", requested_hectares: 4, starting_date: addDays(NOW, -7), ending_date: addDays(NOW, -5), estimated_hours: 10, total_amount: 25000, payment_status: "paid", notes: "Harvest completed. Yield was good — around 120 cavans." },
    { machinery_id: truck.id, renter_id: carlosId, owner_id: mariaId, status: "completed", requested_hectares: 0, starting_date: addDays(NOW, -14), ending_date: addDays(NOW, -12), estimated_hours: 5, total_amount: 6000, payment_status: "paid", notes: "Hauled 200 sacks of palay to the mill. Driver was very professional." },
    { machinery_id: miller.id, renter_id: pedroId, owner_id: mariaId, status: "denied", requested_hectares: 2, starting_date: addDays(NOW, -30), ending_date: addDays(NOW, -28), estimated_hours: 4, total_amount: 2400, notes: "Requested for milling but machine was under maintenance at the time." },
    { machinery_id: dryer.id, renter_id: carlosId, owner_id: juanId, status: "cancelled", requested_hectares: 5, starting_date: addDays(NOW, -35), ending_date: addDays(NOW, -33), estimated_hours: 8, total_amount: 6400, notes: "Cancelled due to weather — dried palay naturally instead." },
  ]
  const { data: bookingsInserted, error: bookErr } = await supabase.from("bookings").insert(bookings).select()
  if (bookErr) { console.error("  ✗ Bookings insert failed:", bookErr.message); process.exit(1) }
  console.log("  ✓ 7 bookings inserted")

  // ── 6b. Set machinery status for active booking ────────────────
  await supabase.from("machinery").update({ status: "in_use" }).eq("id", tiller.id)

  // ── 7. Insert notifications ────────────────────────────────────
  console.log("\n─ Inserting notifications...")
  const notifications = [
    { user_id: juanId, title: "New Booking Request", message: "Pedro Gonzales requested your John Deere 6120M for land preparation (Jun 13–15).", type: "info", link: "/bookings" },
    { user_id: juanId, title: "Booking Approved", message: "You approved Pedro Gonzales's booking for Kubota M7060.", type: "success", link: "/bookings" },
    { user_id: pedroId, title: "Booking Approved", message: "Your booking for Kubota M7060 has been approved (Jun 19–21).", type: "success", link: "/bookings" },
    { user_id: mariaId, title: "Active Rental", message: "Ana Reyes is currently using your Power Tiller FT-300 until Jun 13.", type: "warning", link: "/bookings" },
    { user_id: anaId, title: "Rental Active", message: "Your rental of Power Tiller FT-300 is active until Jun 13.", type: "info", link: "/bookings" },
    { user_id: juanId, title: "Booking Completed", message: "Ana Reyes's harvesting booking is completed. Collect payment of ₱25,000.", type: "info", link: "/bookings" },
    { user_id: anaId, title: "Booking Completed", message: "Your harvester rental (Yanmar Combine) is completed. Total: ₱25,000.", type: "success", link: "/bookings" },
    { user_id: mariaId, title: "Booking Completed", message: "Carlos Mendoza's hauling booking is completed. ₱6,000 to collect.", type: "info", link: "/bookings" },
    { user_id: pedroId, title: "Booking Denied", message: "Your milling booking for Satake Rice Miller was denied (machine under maintenance).", type: "error", link: "/bookings" },
    { user_id: juanId, title: "Booking Cancelled", message: "Carlos Mendoza cancelled his dryer booking. Machine is available.", type: "warning", link: "/bookings" },
    { user_id: adminId, title: "New Users Registered", message: "6 new users registered in the past month. Check the admin panel.", type: "info", link: "/admin/users" },
    { user_id: adminId, title: "Welcome to Agrimalachina", message: "Administrator account is active. You can manage all users, machinery, and bookings.", type: "success", link: "/admin/dashboard" },
  ]
  const { error: notifErr } = await supabase.from("notifications").insert(notifications)
  if (notifErr) console.warn(`  Notifications warning: ${notifErr.message}`)
  else console.log("  ✓ 12 notifications inserted")

  // ── 8. Insert payments ─────────────────────────────────────────
  console.log("\n─ Inserting payments...")
  const completedAna = bookingsInserted!.find((b) => b.renter_id === anaId && b.status === "completed")
  const completedCarlos = bookingsInserted!.find((b) => b.renter_id === carlosId && b.status === "completed")
  const payments = [
    { booking_id: completedAna!.id, amount: 25000, payment_method: "cash", payment_date: addDays(NOW, -4) },
    { booking_id: completedCarlos!.id, amount: 6000, payment_method: "gcash", payment_date: addDays(NOW, -11) },
  ]
  const { error: payErr } = await supabase.from("payments").insert(payments)
  if (payErr) console.warn(`  Payments warning: ${payErr.message}`)
  else console.log("  ✓ 2 payments inserted")

  // ── Done ────────────────────────────────────────────────────────
  console.log("\n✅ Seeding complete!")
  console.log("")
  console.log("  ┌─────────────────────────┬──────────────┐")
  console.log("  │ Email                   │ Password     │")
  console.log("  ├─────────────────────────┼──────────────┤")
  console.log("  │ admin@agrimalachina.com │ admin123     │")
  console.log("  │ juan.delacruz@lender.com │ lender123   │")
  console.log("  │ maria.santos@lender.com  │ lender123   │")
  console.log("  │ pedro.gonzales@farmer.com│ farmer123   │")
  console.log("  │ ana.reyes@farmer.com     │ farmer123   │")
  console.log("  │ carlos.mendoza@farmer.com│ farmer123   │")
  console.log("  └─────────────────────────┴──────────────┘")
}

main()
