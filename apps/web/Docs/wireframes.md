# PataSpace Landing Page — Build Brief

## Overall Design Direction
Apple-refined minimalism. Clean white surfaces, generous whitespace, sharp typography. Reference: JustHome template structure but with PataSpace's brand colors — **Eerie Black (#252525), Teal (#28809A), Battleship Grey (#8D9192), Anti-flash White (#EDEDED)**. Fonts: **Poppins** (headings) + **DM Sans** (body).

---

## Section-by-Section Instructions

### 1. Navigation Bar (Fixed, sticky)
- Logo left: dot + "PataSpace" wordmark
- Center links: Home, Browse, How it Works, Blog, Contact
- Right: phone number + Sign In icon + **"Add Listing" CTA button** (filled teal)
- Frosted glass blur background on scroll (`backdrop-filter: blur`)
- Height: 60px. Border-bottom: 0.5px on scroll only

---

### 2. Hero Section (Full-width, 100vh)
- **Background:** Full-bleed high-quality photo of a modern Nairobi apartment/estate — sky visible, clean architecture. Overlay: dark gradient bottom-to-top at 40% opacity so text reads clearly
- **Headline:** Large centered white text — *"Find Your Next Home in Nairobi"* — subline below in smaller weight: *"Connect directly with tenants leaving their homes. No agents. No fees."*
- **Search bar:** Floating white card centered over the hero image, same pattern as JustHome:
  - 3 tabs: **Find** | **Rent** | **Post**
  - Fields: Location dropdown | Bedrooms dropdown | Price range dropdown | **Filter button** | **Search button** (teal filled)
  - Rounded corners, subtle shadow, sits about 70% down the hero
- **Stats bar:** 3 numbers in a row at the very bottom of the hero overlapping into the next section:
  - `2,000+` Active Listings | `500+` Successful Move-ins | `Zero` Agent Fees
  - White background card, subtle shadow, centered

---

### 3. Featured Categories (White background)
- Section title centered: *"Browse by Type"* + subtitle: *"Based on your housing needs"*
- **5 category cards in a row** (scrollable on mobile):
  - Bedsitter | 1 Bedroom | 2 Bedroom | 3 Bedroom | Townhouse
  - Each card: thumbnail photo + category name + "X listings" count
  - Hover: slight scale-up + teal border
- Same layout as JustHome's "Featured Categories" row

---

### 4. Homes For You (Light grey background #EDEDED)
- Section title centered: *"Listings For You"* + subtitle: *"Based on your search area"*
- **3 listing cards in a row**, each card contains:
  - Top-left badge: green "Available" tag
  - Property photo (full card width, 200px height)
  - Price in teal bold: *KES 45,000 / mo*
  - Property name + address below
  - Row of icons: 🛏 2 beds · 🚿 1 bath · 📐 850 sqft
  - **"Unlock Contact — 1 Credit"** button on hover (dark fill)
- Pagination dots or arrows below the row
- CTA link below: "View all listings →"

---

### 5. Split Feature Section (White background)
- **Left side:** Large lifestyle photo — happy person/family in a Nairobi apartment setting (similar to JustHome's "Local expertise" section)
  - Floating stat card over the photo bottom-left: teal background, white text — *"KES 2.5M commissions paid out"*
- **Right side:** Text content
  - Eyebrow label (teal, uppercase small): *"For Outgoing Tenants"*
  - Headline: *"Move out. List once. Earn your commission."*
  - Body text explaining the 10% commission model
  - **"Learn More →"** button (dark, pill shape)

---

### 6. Partner/Trust Strip (Dark #252525 background)
- Centered text above: *"Thousands of Nairobians trust PataSpace"*
- Logo row: M-Pesa logo | Safaricom | Africa's Talking | DigitalOcean | AWS
- Same dark strip treatment as JustHome's AMD/Cisco/Amazon strip

---

### 7. Featured Properties (White background)
- Same title treatment: *"Featured Properties"* + subtitle
- **4 listing cards in a row** (vs JustHome's horizontal scroll)
- Each card:
  - Photo with "For Rent" badge top-left
  - Price bold top-right overlay
  - Name, location, bed/bath/size icons below
  - On hover: show **"Unlock · 1 Credit"** teal button
- Filter tabs above the grid: **All | Westlands | Kilimani | Lavington | South B | Parklands**

---

### 8. Testimonials (Light grey background)
- Centered title: *"What our users are saying"*
- Star rating summary top-right (like JustHome): ★ 4.8 · 200+ reviews
- **3 testimonial cards** in a row:
  - Avatar circle + name + role (Outgoing Tenant / Incoming Tenant)
  - Quote text
  - Star rating per card
  - Opening quote mark decorative (large teal)

---

### 9. Meet the Founders / Team (White background)
- Centered title: *"Built in Nairobi, for Nairobi"*
- **3–4 team cards** in a row, same as JustHome's expert grid:
  - Circular or square photo + Name + Role
  - LinkedIn icon

---

### 10. Discover Our Credit Packages (Light grey)
- Left side: lifestyle photo (someone browsing phone, relaxed)
- Right side: **3 credit package cards stacked or in a mini-grid**:
  - Starter: 3 credits · KES 300
  - Popular (featured, teal card): 10 credits · KES 800
  - Bulk: 25 credits · KES 1,750
  - Each with "Buy via M-Pesa" button

---

### 11. Footer (Dark #1a1a1a)
4-column layout identical to JustHome's footer:
- **Col 1:** PataSpace logo + one-line description + M-Pesa badge
- **Col 2:** Browse (links to listing types)
- **Col 3:** Company (About, Blog, Careers, Press)
- **Col 4:** Support (Help, Contact, Safety, Disputes)
- Bottom bar: copyright left | Privacy · Terms · Cookies right
- Social icons row (Twitter/X, Instagram, LinkedIn, WhatsApp)

---

## Technical Notes for the Agent

- **Mobile-first, fully responsive.** Every section stacks to single column on mobile
- Listing cards use a **credit unlock model** — no phone number shown until "Unlock" is clicked (show modal or redirect to sign in)
- Hero search bar should be functional or at minimum route to `/browse?location=X&bedrooms=Y`
- Use **Next.js** (already in the stack) — pages: `/`, `/browse`, `/listing/[id]`, `/post`, `/credits`
- Animate sections in on scroll using **Framer Motion** or simple CSS `IntersectionObserver`
- All property images: use high-quality Unsplash photos of Kenyan/African apartments as placeholders
- Teal (`#28809A`) is the primary action color — all CTAs, badges, active states
- No purple. No gradients except the hero overlay.
