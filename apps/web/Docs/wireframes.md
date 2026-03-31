# PATASPACE WEB WIREFRAME PROMPTS
## Using Your Exact Design System (Eerie Black + Teal + Anti-flash White)

# DESIGN SYSTEM REFERENCE

```css
:root {
  /* Colors */
  --color-eerie-black: #252525;      /* Dark sidebar, nav */
  --color-battleship-grey: #8D9192;  /* Secondary text, icons */
  --color-anti-flash-white: #EDEDED; /* Card backgrounds */
  --color-white: #FFFFFF;            /* Main background */
  --color-teal: #28809A;             /* Accent, CTAs */
  
  /* Typography */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  
  /* Spacing */
  --radius-card: 16px;
  --radius-btn: 50%;
  --radius-pill: 999px;
  
  /* Shadows */
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-sidebar: 4px 0 24px rgba(0, 0, 0, 0.3);
}
```

---

# 🌐 WEB WIREFRAME PROMPTS (25 SCREENS)

## PUBLIC PAGES (4 Screens)

### WEB-01: LANDING PAGE
```
Create a modern landing page for PataSpace housing marketplace using a minimal design system.

Design Specifications:
- Desktop: 1440px wide (max-width container: 1200px)
- Background: White (#FFFFFF)

Navigation Bar (fixed top):
- Background: Eerie Black (#252525)
- Height: 80px
- Logo (left): "PataSpace" in white (Poppins Bold, 24px)
- Menu items (center): "How It Works" | "Browse" | "Post Listing" | "Pricing"
  - Color: White, opacity 0.8
  - Hover: Teal (#28809A)
- Actions (right):
  - "Login" button: White text, transparent background, teal border (2px)
  - "Get Started" button: White text, teal background (#28809A), rounded (999px)
  - Both buttons: 44px height, 16px horizontal padding
- Sticky on scroll with subtle shadow

Hero Section (full viewport):
- Background: Anti-flash White (#EDEDED)
- Layout: 50/50 split
- Left Column:
  - Heading: "Find Housing 3X Faster in Nairobi"
    - Font: Poppins Bold, 64px
    - Color: Eerie Black (#252525)
  - Subheading: "See real photos from current tenants. Skip the fake listings."
    - Font: DM Sans Regular, 20px
    - Color: Battleship Grey (#8D9192)
  - Search card (elevated):
    - Background: White
    - Border radius: 16px
    - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
    - Inputs: Neighborhood dropdown + Rent range + Teal "Search" button
    - Button: Circular teal (#28809A), white arrow icon
  - Trust badges (row):
    - "✓ GPS Verified" | "✓ Full Refund" | "✓ 2,000+ Users"
    - Font: DM Sans Regular, 14px
    - Color: Battleship Grey with teal checkmarks
- Right Column:
  - Illustration/mockup: Laptop showing property photos
  - Floating cards with subtle shadows
  - Background: Transparent

How It Works Section:
- Background: White
- 3-card layout (360px each):
  - Each card:
    - Background: Anti-flash White (#EDEDED)
    - Border radius: 16px
    - Padding: 40px
    - Icon (top): Teal circular background, white icon inside
    - Number: "1", "2", "3" (Poppins Bold, 48px, teal)
    - Title: "Browse Free" (Poppins Bold, 24px, eerie black)
    - Description: "See all photos and videos" (DM Sans, 16px, battleship grey)

Statistics Bar:
- Background: Eerie Black (#252525)
- Color: White
- Layout: 3 columns
- "2,000+ Listings" | "5,000+ Users" | "600 KES Avg Savings"
- Numbers: Poppins Bold, 48px
- Labels: DM Sans Regular, 16px, opacity 0.8

CTA Section:
- Background: Teal (#28809A)
- Color: White
- Centered: "Ready to find your home?"
- Two buttons: "Browse Listings" (white bg, teal text) | "Post Listing" (white border, white text)

Footer:
- Background: Eerie Black (#252525)
- Color: White, opacity 0.6
- 4 columns: About | Support | Legal | Social
- Links hover: Teal

Typography System:
- H1 (Hero): Poppins Bold, 64px
- H2 (Sections): Poppins Bold, 36px
- H3 (Cards): Poppins Bold, 24px
- Body: DM Sans Regular, 16px
- Small: DM Sans Regular, 14px
```

### WEB-02: HOW IT WORKS PAGE
```
Create a "How It Works" page for PataSpace using the minimal design system.

Design Specifications:
- Desktop: 1440px wide, centered 1000px content
- Background: White
- Navigation: Same sticky nav as landing page

Hero:
- Background: Anti-flash White (#EDEDED)
- Padding: 80px vertical
- Heading: "How PataSpace Works" (Poppins Bold, 48px, Eerie Black)
- Subheading: "Find your next home in 3 simple steps" (DM Sans, 20px, Battleship Grey)

For Incoming Tenants Section:
- Background: White
- Timeline layout (vertical, centered):
  - Each step card:
    - Width: 800px
    - Background: White
    - Border: 1px solid #EDEDED
    - Border radius: 16px
    - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
    - Layout: Image right (400px), content left (400px)
    - Step number: Circular teal badge (80px), white text "1"
    - Title: Poppins Bold, 28px, Eerie Black
    - Description: DM Sans Regular, 16px, Battleship Grey
    - Bullet points: Teal checkmarks

  - Step 1: "Browse Listings Free"
    - Screenshot/mockup on right
    - Benefits on left
    
  - Step 2: "Unlock Contact (2,000 KES)"
    - Unlock illustration
    - Pricing: "Only 10% of monthly rent" (highlighted in teal card)
    
  - Step 3: "Confirm & Move In"
    - Confirmation flow visual
    - Commission explanation

For Outgoing Tenants Section:
- Same layout, different content:
  - Step 1: "Take GPS Photos" (camera icon)
  - Step 2: "List Goes Live"
  - Step 3: "Earn 600 KES"

FAQ Accordion:
- Background: Anti-flash White
- Questions: Poppins Bold, 18px, Eerie Black
- Expand icon: Teal
- Answers: DM Sans Regular, 16px, Battleship Grey
- Border bottom: 1px solid #EDEDED

CTA:
- Background: Teal gradient
- "Ready to get started?"
- Buttons: "I'm Looking" | "I'm Leaving" (pill style, white bg, teal text)
```

