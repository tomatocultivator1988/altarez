# Graph Report - .  (2026-06-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 440 nodes · 864 edges · 26 communities (23 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `486db7bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 112 edges
2. `createClient()` - 35 edges
3. `createAdminClient()` - 33 edges
4. `buttonVariants` - 32 edges
5. `compilerOptions` - 16 edges
6. `Badge()` - 14 edges
7. `formatCurrency()` - 13 edges
8. `formatDate()` - 12 edges
9. `UserRole` - 11 edges
10. `scripts` - 8 edges

## Surprising Connections (you probably didn't know these)
- `BookingDetailPage()` --calls--> `createAdminClient()`  [INFERRED]
  src/app/(auth)/bookings/[id]/page.tsx → src/lib/supabase/admin.ts
- `BookingsPage()` --calls--> `createAdminClient()`  [INFERRED]
  src/app/(auth)/bookings/page.tsx → src/lib/supabase/admin.ts
- `DashboardPage()` --calls--> `createAdminClient()`  [INFERRED]
  src/app/(auth)/dashboard/page.tsx → src/lib/supabase/admin.ts
- `MachineryDetailPage()` --calls--> `cn()`  [INFERRED]
  src/app/(auth)/machinery/[id]/page.tsx → src/lib/utils.ts
- `MachineryDetailPage()` --calls--> `buttonVariants`  [INFERRED]
  src/app/(auth)/machinery/[id]/page.tsx → src/components/ui/button.tsx

## Import Cycles
- None detected.

## Communities (26 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (52): HeaderProps, cn(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (37): adminDeleteMachinery(), adminDeleteUser(), adminGetUserDetail(), adminUpdateUserRole(), AuthState, login(), register(), createMachinery() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (37): Header(), MobileLayoutWrapperProps, adminTabs, farmerTabs, lenderTabs, MobileNav(), MobileNavProps, MobileSheetNav() (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (26): AboutPage(), metadata, createBooking(), updateBookingStatus(), VALID_TRANSITIONS, AdminBookingActions(), AdminMachineryActions(), AdminUserActions() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (18): metadata, BookingDetailPage(), MachineryDetailPage(), BOOKING_STATUSES, MACHINERY_STATUSES, MACHINERY_TYPES, PAYMENT_STATUSES, USER_ROLES (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (34): dependencies, @base-ui/react, class-variance-authority, clsx, date-fns, @hookform/resolvers, isomorphic-dompurify, lucide-react (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (27): devDependencies, dotenv, eslint, eslint-config-next, @playwright/test, shadcn, supabase, tailwindcss (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): LandingClient(), loginInitial, ModalType, registerInitial, metadata, adminLinks, farmerLinks, lenderLinks (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (15): ROLE_BADGES, UserDetailModal(), UserDetailModalProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.46
Nodes (7): admin, anon, assert(), fail(), main(), ok(), summary()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Toaster()

### Community 13 - "Community 13"
Cohesion: 0.38
Nodes (6): addDays(), BARANGAYS, createUser(), main(), NOW, supabase

### Community 14 - "Community 14"
Cohesion: 0.60
Nodes (5): clickBookingCard(), login(), main(), reseed(), screenshot()

### Community 15 - "Community 15"
Cohesion: 0.47
Nodes (4): config, middleware(), COOKIE_OPTIONS, updateSession()

## Knowledge Gaps
- **170 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 1` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 1` to `Community 8`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `cn()` (e.g. with `MachineryDetailPage()` and `MachineryPage()`) actually correct?**
  _`cn()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `createAdminClient()` (e.g. with `AdminBookingsPage()` and `BookingsPage()`) actually correct?**
  _`createAdminClient()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `buttonVariants` (e.g. with `MachineryDetailPage()` and `MachineryPage()`) actually correct?**
  _`buttonVariants` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._