### WEB-03: PRICING PAGE
```
Create a pricing page for PataSpace credits.

Design Specifications:
- Desktop: 1440px wide
- Background: White
- Navigation: Sticky header (same as landing)

Hero:
- Background: Anti-flash White
- Padding: 60px vertical
- Heading: "Simple, Transparent Pricing" (Poppins Bold, 48px)
- Subheading: "Pay only when you unlock contact" (DM Sans, 20px, grey)

Pricing Cards (3 columns):
- Container: 1200px wide, centered
- Each card: 360px wide
- Card style:
  - Background: White
  - Border: 2px solid #EDEDED
  - Border radius: 16px
  - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
  - Padding: 40px
  - Hover: Border color changes to Teal, slight lift
  
- Starter Package:
  - Badge: "Popular" (teal background, white text, pill shape, top-right)
  - Price: "5,000 KES" (Poppins Bold, 48px, Eerie Black)
  - Credits: "5,000 Credits" (DM Sans, 20px)
  - Subtext: "≈ 2 unlocks" (DM Sans, 16px, grey)
  - Features list (checkmarks in teal):
    - "Unlock contact info"
    - "Full refund protection"
    - "Credits never expire"
  - Button: "Buy Now" (teal background, white text, full width, rounded pill)
  
- Value Package (center, elevated):
  - Border: 2px solid Teal (default)
  - Badge: "Best Value" (teal)
  - Price: "10,000 KES"
  - Credits: "10,500 Credits" (+5% bonus highlighted)
  - Bonus text: "+500 bonus credits" (teal, bold)
  
- Premium Package:
  - Price: "20,000 KES"
  - Credits: "22,000 Credits" (+10% bonus)

Cost Calculator (interactive section):
- Background: Anti-flash White
- Padding: 80px vertical
- Title: "How Much Will It Cost?" (Poppins Bold, 36px)
- Table:
  - Headers: "Listing Price" | "Unlock Cost (10%)" | "You Pay"
  - Rows: Examples for 15K, 20K, 25K, 30K, 40K
  - Teal highlight on "You Pay" column
  - Font: DM Sans Mono for numbers

For Tenants Section:
- Background: White
- "Earn When Someone Moves In" (Poppins Bold, 36px)
- Commission calculator card:
  - Background: White
  - Border radius: 16px
  - Shadow: elevated
  - Input: Monthly rent (with KES prefix)
  - Output: "You'll earn X KES" (large, teal, bold)
  - Subtext: "30% of unlock fee" (grey)
  - Live calculation on input change

Trust Section:
- Background: Eerie Black
- Color: White
- Icons: M-Pesa, SSL, Refund guarantee
- Layout: 3 columns
```

### WEB-04: ABOUT / TRUST PAGE
```
Create an About page emphasizing trust and verification.

Design Specifications:
- Desktop: 1440px wide
- Background: White

Mission Statement (hero):
- Background: Linear gradient (Teal to darker teal)
- Color: White
- Centered: 800px content width
- Quote: "Stop wasting time on fake listings" (Poppins Bold, 56px)
- Stats: "Average person wastes 17.5 hours viewing bad properties" (DM Sans, 24px)
- CTA: "Our Solution" button (white bg, teal text)

Verification Section:
- Background: White
- Layout: 2 columns (image left, content right)
- Left: GPS verification illustration/map mockup
- Right:
  - Heading: "How We Verify Every Listing" (Poppins Bold, 36px)
  - Steps (numbered cards):
    - 1. GPS coordinates embedded in photos
    - 2. Photos must match location (±100m)
    - 3. Admin review for first 3 listings
  - Each step: Small teal number badge, black title, grey description

Safety Features (3 columns):
- Background: Anti-flash White
- Cards (white background, elevated):
  - Data Protection: Shield icon, SSL encryption
  - Payment Security: Lock icon, M-Pesa integration  
  - Fraud Prevention: Checkmark icon, AI detection
  - Each card: Icon (teal), title (black), description (grey)

Team Section (optional):
- Background: White
- Photo + bio layout
- "Kenyan-founded" badge (teal)

Statistics Bar:
- Background: Eerie Black
- Color: White
- "2,000+ Listings" | "5,000+ Users" | "95% Success Rate"
- Large numbers (Poppins Bold, 64px)
- Labels (DM Sans, 18px, opacity 0.8)
```

---

## 🏠 BROWSE & SEARCH (8 Screens)

### WEB-05: MAIN DASHBOARD / BROWSE
```
Create the main browse dashboard for PataSpace web app.

Design Specifications:
- Desktop: 1440px wide, 100vh height
- Layout: Sidebar (280px) + Main Content (1160px)

Left Sidebar (fixed):
- Background: Eerie Black (#252525)
- Box shadow: 4px 0 24px rgba(0, 0, 0, 0.3)
- Padding: 24px

- Logo (top):
  - "PataSpace" in white
  - Font: Poppins Bold, 24px
  
- User greeting:
  - Avatar: Circular, 48px, teal border (2px)
  - "Hello, John" (DM Sans Regular, 16px, white, opacity 0.8)
  - Balance below: "5,000 KES" (Poppins Bold, 20px, teal)
  
- Credit Card (compact):
  - Background: Teal (#28809A)
  - Border radius: 16px
  - Padding: 16px
  - "Your Balance" (white, 12px, opacity 0.8)
  - "5,000 KES" (white, 24px, bold)
  - "≈ 2 unlocks" (white, 12px, opacity 0.8)
  - "+ Buy" button (white, circular, small)
  
- Filters:
  - Section title: "FILTERS" (white, 12px, uppercase, opacity 0.6, letter-spacing 1px)
  - County dropdown:
    - Background: rgba(255, 255, 255, 0.1)
    - Border: 1px solid rgba(255, 255, 255, 0.2)
    - Border radius: 8px
    - Text: White
    - Icon: White chevron
  
  - Neighborhoods (checkboxes):
    - Custom checkbox: Teal when checked, white border when unchecked
    - Label: White, DM Sans 14px
    - List: Kilimani, Westlands, Lavington, Parklands
    - Scrollable if many options
  
  - Rent Range:
    - Label: "Rent Range" (white, 14px)
    - Dual-handle slider:
      - Track: rgba(255, 255, 255, 0.2)
      - Active range: Teal
      - Handles: White circles with teal border
    - Min/Max labels: "10K - 50K" (white, 12px)
  
  - Bedrooms:
    - Pill buttons: "Any" | "1+" | "2+" | "3+"
    - Inactive: rgba(255, 255, 255, 0.1), white text
    - Active: Teal background, white text
    - Border radius: 999px
  
  - Bathrooms: Same as bedrooms
  
  - Property Type (checkboxes):
    - Same style as neighborhoods
    - Apartment, Bedsitter, Studio
  
  - Availability date picker (calendar icon)
  
- Bottom buttons:
  - "Clear Filters" (white text, transparent)
  - "Apply" (teal background, white text, full width)

Main Content Area:
- Background: White (#FFFFFF)
- Padding: 32px

- Top Bar:
  - Breadcrumb: "Home > Browse Listings" (DM Sans, 14px, Battleship Grey)
  - Results: "156 listings found" (Poppins Bold, 24px, Eerie Black)
  - Right side:
    - View toggle: Grid icon (active, teal) | List icon (grey)
    - Sort dropdown: "Newest First" (DM Sans, 14px)
      - Border: 1px solid #EDEDED
      - Border radius: 8px
      - Padding: 8px 16px
    - Map view button: Map icon (teal, circular button)
  
- Listings Grid (3 columns):
  - Gap: 24px between cards
  
  - Each listing card:
    - Background: White
    - Border: 1px solid #EDEDED
    - Border radius: 16px
    - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
    - Hover: Border changes to teal, slight lift (transform: translateY(-4px))
    - Transition: all 0.3s ease
    
    - Image section:
      - Height: 200px
      - Image: Cover, rounded top corners
      - Overlays:
        - Price badge (top-left): Teal background, white text "KES 20,000/mo"
          - Border radius: 0 0 16px 0
          - Padding: 8px 16px
        - Status badge (top-right): Green dot + "Available"
        - Bookmark icon (top-right corner): Heart outline, grey
          - Hover: Teal fill
      
    - Card body (padding 20px):
      - Price: "KES 20,000/mo" (Poppins Bold, 22px, Teal)
      - Location: "📍 Kilimani, Nairobi" (DM Sans, 15px, Eerie Black)
      - Metadata row:
        - Icons + text: "🛏️ 2 bed • 🚿 1 bath" (DM Sans, 14px, Battleship Grey)
      - Description: One line, ellipsis (DM Sans, 14px, grey)
      - Stats row:
        - "45 views • 3 unlocks" (DM Sans, 12px, grey)
      
    - Hover state:
      - "View Details" button appears (teal, white text, rounded pill)
      - Positioned at bottom of card
  
- Pagination:
  - Style: Numbered pages + arrows
  - Active page: Teal background, white text
  - Inactive: White background, grey text
  - Border radius: 50% for page buttons

Top Navigation (if logged in):
- Background: White
- Border bottom: 1px solid #EDEDED
- Search bar (center):
  - Width: 400px
  - Background: Anti-flash White
  - Border radius: 999px
  - Placeholder: "Search neighborhoods..."
  - Icon: Teal search icon (right side)
- Notifications icon: Grey bell, teal badge count
- Profile avatar: Circular, dropdown on click
```

### WEB-06: LISTING DETAILS (FULL PAGE)
```
Create a detailed property listing page.

Design Specifications:
- Desktop: 1440px wide
- Background: Anti-flash White (#EDEDED)
- Layout: Content (840px) + Sidebar (360px), 24px gap

Left Column:
- Photo Gallery:
  - Main image container:
    - Background: White
    - Border radius: 16px
    - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
    - Image: 840x560px, rounded
    - Hover: Cursor zoom-in
  
  - Thumbnail strip (below):
    - 10 thumbnails, 80x80px each
    - Gap: 8px
    - Active thumbnail: Teal border (3px)
    - Inactive: Grey border (1px)
    - Hover: Scale(1.05)
  
  - "View All 10 Photos" button overlay:
    - Position: Bottom-right of main image
    - Background: Teal with opacity 0.9
    - Color: White
    - Icon: Grid icon
    - Border radius: 999px

- Property Header Card:
  - Background: White
  - Border radius: 16px
  - Padding: 32px
  - Shadow: elevated
  
  - Price: "KES 20,000/mo" (Poppins Bold, 36px, Teal)
  - Location: "📍 123 Argwings Kodhek Road, Kilimani" (DM Sans, 18px, Eerie Black)
  
  - Metadata pills (row):
    - Each pill:
      - Background: Anti-flash White
      - Border radius: 999px
      - Padding: 8px 16px
      - Icon + text
    - "🛏️ 2 bedrooms" | "🚿 1 bathroom" | "🏢 Apartment" | "📐 850 sq ft"
    - Font: DM Sans, 14px, Battleship Grey
  
  - Available: "Available from Apr 1, 2026" (DM Sans, 16px, grey)

- Tab Navigation (sticky):
  - Background: White
  - Border bottom: 1px solid #EDEDED
  - Tabs: "Overview" | "Amenities" | "Location" | "Reviews"
  - Active tab:
    - Font: Poppins Bold
    - Underline: 3px Teal
  - Inactive:
    - Font: DM Sans Regular
    - Color: Battleship Grey
  - Hover: Color changes to Teal

- Content Sections:
  - Overview:
    - Card background: White
    - Padding: 32px
    - Border radius: 16px
    - Description: DM Sans Regular, 16px, line-height 1.6
    - "Read more" link if long: Teal text
  
  - Amenities (2-column grid):
    - Background: White
    - Each item:
      - Teal checkmark icon (20px)
      - Text: DM Sans, 16px, Eerie Black
    - Items: Water 24/7, Generator, Parking, Security, etc.
  
  - From Tenant:
    - Card: White background
    - Border-left: 4px solid Teal
    - Padding: 24px
    - Quote: DM Sans Italic, 18px, Battleship Grey
    - Attribution: "— John K., Moving to Mombasa" (DM Sans, 14px, grey)
  
  - Location:
    - Map: 840px width, 400px height
    - Border radius: 16px
    - Marker: Custom teal pin
    - Note: "Exact address revealed after unlock" (grey box, centered on map)

Right Sidebar (sticky):
- Unlock CTA Card:
  - Background: White
  - Border: 2px solid Teal
  - Border radius: 16px
  - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
  - Padding: 32px
  
  - Header: "Unlock Contact Information" (Poppins Bold, 20px)
  - Price: "2,000 KES" (Poppins Bold, 48px, Teal)
  - Subtext: "≈ 10% of monthly rent" (DM Sans, 14px, grey)
  
  - Divider: 1px solid #EDEDED
  
  - Benefits list:
    - "What you get:" (DM Sans Bold, 14px, uppercase, grey)
    - Items (teal checkmarks):
      - ✓ Tenant's phone number
      - ✓ Exact address
      - ✓ GPS coordinates
      - ✓ WhatsApp contact
    - Font: DM Sans, 14px
  
  - Button: "Unlock Now" (full width, teal bg, white text, 48px height, rounded pill)
  
  - Balance note: "Your balance: 5,000 KES ✓" (DM Sans, 12px, grey, centered)

- Refund Badge Card:
  - Background: Teal with opacity 0.1
  - Border: 1px solid Teal
  - Border radius: 12px
  - Padding: 16px
  - Icon: Shield (teal)
  - Text: "💯 Full refund if landlord rejects you" (DM Sans Bold, 14px, Teal)

- GPS Verified Card:
  - Background: Anti-flash White
  - Border radius: 12px
  - Padding: 16px
  - Icon: Checkmark (teal)
  - Title: "GPS Verified" (DM Sans Bold, 14px, Eerie Black)
  - Text: "Photos taken at exact location" (DM Sans, 12px, grey)

- Stats Card:
  - Background: White
  - Border radius: 12px
  - Padding: 20px
  - Title: "Listing Stats" (DM Sans Bold, 14px)
  - Rows:
    - Views: 127 (grey icon + number)
    - Unlocks: 5
    - Listed: 3 days ago
  - Font: DM Sans, 14px, grey

- Report button (bottom):
  - Text link: "Report listing" (DM Sans, 12px, grey)
  - Hover: Teal
```

### WEB-07: PHOTO LIGHTBOX
```
Create a fullscreen photo viewer overlay.

Design Specifications:
- Fullscreen: 100vw x 100vh
- Background: Eerie Black with opacity 0.98
- ESC or click outside to close

Content:
- Main image:
  - Centered, max 1200px width
  - Maintain aspect ratio
  - Border radius: 16px (if not fullscreen)

- Navigation arrows:
  - Circular buttons (60px diameter)
  - Background: Teal with opacity 0.9
  - Icon: White chevron
  - Position: Left/right sides (fixed, 40px from edge)
  - Hover: Opacity 1, slight scale
  - Click: Smooth transition to next/previous

- Top bar:
  - Background: Transparent
  - Position: Fixed top
  - Padding: 24px
  - Content:
    - Photo counter (left): "3 of 10" (White, DM Sans, 16px)
    - Close button (right): White "×" (36px), circular teal bg on hover
    - Share button (right, before close): White icon, circular teal bg on hover

- Bottom bar:
  - Background: rgba(37, 37, 37, 0.9)
  - Padding: 16px
  - Thumbnail strip:
    - Horizontal scroll
    - Each thumbnail: 60x60px
    - Gap: 8px
    - Active: Teal border (3px)
    - Inactive: Grey border (1px)
    - Border radius: 8px
  
  - GPS badge (if photo has GPS):
    - "📍 GPS Verified" (white text)
    - Coordinates: "-1.2896, 36.7909" (white, mono font, 12px)
    - Background: Teal pill

Interactions:
- Left/Right arrow keys: Navigate
- Click image: Zoom toggle (2x)
- Pinch/scroll to zoom (if supported)
- Drag when zoomed: Pan image
- Smooth transitions (0.3s ease)
```

### WEB-08: ADVANCED FILTERS MODAL
```
Create an advanced search/filters modal.

Design Specifications:
- Modal: 900px wide, max 80vh height
- Background: White
- Border radius: 16px
- Shadow: 0 8px 40px rgba(0, 0, 0, 0.2)
- Overlay: rgba(37, 37, 37, 0.6)

Header:
- Background: Anti-flash White
- Padding: 24px 32px
- Border bottom: 1px solid #EDEDED
- Layout: Title (left) + Actions (right)
- Title: "Advanced Filters" (Poppins Bold, 24px, Eerie Black)
- "Clear All" button: Teal text, no background
- Close "×" button: Grey icon, circular hover bg

Content (scrollable):
- Padding: 32px
- Layout: 2 columns (440px each, 20px gap)

Left Column:
- Section: Location
  - Title: "LOCATION" (DM Sans Bold, 12px, uppercase, grey, letter-spacing 1px)
  - County dropdown:
    - Border: 1px solid #EDEDED
    - Border radius: 8px
    - Padding: 12px
    - Font: DM Sans, 14px
    - Icon: Grey chevron
  - Neighborhoods:
    - Multi-select tags (pill style)
    - Selected: Teal background, white text
    - Unselected: Anti-flash white, eerie black text
    - Border radius: 999px
    - Padding: 6px 12px
    - × icon to remove

- Section: Property Details
  - Rent Range:
    - Dual slider (same as sidebar)
    - Manual inputs below:
      - Min: [____] (border, rounded)
      - Max: [____]
      - Font: DM Sans, 14px
  - Bedrooms (pills): Any | 1+ | 2+ | 3+ | 4+
    - Active: Teal
    - Inactive: Anti-flash white
  - Bathrooms (same)
  - Property Type (checkboxes):
    - Custom checkbox design
    - Checked: Teal fill
    - Unchecked: Grey border
    - Labels: Apartment, Bedsitter, Studio, House
  - Furnished (toggle switch):
    - Inactive: Grey
    - Active: Teal

Right Column:
- Section: Availability
  - Date pickers:
    - "Available from" calendar icon
    - "Available to" calendar icon
    - Style: Border, rounded, calendar icon (teal)
  - Move-in timeline dropdown

- Section: Amenities
  - Checkboxes (same style):
    - Water 24/7, Generator, Parking, Security, Gym, Pool, Pet-friendly
  - "Show more..." expandable link (teal)

- Section: Listing Quality
  - Toggle switches:
    - GPS Verified only
    - Has video
    - Minimum 10 photos
  - Each toggle: Grey off, Teal on

Footer (sticky):
- Background: Anti-flash White
- Padding: 24px 32px
- Border top: 1px solid #EDEDED
- Layout: 3 parts
  - Left: Results preview "156 listings match" (DM Sans, 14px, grey)
  - Center: "Reset All" button (border, rounded, grey text)
  - Right: "Show Results" button (teal bg, white text, 48px height, rounded pill)
```

### WEB-09: MAP VIEW
```
Create a map-based property listing view.

Design Specifications:
- Fullscreen: 100vw x 100vh
- Split: Map (65%) | Sidebar (35%)

Map Section:
- Background: Embedded map (Google Maps / Mapbox)
- Style: Clean, minimal labels
- Custom markers:
  - Shape: Teardrop pin
  - Color: Teal (#28809A)
  - Price label: White text on teal background
  - Example: "20K" displayed in pin
  - Shadow: 0 2px 8px rgba(0, 0, 0, 0.2)
- Clusters (when zoomed out):
  - Circular: Teal background
  - White number
  - Size scales with count
  
- Map Controls (floating):
  - Zoom +/- buttons:
    - Position: Bottom-right
    - Background: White
    - Border radius: 8px
    - Shadow: elevated
    - Icon: Grey, hover teal
  - "Center on my location" button:
    - Position: Above zoom
    - Circular, white background
    - Blue/teal location icon
  - "Satellite/Map" toggle:
    - Position: Top-right
    - White background, rounded

- Search area button (top-center):
  - "Search this area" pill button
  - Background: White
  - Teal text and icon
  - Shadow: elevated
  - Appears after map moves

Pin Hover State:
- Mini card appears above pin:
  - Background: White
  - Border radius: 12px
  - Shadow: 0 4px 16px rgba(0, 0, 0, 0.15)
  - Content:
    - Tiny thumbnail (60x60px)
    - Price (Poppins Bold, 16px, Teal)
    - Location (DM Sans, 12px, grey)
    - Bedrooms/bathrooms
  - Arrow pointing to pin

Listings Sidebar:
- Background: White
- Width: 35%
- Height: 100vh
- Overflow: Scroll
- Shadow: -4px 0 24px rgba(0, 0, 0, 0.1)

- Header:
  - Background: Anti-flash White
  - Padding: 24px
  - "23 listings in this area" (Poppins Bold, 20px)
  - Sort dropdown (right)
  - "List View" button (switches back to grid)
    - Icon + text
    - Border: 1px teal
    - Rounded

- Listing Cards (compact):
  - Horizontal layout:
    - Thumbnail (100x100px, left, rounded)
    - Info (right):
      - Price (Poppins Bold, 18px, Teal)
      - Location (DM Sans, 14px, grey)
      - Beds/baths (DM Sans, 12px, grey)
    - Hover: Background becomes Anti-flash White
    - Active (corresponding pin): Teal left border (4px)
  - Gap: 1px between cards
  - Click: Opens full listing details

Bottom action:
- "Load more" button (if more listings)
- Teal text, centered
```

### WEB-10: SAVED / FAVORITES
```
Create a saved listings page.

Design Specifications:
- Desktop: 1440px wide
- Background: White
- Layout: Same sidebar as browse page

Top Section:
- Background: Anti-flash White
- Padding: 40px
- Heading: "Saved Properties" (Poppins Bold, 36px, Eerie Black)
- Count: "You have 12 saved listings" (DM Sans, 18px, Battleship Grey)
- Controls (right):
  - View toggle: Grid (active, teal) | List (grey)
  - Sort dropdown
  - "Edit" button: Opens multi-select mode
    - Active state: "Done" in teal

Main Content:
- Grid layout (3 columns, same as browse)
- Listing cards (same style):
  - Heart icon is FILLED with teal
  - Hover heart: Shows tooltip "Remove from saved"
  - Click heart: Confirmation modal
    - "Remove from saved?"
    - "Cancel" | "Remove" (teal)

- Edit mode (when "Edit" clicked):
  - Checkboxes appear on cards (top-left)
  - Custom checkbox: Teal when checked
  - Bottom toolbar appears:
    - Background: White
    - Shadow: elevated, top only
    - "X selected" (left)
    - "Remove Selected" button (right, red text)
    - "Cancel" button

Empty State:
- Centered content:
  - Heart outline icon (100px, grey)
  - Heading: "No Saved Properties Yet" (Poppins Bold, 28px)
  - Body: "Browse listings and tap the heart icon to save them" (DM Sans, 16px, grey)
  - "Start Browsing" button (teal bg, white text, rounded pill)

Collections (future feature):
- Tabs above grid:
  - "All Saved" (active, teal underline)
  - "Favorites" | "Under 20K" | "Kilimani"
  - "+ New Collection" button (teal, pill)
```

### WEB-11: SEARCH RESULTS
```
Create a search results page.

Design Specifications:
- Same layout as browse (WEB-05)
- Additional elements:

Search Header Card:
- Background: White
- Border radius: 16px
- Padding: 24px
- Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
- Margin bottom: 32px

- Search query display:
  - "Results for:" (DM Sans, 14px, grey)
  - "'Kilimani 2 bedroom'" (Poppins Bold, 24px, Eerie Black)
  - Edit button (teal, icon pencil)

- Did you mean? (if typo):
  - "Showing results for 'Kilimani'. Did you mean" 
  - "'Kitisuru'?" (teal link)
  - Background: Light yellow tint

- Related searches (pills):
  - Horizontal scroll if many
  - Each pill:
    - Background: Anti-flash White
    - Border: 1px solid #EDEDED
    - Border radius: 999px
    - Padding: 8px 16px
    - Hover: Border teal, text teal
  - Examples: "Westlands 2BR" | "Lavington" | "Under 25K"

Results Grid:
- Same as browse page
- Search terms highlighted in listings:
  - Background: Yellow highlight
  - Or: Teal underline

Sort Options:
- Additional option: "Relevance" (default for search)
- Other options: Price, Newest, etc.

No Results State:
- Centered card:
  - Icon: Magnifying glass (grey, 100px)
  - "No results for '[query]'" (Poppins Bold, 28px)
  - Suggestions:
    - "Try different keywords"
    - "Browse popular neighborhoods:"
    - Pills: Kilimani, Westlands, Lavington, etc.
  - "Clear all filters" button (if filters active)
```

### WEB-12: SEARCH AUTOCOMPLETE
```
Create a search interface with live suggestions.

Design Specifications:
- Can be overlay/modal or dedicated page
- Focus: Large search experience

Search Bar (hero):
- Width: 600px, centered
- Height: 60px
- Background: White
- Border: 2px solid #EDEDED
- Border radius: 999px
- Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
- Focus: Border becomes teal

- Icon: Teal search icon (left, 24px from edge)
- Input: DM Sans, 18px, placeholder grey
- Clear button: Grey "×" (right, circular, appears when typing)

Before Typing (default state):
- Background: White
- Padding: 40px

- Popular Searches:
  - Heading: "POPULAR SEARCHES" (DM Sans Bold, 12px, uppercase, grey)
  - List of cards:
    - Each card: Horizontal layout
    - Icon: Trending up (teal)
    - Text: "Kilimani 2 bedroom" (DM Sans, 16px)
    - Hover: Background Anti-flash White
  
- Recent Searches (if history exists):
  - Heading: "RECENT"
  - Same card style
  - Icon: Clock (grey)
  - Delete icon (right): × on hover
  - Clear all button: "Clear history" (teal text, small)

- Browse by Neighborhood:
  - Heading: "BROWSE BY NEIGHBORHOOD"
  - Grid: 4 columns
  - Cards:
    - Background image (photo of neighborhood)
    - Overlay: Gradient (dark bottom)
    - Text: "Kilimani" (white, Poppins Bold, 20px, bottom-left)
    - Hover: Scale(1.05), teal border

While Typing (autocomplete):
- Dropdown: Width matches search bar (600px)
- Background: White
- Border radius: 16px
- Shadow: 0 8px 32px rgba(0, 0, 0, 0.12)
- Max height: 400px, scrollable

- Sections:
  - Neighborhoods (top):
    - Icon: Location pin (teal)
    - Text: Matched text in bold
    - Example: "Kili**mani**" (bold part matches query)
  
  - Suggested Searches:
    - Icon: Search (grey)
    - Full query suggestions
  
  - Recent Matches:
    - Icon: Clock (grey)

- Each result:
  - Padding: 12px 20px
  - Hover: Background teal with opacity 0.1
  - Selected (keyboard nav): Border-left teal (4px)
  - Font: DM Sans, 15px

- Keyboard navigation:
  - Up/down arrows: Navigate results
  - Enter: Search selected
  - Escape: Close dropdown

Empty Results:
- Icon: Magnifying glass with × (grey, 80px)
- "No results for '[query]'"
- "Try different keywords" (grey, 14px)
- "Contact support" link (teal)
```

---

## 🔓 UNLOCK & CONFIRMATION (4 Screens)

### WEB-13: UNLOCK CONFIRMATION MODAL
```
Create an unlock confirmation modal.

Design Specifications:
- Modal: 500px wide
- Background: White
- Border radius: 16px
- Shadow: 0 8px 40px rgba(0, 0, 0, 0.2)
- Overlay: rgba(37, 37, 37, 0.6)
- Padding: 40px

Content:
- Icon (top, centered):
  - Lock → Unlock animation
  - Size: 80px
  - Color: Teal to outline, transitions to unlocked

- Heading: "Unlock Contact Information?"
  - Font: Poppins Bold, 24px, Eerie Black
  - Center-aligned

- Property summary card:
  - Background: Anti-flash White
  - Border radius: 12px
  - Padding: 16px
  - Layout: Thumbnail (60px) + Info
  - Text: "KES 20,000/mo • Kilimani" (DM Sans, 14px)

- Cost breakdown:
  - Background: White
  - Border: 1px solid #EDEDED
  - Border radius: 12px
  - Padding: 20px
  - Rows:
    - "Unlock Cost" | "2,000 KES" (bold, teal)
    - "Current Balance" | "5,000 KES" (grey)
    - Divider (1px, #EDEDED)
    - "New Balance" | "3,000 KES" (bold, eerie black)
  
- What you'll receive (list):
  - Title: "What you'll get:" (DM Sans Bold, 14px, uppercase, grey)
  - Items with teal checkmarks:
    - ✓ Tenant's phone number
    - ✓ Full address
    - ✓ GPS coordinates
    - ✓ WhatsApp contact
  - Font: DM Sans, 14px

- Refund policy callout:
  - Background: Teal with opacity 0.1
  - Border-left: 4px teal
  - Border radius: 8px
  - Padding: 16px
  - Icon: Info circle (teal)
  - Text: "Full refund if landlord rejects you" (DM Sans, 14px)

- Buttons (stacked, full width):
  - "Unlock for 2,000 KES" button:
    - Background: Teal
    - Color: White
    - Height: 48px
    - Border radius: 999px
    - Font: Poppins Bold, 16px
    - Hover: Darker teal, slight scale
  - "Cancel" button:
    - Background: Transparent
    - Color: Battleship Grey
    - Height: 48px
    - Hover: Anti-flash White background

Interactions:
- ESC key: Close
- Click outside: Close
- Loading state: Button shows spinner (white on teal)
- Success: Animate to success screen or close and redirect
```

### WEB-14: CONTACT REVEALED (SUCCESS PAGE)
```
Create a contact revealed page.

Design Specifications:
- Desktop: 1440px wide
- Background: Anti-flash White
- Layout: Centered content (800px)

Success Banner (top):
- Background: Teal
- Height: 80px
- Color: White
- Icon: Checkmark (animated entry)
- Text: "✓ Contact Information Unlocked!" (Poppins Bold, 20px)
- Confetti animation (brief, falls from top)

Main Card:
- Background: White
- Border radius: 16px
- Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
- Padding: 40px

- Property Summary:
  - Small carousel (3 thumbnails, 100px each)
  - Price and location below
  - "Unlocked today at 2:30 PM" (DM Sans, 14px, grey)

- Contact Card (elevated):
  - Background: Anti-flash White
  - Border-radius: 12px
  - Padding: 32px
  
  - Profile section:
    - Avatar (80px, circular, teal border 2px)
    - Name: "John Kamau" (Poppins Bold, 24px, Eerie Black)
    - Label: "Current Tenant" (DM Sans, 14px, grey)
    - Member since: "Since Feb 2026" (DM Sans, 12px, lighter grey)
  
  - Contact Details (table rows):
    - Each row:
      - Icon (teal, 24px) | Label | Value | Action button
      - Border bottom: 1px solid #EDEDED
      - Padding: 16px 0
    
    - Phone: 
      - Icon: Phone
      - "+254 712 345 678"
      - Actions: [Copy] [Call] buttons (small, rounded, teal outline)
    
    - WhatsApp:
      - Icon: WhatsApp (green)
      - "+254 712 345 678"
      - Action: [Message] button (green background)
    
    - Address:
      - Icon: Location pin
      - "123 Argwings Kodhek Road, Apt 5B"
      - Action: [Copy] button
    
    - GPS:
      - Icon: Map pin
      - "-1.2896, 36.7909"
      - Action: [Open in Maps] button

  - Large Action Buttons (side by side):
    - "📞 Call Now" (teal bg, white text, 50% width)
    - "💬 WhatsApp" (green bg, white text, 50% width)
    - Gap: 16px
    - Height: 56px
    - Border radius: 999px

- What's Next Card:
  - Background: White
  - Border: 1px solid #EDEDED
  - Border radius: 12px
  - Padding: 24px
  
  - Title: "What's Next?" (Poppins Bold, 20px)
  - Timeline (horizontal):
    - Step 1: ✓ Contact Unlocked (green, completed)
    - Step 2: View Property (teal, current)
    - Step 3: Confirm Connection (grey, future)
    - Step 4: Commission Paid (grey, future)
    - Visual: Connected dots/lines
  
  - Next action: "After viewing the property, confirm if you're moving in" (DM Sans, 14px, grey)

Sidebar (optional, right):
- Property photos (vertical stack)
- Quick facts card
- "Save property" button
- "Share with roommate" button (teal outline)
```

### WEB-15: CONFIRMATION FLOW
```
Create incoming tenant confirmation page.

Design Specifications:
- Desktop: 1440px wide
- Background: White
- Layout: Centered (900px)

Progress Header:
- Background: Anti-flash White
- Padding: 24px
- Border radius: 16px
- Content:
  - "Confirm Your Connection" (Poppins Bold, 28px)
  - Progress indicator:
    - "Step 1 of 2" (DM Sans, 14px, grey)
    - Visual bar: 50% filled (teal), 50% grey
    - Height: 8px, rounded ends

Property Reminder Card:
- Background: White
- Border: 1px solid #EDEDED
- Border radius: 12px
- Padding: 20px
- Layout: Horizontal (thumbnail 80px + info)
- "Unlocked 3 days ago" (DM Sans, 12px, grey)

Main Confirmation Card:
- Background: White
- Border-radius: 16px
- Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
- Padding: 40px

- Heading: "Are you moving into this property?"
  - Font: Poppins Bold, 28px, Eerie Black
  
- Subheading: "Only confirm if you're actually taking this apartment"
  - Font: DM Sans, 16px, Battleship Grey

- Checklist (required):
  - Each item:
    - Custom checkbox:
      - Unchecked: 24px square, grey border (2px), rounded (4px)
      - Checked: Teal background, white checkmark
    - Label: DM Sans, 16px, Eerie Black
    - Padding: 16px 0
  
  - Items:
    - ☐ I've viewed the property in person
    - ☐ I've been approved by the landlord
    - ☐ I'm moving in within 30 days
    - ☐ I understand this confirmation is binding
  
  - All must be checked to enable submit

- Warning Card:
  - Background: Yellow with opacity 0.1
  - Border-left: 4px yellow
  - Border radius: 8px
  - Padding: 20px
  - Icon: Warning triangle (yellow/orange)
  - Title: "⚠️ Please Note" (DM Sans Bold, 16px)
  - Text: "False confirmations may result in account suspension" (DM Sans, 14px)

- Info Section:
  - Title: "What happens next:" (DM Sans Bold, 16px)
  - List (teal checkmarks):
    - ✓ Outgoing tenant receives 600 KES (in 7 days)
    - ✓ Listing is marked as rented
    - ✓ You can rate your experience

- Form Fields:
  - Move-in date:
    - Label: "Move-in Date" (DM Sans Bold, 14px)
    - Date picker (calendar icon, teal accent)
    - Border: 1px #EDEDED, rounded
  
  - Notes (optional):
    - Label: "Additional Notes"
    - Textarea: Placeholder "Any special arrangements..."
    - Border: 1px #EDEDED, rounded
    - Character count: "0/200"

Buttons:
- "Confirm I'm Moving In" (full width):
  - Background: Teal
  - Color: White
  - Height: 56px
  - Border radius: 999px
  - Font: Poppins Bold, 16px
  - Disabled state: Grey background (until all checkboxes checked)
  - Enabled state: Teal, hover darker

- "Not Yet" button:
  - Background: Transparent
  - Border: 1px solid #EDEDED
  - Color: Battleship Grey
  - Height: 56px
  - Border radius: 999px
  - Hover: Anti-flash White background

Final Confirmation Modal (on click):
- Overlay modal
- "Are you sure?"
- Final warning text
- "Yes, Confirm" (teal) | "Go Back" (grey)
```

### WEB-16: CONFIRMATION STATUS TRACKER
```
Create a status tracking page for unlock progression.

Design Specifications:
- Desktop: 1440px wide
- Background: Anti-flash White
- Layout: Content (700px) + Sidebar (400px), centered, 40px gap

Left Column - Timeline:
- Background: White
- Border radius: 16px
- Padding: 40px
- Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)

- Property Header (collapsed):
  - Small thumbnail (60px)
  - Price and location
  - "View Property" link (teal)

- Vertical Timeline:
  - Connector line: 2px solid #EDEDED (vertical, left-aligned)
  
  - Step 1: Contact Unlocked ✓
    - Dot: 24px circle, teal background, white checkmark
    - Title: "Contact Unlocked" (Poppins Bold, 18px, Eerie Black)
    - Timestamp: "Mar 15, 2026 at 2:30 PM" (DM Sans, 14px, grey)
    - Expandable details:
      - Click to expand/collapse
      - Shows: Credits spent, Contact info
      - Background: Anti-flash White (when expanded)
      - Border-left: 4px teal
  
  - Step 2: Property Viewed (optional) ✓
    - Dot: 24px circle, grey background, grey checkmark
    - Title: "Property Viewed"
    - "Mark as viewed" button (if not done):
      - Small, teal outline, rounded
  
  - Step 3: Your Confirmation ✓
    - Dot: Green background, white checkmark
    - Title: "You Confirmed"
    - Date: "Mar 18, 2026"
    - Your note: "I'm moving in on Apr 1" (italic, grey box)
    - Edit button (small, teal text)
  
  - Step 4: Tenant Confirmation (current, active)
    - Dot: 24px circle, teal background, pulsing animation
    - Title: "Waiting for Outgoing Tenant" (Poppins Bold, 18px)
    - Status: "Usually confirms within 3 days" (DM Sans, 14px, grey)
    - Progress:
      - "2 of 14 days elapsed"
      - Visual bar: 14% filled (teal), rest grey
      - Thin bar, rounded
    - "Send Reminder" button:
      - Small, teal outline
      - Icon: Bell
    - Auto-confirmation notice:
      - "Auto-confirms in 12 days" (small, grey, info icon)
  
  - Step 5: Commission Payment (future)
    - Dot: Grey outline circle
    - Title: "Commission Payment" (grey text)
    - Info: "7 days after both confirmations"
    - Amount: "600 KES to outgoing tenant"

Right Sidebar:
- Contact Card:
  - Background: White
  - Border-radius: 16px
  - Padding: 24px
  - Shadow: 0 4px 20px rgba(0, 0, 0, 0.08)
  
  - Title: "Need to Follow Up?" (Poppins Bold, 18px)
  - Tenant info:
    - Name + phone
  - Quick actions:
    - "📞 Call" button (teal, full width, 44px height)
    - "💬 WhatsApp" button (green, full width)
    - "✉️ Email" button (grey, full width)
    - Gap: 12px between buttons

- Help Card:
  - Background: Anti-flash White
  - Border-radius: 12px
  - Padding: 20px
  - Margin-top: 24px
  
  - Title: "Tenant Not Confirming?" (DM Sans Bold, 16px)
  - FAQ (expandable):
    - "What's the auto-confirmation policy?" ▼
    - "What if tenant won't confirm?"
    - "Can I cancel my confirmation?"
    - Click to expand (teal arrow rotates)
  
  - "Report Issue" button:
    - Bottom of card
    - Teal text, no background
    - Icon: Flag

- Notification Preferences:
  - Background: White
  - Border-radius: 12px
  - Padding: 20px
  - Margin-top: 24px
  
  - Title: "Notifications" (DM Sans Bold, 14px, uppercase, grey)
  - Toggle switches:
    - "Email me when tenant confirms"
    - "SMS reminder in 5 days"
  - Toggle design:
    - Inactive: Grey background
    - Active: Teal background
    - White circle (slider)

Bottom Action:
- "Cancel Connection" button:
  - Color: Red
  - Background: Transparent
  - Border: 1px red
  - Border radius: 999px
  - Confirmation required on click
```