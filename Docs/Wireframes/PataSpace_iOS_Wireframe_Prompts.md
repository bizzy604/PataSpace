# PATASPACE iOS WIREFRAME PROMPTS
## Google Stitch Prompts | Apple Human Interface Guidelines

**Design System Reference:**
- Font: SF Pro (iOS system font)
- Colors: System colors (iOS dynamic colors)
- Components: Native iOS UIKit components
- Spacing: 8pt grid system
- Safe areas: Respect notch and home indicator

---

## 🎯 AUTHENTICATION FLOW (5 SCREENS)

### SCREEN 01: SPLASH / WELCOME
```
Create an iOS app splash screen for PataSpace, a housing marketplace app in Kenya.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Full-screen gradient background using warm terracotta colors (#D2691E to #A0522D)
- Centered app logo or wordmark "PataSpace" using SF Pro Display Bold, 48pt, white color
- Tagline below logo: "Find Housing 3X Faster" in SF Pro Text Regular, 20pt, white with 80% opacity
- Bottom area (respecting safe area): Two rounded rectangle buttons stacked vertically with 16pt spacing
  - "Get Started" button: Filled white background, terracotta text, 16pt corner radius, 50pt height
  - "I Have an Account" button: Outlined white border (2pt), white text, 16pt corner radius, 50pt height
- All content respects iPhone notch and home indicator safe areas
- Use iOS standard 16pt horizontal margins

Apple HIG Compliance:
- SF Pro font family
- Rounded buttons with proper touch targets (minimum 44pt)
- Respects safe area insets
- Clear visual hierarchy
```

### SCREEN 02: ONBOARDING CAROUSEL (3 PAGES)
```
Create three iOS onboarding screens for PataSpace housing app, designed as a horizontal page control carousel.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt) 
- Each page has the same structure:
  - Top: Large illustration or icon (300x300pt) centered, using terracotta accent color
  - Middle: Headline in SF Pro Display Bold, 28pt, center-aligned, dark text
  - Below headline: Body text in SF Pro Text Regular, 17pt, center-aligned, gray text (systemGray), 2-3 lines
  - Bottom: Page control dots (3 dots), current page highlighted in terracotta, others in light gray
  - Bottom button: "Next" button for pages 1-2, "Get Started" for page 3

Page 1:
- Icon: Large photo/camera symbol
- Headline: "Real Photos, Real Homes"
- Body: "See actual photos from current tenants. No fake listings, just honest homes."

Page 2:
- Icon: Clock/speed symbol
- Headline: "Save 12+ Hours"
- Body: "View everything online before visiting. Only see properties you're serious about."

Page 3:
- Icon: Shield/checkmark symbol
- Headline: "GPS Verified & Safe"
- Body: "All photos are GPS-verified. Full refund if landlord rejects you."

Apple HIG Compliance:
- UIPageViewController pattern
- Page control indicator at bottom
- Swipeable horizontal scroll
- Skip button in top-right corner (all pages except last)
- Proper safe area margins
```

### SCREEN 03: PHONE REGISTRATION
```
Create an iOS registration screen for PataSpace app following Apple HIG.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar at top:
  - Title: "Create Account" (SF Pro Text Semibold, 17pt, center-aligned)
  - Back button on left: "< Back" in terracotta color
  - Background: White with subtle bottom border
- Content area (scrollable):
  - Heading: "Enter Your Phone Number" (SF Pro Display Bold, 28pt)
  - Subheading: "We'll send you a verification code" (SF Pro Text Regular, 15pt, systemGray)
  - Phone input field:
    - Label above: "Phone Number" (SF Pro Text Regular, 13pt, systemGray)
    - Text field with Kenya flag emoji and +254 prefix
    - Placeholder: "712 345 678"
    - iOS standard text field with rounded corners
  - First Name field (same styling as phone)
  - Last Name field (same styling as phone)
  - Password field with eye icon to show/hide
  - Password requirements text (small, gray): "Min 8 characters, 1 uppercase, 1 number"
- Bottom area (above safe area):
  - Large "Continue" button: Terracotta background, white text, 16pt corner radius, full width with 16pt margins
  - Legal text: "By continuing, you agree to our Terms & Privacy Policy" (11pt, center-aligned, systemGray)

Apple HIG Compliance:
- UINavigationBar with standard back button
- UITextField with proper keyboard types (phone number keyboard)
- Standard iOS form spacing (20pt between fields)
- Floating labels or top-aligned labels
- Safe area insets respected
- Button in fixed position above keyboard when active
```

### SCREEN 04: OTP VERIFICATION
```
Create an iOS OTP verification screen for PataSpace app.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Verify Phone" (SF Pro Text Semibold, 17pt)
  - Back button: "< Back"
- Content area (centered vertically):
  - Icon: Large checkmark circle in terracotta (80x80pt)
  - Heading: "Enter Verification Code" (SF Pro Display Bold, 28pt, center-aligned)
  - Subheading: "Sent to +254 712 345 678" (SF Pro Text Regular, 15pt, systemGray, center-aligned)
  - OTP input: 6 separate boxes in a row
    - Each box: 50x56pt, rounded corners (12pt radius), light gray border
    - Active box: Terracotta border
    - Filled boxes: Show single digit, SF Pro Display Semibold, 24pt
  - Timer text: "Resend code in 0:45" (SF Pro Text Regular, 15pt, systemGray)
  - Resend button: "Resend Code" (terracotta text, no background) - shown when timer reaches 0:00
- Bottom:
  - "Verify" button: Terracotta background, white text, full width, disabled state until all 6 digits entered

Apple HIG Compliance:
- UITextField with number pad keyboard
- Auto-focus and auto-advance between boxes
- Haptic feedback on completion
- Standard iOS loading spinner when verifying
- Proper error state with shake animation
```

### SCREEN 05: LOGIN
```
Create an iOS login screen for PataSpace app.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Welcome Back" (SF Pro Text Semibold, 17pt)
  - Back button: "< Back"
- Content area:
  - App logo/icon at top (100x100pt, centered, 40pt from top)
  - Heading: "Sign In" (SF Pro Display Bold, 34pt)
  - Phone number field:
    - Label: "Phone Number"
    - Kenya flag emoji + +254 prefix
    - Standard iOS text field
  - Password field:
    - Label: "Password"
    - Secure text field with show/hide eye icon
  - "Forgot Password?" link (terracotta color, right-aligned, 15pt)
  - Spacing: 24pt between elements
- Bottom area:
  - "Sign In" button: Terracotta background, white text, full width
  - Divider text: "or" (centered, with horizontal lines)
  - "Create New Account" button: Outlined terracotta border, terracotta text

Apple HIG Compliance:
- Standard UITextField components
- Secure text entry for password
- Proper keyboard types (phone number pad)
- Clear error messaging below fields
- Loading state on sign-in button
- Keyboard avoidance (content scrolls up when keyboard appears)
```

---

## 🏠 MAIN APP FLOW (25 SCREENS)

### SCREEN 06: HOME - BROWSE LISTINGS (TAB 1)
```
Create an iOS home screen for PataSpace app showing property listings.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Find Your Home" (SF Pro Display Bold, 34pt, large title style)
  - Right button: Filter icon (SF Symbol: "slider.horizontal.3")
  - Search bar below title: iOS standard search bar with placeholder "Search by neighborhood..."
- Credit balance card (just below nav bar):
  - Compact card with terracotta gradient background
  - Left side: "Balance" label + "5,000 KES" (SF Pro Display Semibold, 20pt, white)
  - Right side: "+" icon button in white circle
  - Card height: 70pt, rounded corners (12pt), horizontal margins 16pt
- Filter chips (horizontal scroll):
  - Pill-shaped buttons: "Kilimani", "Westlands", "15-25K", "2 BR"
  - Active state: Terracotta background, white text
  - Inactive: Light gray background, dark text
  - Height: 32pt, spacing: 8pt between chips
- Listings (vertical scroll):
  - Each listing card:
    - Top: Image placeholder (full width, 200pt height, 12pt corner radius)
    - Badge overlay on image: "Available" (green background, white text, top-right corner)
    - Price: "KES 20,000/mo" (SF Pro Display Bold, 22pt, terracotta)
    - Location: "📍 Kilimani, Nairobi" (SF Pro Text Regular, 15pt, dark)
    - Metadata row: "🛏️ 2 bed • 🚿 1 bath • 🔓 3 unlocks" (SF Pro Text Regular, 13pt, systemGray)
    - Description snippet: One line of text, truncated (systemGray)
    - Bottom: "View Details" button (terracotta text, right-aligned)
  - Card spacing: 16pt between cards, 16pt horizontal margins
- Bottom tab bar (5 tabs):
  - Icons: Home (filled), Search, Post (+), Credits, Profile
  - Active tab: Terracotta color
  - Inactive: systemGray

Apple HIG Compliance:
- Large title navigation bar with inline search
- UITableView or UICollectionView for listings
- UITabBar with 5 items (standard iOS pattern)
- Pull to refresh gesture
- Smooth scroll performance
- SF Symbols for icons
```

### SCREEN 07: LISTING DETAILS
```
Create an iOS listing details screen for PataSpace app.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Back button: "< Listings"
  - Right buttons: Share icon, Heart icon (bookmark)
  - Translucent background (scrolls under)
- Content (vertical scroll):
  - Hero image carousel:
    - Full-width images, swipeable horizontally
    - Page control dots at bottom of images
    - Photo count badge: "1/10" (white text, dark background, top-right corner)
    - Height: 375pt
  - Sticky price bar (appears on scroll):
    - White background with shadow
    - "KES 20,000/mo" (SF Pro Display Bold, 20pt)
    - "Unlock Contact" button (terracotta, compact)
  - Property header section:
    - Price: "KES 20,000/mo" (SF Pro Display Bold, 28pt, terracotta)
    - Location: "📍 Kilimani, Nairobi" (SF Pro Text Regular, 17pt)
    - Metadata pills: "🛏️ 2 bed", "🚿 1 bath", "🏢 Apartment" (light gray background, 8pt spacing)
    - Available date: "Available from Apr 1, 2026" (SF Pro Text Regular, 15pt, systemGray)
  - Stats row (3 columns):
    - "45 Views" | "3 Unlocks" | "2 days ago"
    - Each column: Number (bold) above label (gray)
    - Light gray background, rounded corners
  - Section: Description
    - Heading: "About This Property" (SF Pro Text Semibold, 20pt)
    - Body text: 3-4 lines, expandable with "Read more" link
  - Section: Amenities
    - Heading: "Amenities" (SF Pro Text Semibold, 20pt)
    - Grid layout (2 columns):
      - "✅ Water 24/7", "✅ Generator", "✅ Parking", etc.
      - Each item: Green checkmark + text
  - Section: From Current Tenant
    - Quote card: Light background, left border (terracotta)
    - Quote text in italics
    - Tenant name and move-out date
  - Section: Location
    - Map preview (static or interactive, 200pt height)
    - "Exact address revealed after unlock" text
  - GPS Verified badge:
    - Green checkmark shield icon
    - "GPS Verified" text
    - "Photos taken at this location" subtext
- Bottom bar (fixed):
  - Left: Unlock cost "2,000 KES" (bold)
  - Right: "Unlock Contact" button (terracotta, large)
  - White background with top shadow

Apple HIG Compliance:
- UIScrollView with sections
- UIPageViewController for image carousel
- Sticky header pattern
- Bottom bar respects safe area
- Standard section headers
- Map integration (MapKit preview)
```

### SCREEN 08: PHOTO GALLERY (FULLSCREEN)
```
Create an iOS fullscreen photo gallery for PataSpace listing.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Full-screen immersive view (status bar hidden)
- Navigation overlay (top):
  - Translucent dark background
  - Close button: "✕" (top-left, white)
  - Photo counter: "3 of 10" (top-center, white, SF Pro Text Regular, 17pt)
  - Share button: Share icon (top-right, white)
- Image display:
  - Full-screen zoomable image
  - Pinch to zoom gesture support
  - Swipe left/right to navigate
  - Double-tap to zoom
- Bottom overlay (translucent dark):
  - Thumbnail strip (horizontal scroll):
    - Small thumbnails (60x60pt each)
    - Current photo highlighted with terracotta border
    - Spacing: 8pt between thumbnails
  - GPS badge (if photo has GPS):
    - "📍 GPS Verified" with green checkmark
    - Small text showing coordinates

Apple HIG Compliance:
- Modal presentation (full screen)
- UIPageViewController for swipeable images
- Gesture recognizers (pinch, swipe, double-tap)
- Translucent overlays (UIVisualEffectView with blur)
- Dismissible with swipe down gesture
```

### SCREEN 09: FILTERS SHEET
```
Create an iOS filter bottom sheet for PataSpace property search.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Modal sheet presentation (slides up from bottom, rounded top corners)
- Sheet content:
  - Top handle: Horizontal gray bar (centered, 36x5pt, 8pt from top)
  - Header:
    - Title: "Filters" (SF Pro Display Bold, 28pt, left-aligned)
    - Clear All button (terracotta text, right-aligned)
  - Content sections (vertical scroll):
    - Section: County
      - Single selection segmented control: "Nairobi" selected
    - Section: Neighborhoods
      - Multi-select chips (wrap layout):
        - "Kilimani", "Westlands", "Lavington", "Parklands", etc.
        - Selected state: Terracotta background, white text
        - Unselected: Light gray border, dark text
    - Section: Rent Range
      - Two-handle range slider
      - Min/Max labels below: "10,000 KES" - "50,000 KES"
      - iOS standard UISlider with terracotta accent
    - Section: Bedrooms
      - Horizontal pill buttons: "Any", "1+", "2+", "3+"
      - Single selection
    - Section: Bathrooms
      - Same as bedrooms
    - Section: Property Type
      - Checkboxes: "Apartment", "Bedsitter", "Studio", "House"
    - Section: Availability
      - Date picker: "Available from" date
  - Bottom bar (fixed):
    - Results count: "156 listings" (left side, systemGray)
    - "Show Results" button (terracotta, right side)

Apple HIG Compliance:
- Sheet presentation (UISheetPresentationController)
- Medium detent initially, expandable to large
- Standard form components (UISlider, UISegmentedControl, UISwitch)
- Haptic feedback on selections
- Dismissible by swipe down
```

### SCREEN 10: UNLOCK CONFIRMATION SHEET
```
Create an iOS unlock confirmation sheet for PataSpace.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Modal sheet (rounded top corners, slides up from bottom)
- Content:
  - Icon: Large lock icon (terracotta, 80x80pt, centered)
  - Heading: "Unlock Contact Information?" (SF Pro Display Bold, 24pt, center-aligned)
  - Property summary card:
    - Small thumbnail image (60x60pt, rounded)
    - Property details: "KES 20,000/mo • Kilimani"
    - Light gray background, rounded corners
  - Cost breakdown:
    - "Unlock Cost: 2,000 KES" (SF Pro Text Semibold, 17pt)
    - Subtitle: "≈ 10% of monthly rent"
    - Divider line
    - "New Balance: 3,000 KES" (SF Pro Text Regular, 15pt, systemGray)
  - What you'll get (list):
    - "✓ Tenant's phone number"
    - "✓ Full address"
    - "✓ GPS coordinates"
    - "✓ Direct WhatsApp contact"
    - Each item: Green checkmark + text (SF Pro Text Regular, 15pt)
  - Refund policy callout:
    - Light yellow background
    - Info icon
    - "Full refund if landlord rejects you"
  - Bottom buttons (stacked):
    - "Unlock for 2,000 KES" (terracotta, filled)
    - "Cancel" (systemGray text, no background)

Apple HIG Compliance:
- Alert-style sheet presentation
- Clear action hierarchy
- Destructive action clearly marked
- Dismissible with cancel
- Haptic feedback on confirm
```

### SCREEN 11: CONTACT REVEALED
```
Create an iOS screen showing unlocked contact information.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Contact Information" (SF Pro Text Semibold, 17pt)
  - Back button: "< Listing"
- Success banner (top of content):
  - Green background
  - Checkmark icon + "Contact Unlocked!" text
  - Height: 60pt
- Contact card (main content):
  - White card with shadow, rounded corners
  - Profile section:
    - Avatar placeholder circle (60x60pt)
    - Name: "John Kamau" (SF Pro Display Semibold, 22pt)
    - Role: "Current Tenant" (SF Pro Text Regular, 15pt, systemGray)
  - Contact details (list items):
    - Phone: "+254 712 345 678" with call icon button
    - WhatsApp: "Message on WhatsApp" with WhatsApp icon button
    - Address: "123 Argwings Kodhek Rd, Apt 5B" with copy icon
    - GPS: "-1.2896, 36.7909" with "Open in Maps" link
    - Each row: Icon (left) + Info (center) + Action button (right)
  - Divider
  - Action buttons (horizontal):
    - "📞 Call Now" button (terracotta, 50% width)
    - "💬 WhatsApp" button (green, 50% width)
- Next steps card:
  - Light blue background, rounded corners
  - "What's Next?" heading
  - Steps list:
    - "1. Contact the tenant"
    - "2. View the property"
    - "3. Confirm if you're moving in"
  - "Got it" button at bottom
- Timeline section:
  - Heading: "Unlock Timeline"
  - Step indicators:
    - "Unlocked - Today" (completed, green check)
    - "Confirm Connection - Pending" (current, terracotta dot)
    - "Commission Paid - In 7 days" (future, gray dot)

Apple HIG Compliance:
- UITableView for contact details
- Tappable rows with disclosure indicators
- System share sheet for contact actions
- Deep links to Phone app and WhatsApp
- Copy to clipboard functionality
```

### SCREEN 12: POST LISTING - CAMERA
```
Create an iOS camera screen for posting property photos in PataSpace.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Full-screen camera view
- Top overlay (translucent dark):
  - Close button: "✕" (top-left, white)
  - Title: "Take Photos" (top-center, white)
  - Flash toggle (top-right, SF Symbol: "bolt.fill")
- Camera viewfinder:
  - Full-screen camera preview
  - Grid overlay (rule of thirds, white lines, 50% opacity)
  - Focus reticle (appears on tap)
- Bottom overlay:
  - GPS status indicator:
    - "📍 GPS Active" (green dot + text, centered above controls)
    - Or "⚠️ GPS Required" if GPS not available (yellow)
  - Photo counter: "5/15 photos" (white text, left side)
  - Camera controls (center):
    - Large circular shutter button (white, 80x80pt)
    - Gallery preview thumbnail (bottom-left, 60x60pt, shows last photo)
    - Camera flip button (bottom-right, SF Symbol: "camera.rotate")
  - Progress bar:
    - Shows 5/15 photos required (terracotta filled, gray unfilled)
    - "Minimum 5 photos required" text
- Instructions banner (dismissible):
  - Light overlay at top
  - "📸 Tip: Take clear photos of each room"
  - Dismiss "✕" button

Apple HIG Compliance:
- AVCaptureSession with camera preview
- Full-screen immersive mode
- Haptic feedback on capture
- GPS location services prompt
- Photo library access prompt
- Respect safe areas for controls
```

### SCREEN 13: POST LISTING - PHOTO REVIEW
```
Create an iOS photo review screen for property listing.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Review Photos" (SF Pro Text Semibold, 17pt)
  - Back button: "< Camera"
  - Done button: "Next" (terracotta text, right side)
- Content:
  - Status card (top):
    - "5 of 5 minimum photos" (green checkmark)
    - "Add up to 10 more photos" (gray text)
  - Photo grid (3 columns):
    - Each photo: Square thumbnail with rounded corners
    - Delete button: Small "✕" in top-right corner (white on dark overlay)
    - Reorder handle: Drag indicator on bottom-right
    - GPS badge: Small green dot if GPS verified
    - First photo has "COVER" label overlay
    - Spacing: 4pt between photos
  - Add more button:
    - Dashed border square (same size as photos)
    - "+" icon centered
    - "Add More" text below
  - Video section:
    - Heading: "Property Video (Optional)"
    - Video thumbnail or "Record Video" button
    - "30 second max" subtitle
- Bottom bar:
  - "Continue to Details" button (terracotta, full width)
  - Disabled if less than 5 photos

Apple HIG Compliance:
- UICollectionView with grid layout
- Drag and drop reordering
- Delete gesture (swipe or long press)
- Image picker integration
- Loading states for GPS verification
```

### SCREEN 14: POST LISTING - PROPERTY DETAILS FORM
```
Create an iOS property details form for PataSpace listing.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Property Details" (SF Pro Text Semibold, 17pt)
  - Back button: "< Photos"
  - Progress indicator: "Step 2 of 3" (gray text)
- Form content (vertical scroll):
  - Section: Basic Information
    - Monthly Rent field:
      - Label: "Monthly Rent (KES)"
      - Number input: "20,000" with KES symbol
      - Helper text: "This sets your unlock cost at 2,000 KES"
    - Location fields (auto-filled from GPS):
      - County: "Nairobi" (disabled/gray, dropdown)
      - Neighborhood: "Kilimani" (editable dropdown)
      - Verified badge: "📍 GPS Verified"
    - Property Type picker:
      - Segmented control: "Apartment" | "Bedsitter" | "Studio" | "House"
    - Bedrooms/Bathrooms:
      - Two fields side by side
      - Stepper controls (- and + buttons)
      - Current value displayed in center
  - Section: Property Features
    - Furnished toggle switch (iOS standard)
    - Size field (optional): Square meters input
  - Section: Description
    - Multi-line text area:
      - Placeholder: "Describe your property (e.g., spacious, well-lit, quiet neighborhood...)"
      - Character count: "0/500"
      - Height: 120pt
  - Section: Amenities (multi-select)
    - Grid of chips:
      - "Water 24/7", "Generator", "Parking", "Security", "Gym", "Pool", etc.
      - Selected: Terracotta background
      - Unselected: Light gray border
  - Section: Availability
    - "Available From" date picker
    - "Available To" date picker (optional)
  - Section: Additional Notes
    - Text area: "Share insider tips about the landlord, neighborhood, utilities..."
    - Character count: "0/300"
- Bottom bar:
  - "Continue" button (terracotta, full width)
  - Validation errors shown above button if any

Apple HIG Compliance:
- UITableView with grouped sections
- Standard form controls (UITextField, UITextView, UISwitch, UIStepper)
- UIPickerView for dropdowns
- Keyboard avoidance (form scrolls up)
- Input validation with inline errors
- Auto-save draft functionality
```

### SCREEN 15: POST LISTING - REVIEW & SUBMIT
```
Create an iOS listing review screen before submission.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Review Listing" (SF Pro Text Semibold, 17pt)
  - Back button: "< Edit" (allows going back to form)
- Content (vertical scroll):
  - Preview card:
    - Header: "Your Listing Preview"
    - Shows exactly how listing will appear to users
    - Photo carousel (swipeable)
    - Price, location, bedrooms/bathrooms
    - Description
    - Edit button (top-right of card)
  - Earnings summary card:
    - Gradient background (terracotta)
    - White text
    - "Potential Earnings" heading
    - "600 KES" (large, bold) when someone moves in
    - Breakdown text: "30% of unlock fee (2,000 KES)"
  - What happens next section:
    - Timeline steps:
      - "1. We review your listing (24 hours)"
      - "2. Listing goes live"
      - "3. You get notified when someone unlocks"
      - "4. Earn commission after confirmation"
  - Terms checkbox:
    - "I confirm photos are accurate and taken at this property"
    - "I agree to PataSpace's terms and conditions"
    - Required before submit
  - Important notes (light yellow card):
    - "⚠️ First 3 listings require manual review"
    - "📸 Photos must match GPS location"
    - "💰 Earn 600 KES when connection is confirmed"
- Bottom bar:
  - "Submit Listing" button (terracotta, full width)
  - Disabled until checkbox is checked

Apple HIG Compliance:
- UIScrollView with stacked sections
- UISwitch or UICheckbox for terms
- Confirmation alert before submit
- Loading spinner during submission
- Success animation on completion
```

### SCREEN 16: LISTING SUBMITTED (SUCCESS)
```
Create an iOS success screen after listing submission.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title hidden
  - Close button: "✕" (top-right)
- Content (centered):
  - Success animation:
    - Large animated checkmark (terracotta, 120x120pt)
    - SF Symbol: "checkmark.circle.fill" with scale animation
  - Heading: "Listing Submitted!" (SF Pro Display Bold, 32pt, center-aligned)
  - Subheading: "We're reviewing your listing" (SF Pro Text Regular, 17pt, systemGray, center)
  - Status card (rounded, light background):
    - Timeline with 3 steps:
      - "Submitted - Just now" (completed, green check)
      - "Under Review - Next 24 hours" (current, terracotta dot)
      - "Published - After approval" (pending, gray dot)
  - What's next card:
    - "You'll receive a notification when:"
    - Bullet points:
      - "✓ Your listing is approved"
      - "✓ Someone unlocks your contact"
      - "✓ Commission is ready to pay"
  - Earnings reminder (terracotta card):
    - Icon: Money symbol
    - "Earn 600 KES when someone moves in"
    - "Track your earnings in the Credits tab"
- Bottom buttons:
  - "View My Listings" (terracotta, filled)
  - "Post Another Listing" (terracotta text, no background)

Apple HIG Compliance:
- Modal presentation (can't be dismissed by swipe)
- Core Animation for checkmark
- Haptic success feedback
- Clear navigation options
```

### SCREEN 17: MY LISTINGS TAB
```
Create an iOS screen showing user's posted listings.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "My Listings" (SF Pro Display Bold, 34pt)
  - Right button: "+ Post New" (terracotta text)
- Segmented control (below nav bar):
  - Three segments: "Active" | "Pending" | "Completed"
  - iOS standard UISegmentedControl
- Content (changes based on selected segment):
  - Active tab:
    - List of active listings
    - Each card shows:
      - Thumbnail image (left, 80x80pt, rounded)
      - Property info (right):
        - Price and location
        - "45 views • 3 unlocks" stats
        - Status badge: "Live" (green)
      - Chevron disclosure indicator (far right)
  - Pending tab:
    - Cards show:
      - "Under Review" status (yellow badge)
      - Estimated approval time: "~18 hours"
      - "Edit Listing" button
  - Completed tab:
    - Cards show:
      - "Rented" status (gray badge)
      - Earnings: "Earned 600 KES"
      - Move-in date
- Empty state (if no listings):
  - Centered content:
    - Icon: House with plus symbol (100x100pt, gray)
    - Heading: "No Listings Yet"
    - Body: "Post your first listing and start earning"
    - "Post Listing" button (terracotta)
- Pull to refresh

Apple HIG Compliance:
- UITableView with sections
- UIRefreshControl for pull-to-refresh
- Swipe actions: Edit, Delete (left swipe)
- Empty state pattern
- Disclosure indicators for navigation
```

### SCREEN 18: LISTING STATS / ANALYTICS
```
Create an iOS analytics screen for a specific listing.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Listing Analytics" (SF Pro Text Semibold, 17pt)
  - Back button: "< My Listings"
- Hero card (property summary):
  - Small carousel of property photos
  - Price and location
  - Status badge
- Stats cards (2x2 grid):
  - Total Views:
    - Large number: "127" (SF Pro Display Bold, 36pt)
    - Trend: "↑ 23 this week" (green, small)
  - Unlocks:
    - Number: "5"
    - Conversion: "3.9%" (views to unlocks)
  - Earnings Potential:
    - "3,000 KES" (if all 5 confirm)
    - "5 pending confirmations"
  - Days Active:
    - "12 days"
    - "Since Mar 10"
- Chart section:
  - Line graph: Views over time (last 7 days)
  - iOS Charts framework or simple bar chart
  - Terracotta accent color
- Recent activity feed:
  - List of events:
    - "John K. unlocked your listing - 2 hours ago"
    - "You got 12 new views - Yesterday"
    - "Status changed to Active - Mar 10"
  - Each item: Icon (left) + Text (center) + Time (right)
- Bottom bar:
  - "Edit Listing" button (terracotta outline)
  - "Mark as Rented" button (terracotta filled)

Apple HIG Compliance:
- UICollectionView for grid stats
- Charts framework integration
- Time-series data visualization
- Pull to refresh for latest stats
```

### SCREEN 19: CREDITS TAB (WALLET)
```
Create an iOS credits/wallet screen for PataSpace.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Credits" (SF Pro Display Bold, 34pt)
  - Right button: Transaction history icon (SF Symbol: "list.bullet.rectangle")
- Balance card (hero):
  - Large card with gradient background (terracotta to orange)
  - White text
  - "Your Balance" label (SF Pro Text Regular, 15pt, 80% opacity)
  - Balance: "5,000 KES" (SF Pro Display Black, 48pt)
  - Subtext: "≈ 2 unlocks available" (SF Pro Text Regular, 15pt, 80% opacity)
  - Card height: 180pt, rounded corners (16pt), shadow
- Quick actions (2 buttons below balance):
  - "Buy Credits" (terracotta, filled, left)
  - "Send Gift" (terracotta outline, right)
- Credit packages section:
  - Heading: "Buy Credits" (SF Pro Text Semibold, 20pt)
  - Package cards (vertical stack):
    - Basic package:
      - "5,000 KES" (price)
      - "5,000 Credits" (what you get)
      - "Most Popular" badge
    - Value package:
      - "10,000 KES"
      - "10,500 Credits" (5% bonus)
      - "Best Value" badge
    - Premium package:
      - "20,000 KES"
      - "22,000 Credits" (10% bonus)
  - Each card: Radio button (left) + Info (center) + Badge (right)
  - Selected package highlighted with terracotta border
- Transaction history preview:
  - Heading: "Recent Transactions" (SF Pro Text Semibold, 20pt)
  - "See All" link (right, terracotta)
  - Last 3 transactions:
    - Icon (credit/debit) + Description + Amount + Date
    - Green for credits, Red for debits
- Bottom bar:
  - "Continue" button (terracotta, full width)
  - Shows selected package price
  - Disabled if no package selected

Apple HIG Compliance:
- UITableView with sections
- Radio button selection (single choice)
- Standard list item layout
- Badge overlay for promotions
- Transaction history in grouped style
```

### SCREEN 20: BUY CREDITS - M-PESA FLOW
```
Create an iOS M-Pesa payment screen for PataSpace credits.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Buy Credits" (SF Pro Text Semibold, 17pt)
  - Back button: "< Credits"
- Content:
  - Payment summary card:
    - Package selected: "5,000 Credits"
    - Amount to pay: "5,000 KES" (large, bold)
    - Light background, rounded corners
  - M-Pesa logo (centered, 80pt wide)
  - Phone number section:
    - Label: "M-Pesa Phone Number"
    - Text field: Kenya flag + "+254" + input
    - Pre-filled with user's registered number
    - Edit button if needed
  - Instructions card (light blue background):
    - "How it works:" heading
    - Steps:
      - "1. Enter your M-Pesa number"
      - "2. You'll receive a prompt on your phone"
      - "3. Enter your M-Pesa PIN"
      - "4. Credits added instantly"
  - Security badge:
    - Shield icon + "Secured by Safaricom"
    - Small text, gray color
- Bottom bar:
  - "Pay 5,000 KES" button (terracotta, full width)
  - Legal text: "By continuing, you agree to M-Pesa's terms" (tiny, gray)

Apple HIG Compliance:
- Standard form layout
- Number pad keyboard for phone input
- Clear visual feedback
- Loading state during payment
```

### SCREEN 21: M-PESA PROCESSING
```
Create an iOS M-Pesa payment processing screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Processing Payment" (SF Pro Text Semibold, 17pt)
  - No back button (prevents navigation during processing)
- Content (centered vertically):
  - Animation:
    - M-Pesa logo with pulsing animation
    - Or spinning loading indicator (terracotta)
    - 120x120pt
  - Status messages (auto-updating):
    - "STK prompt sent to your phone" (first 5 seconds)
    - "Waiting for PIN entry..." (5-30 seconds)
    - "Processing payment..." (30-45 seconds)
  - Illustration:
    - Simple phone icon showing M-Pesa prompt
    - Or progress steps with checkmarks
  - Timer text: "This usually takes 30 seconds"
  - Help text: "Check your phone for the M-Pesa prompt"
- Bottom:
  - "Having trouble?" link (terracotta text)
  - "Cancel Payment" button (gray text, shows after 60 seconds)

Apple HIG Compliance:
- Modal presentation (can't be dismissed)
- Activity indicator (UIActivityIndicatorView)
- Timeout handling (2 minutes max)
- Cancellable with confirmation
- Haptic feedback on status changes
```

### SCREEN 22: PAYMENT SUCCESS
```
Create an iOS payment success screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title hidden
  - Close button: "✕" (top-right)
- Content (centered):
  - Success animation:
    - Large green checkmark (animated)
    - Confetti animation (optional, celebratory)
    - 140x140pt
  - Heading: "Payment Successful!" (SF Pro Display Bold, 32pt)
  - Amount card:
    - "5,000 Credits Added" (large, bold, terracotta)
    - Transaction ID: "MPE...61SV" (small, gray, monospace)
  - New balance card:
    - "Your New Balance" label
    - "10,000 KES" (SF Pro Display Semibold, 36pt)
    - "≈ 4 unlocks available" (gray subtitle)
  - Receipt section:
    - "View Receipt" button (terracotta text, icon)
    - Auto-send to SMS option
- Bottom buttons:
  - "Start Browsing" button (terracotta, filled)
  - "Done" button (gray text)

Apple HIG Compliance:
- Modal presentation
- Success haptic feedback
- Core Animation for checkmark
- Share sheet for receipt
- Confetti using CAEmitterLayer (optional)
```

### SCREEN 23: TRANSACTION HISTORY
```
Create an iOS transaction history screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Transactions" (SF Pro Display Bold, 34pt)
  - Back button: "< Credits"
  - Filter button: Filter icon (top-right)
- Filter chips (horizontal scroll, below nav):
  - "All" | "Credits Added" | "Unlocks" | "Refunds" | "Commissions"
  - Selected: Terracotta background
  - Unselected: Light gray background
- Transaction list (grouped by date):
  - Section headers: "Today", "Yesterday", "March 2026", etc.
  - Each transaction:
    - Icon (left):
      - "+" for credits added (green background)
      - "🔓" for unlocks (terracotta background)
      - "↩️" for refunds (blue background)
      - "💰" for commissions (gold background)
    - Transaction info (center):
      - Description: "Unlocked listing in Kilimani"
      - Date/time: "Mar 20, 2:30 PM"
      - Transaction ID: "TX...ABC" (small, gray)
    - Amount (right):
      - Positive: "+5,000 KES" (green)
      - Negative: "-2,000 KES" (red)
  - Tap to see details
- Empty state:
  - Icon: Receipt with magnifying glass
  - "No Transactions Yet"
  - "Your transaction history will appear here"
- Pull to refresh

Apple HIG Compliance:
- UITableView with sections (grouped by date)
- Disclosure indicators for details
- UIRefreshControl
- Swipe actions: Share, Report Issue
- Date formatting (relative and absolute)
```

### SCREEN 24: TRANSACTION DETAIL
```
Create an iOS transaction detail screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Transaction Details" (SF Pro Text Semibold, 17pt)
  - Back button: "< Transactions"
  - Share button: Share icon (top-right)
- Content:
  - Status banner:
    - Green for completed: "✓ Completed"
    - Yellow for pending: "⏱ Pending"
    - Red for failed: "✗ Failed"
  - Amount card (centered):
    - Large amount: "-2,000 KES" (SF Pro Display Bold, 48pt)
    - Transaction type: "Unlock Payment"
  - Details table:
    - Row: "Transaction ID" | "TX123ABC456" (monospace, copiable)
    - Row: "Date & Time" | "Mar 20, 2026 at 2:30 PM"
    - Row: "Status" | "Completed" (green badge)
    - Row: "Payment Method" | "Credits Balance"
    - Divider
    - Row: "Listing" | "KES 20,000/mo in Kilimani" (tappable, chevron)
    - Row: "Balance Before" | "7,000 KES"
    - Row: "Balance After" | "5,000 KES"
    - Divider (if M-Pesa)
    - Row: "M-Pesa Receipt" | "MPE...61SV" (copiable)
    - Row: "Transaction ID" | "ABC...XYZ"
  - Receipt card (if applicable):
    - "Receipt" heading
    - Download PDF button
    - Email Receipt button
- Bottom buttons:
  - "Get Help" (if issue)
  - "Request Refund" (if eligible, shows criteria)

Apple HIG Compliance:
- UITableView grouped style
- Copyable fields (long press to copy)
- Disclosure indicators for related items
- Share sheet for receipt
- System font for mono-spaced IDs
```

### SCREEN 25: CONFIRMATION FLOW - INCOMING TENANT
```
Create an iOS confirmation screen for incoming tenant.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Confirm Connection" (SF Pro Text Semibold, 17pt)
  - Back button: "< Unlocked"
- Content:
  - Progress card:
    - "Step 1 of 2: Your Confirmation"
    - Progress bar: 50% filled (terracotta)
  - Property summary:
    - Thumbnail image
    - "KES 20,000/mo in Kilimani"
    - "Unlocked 3 days ago"
  - Confirmation prompt:
    - Icon: Moving box or house key (80x80pt)
    - Heading: "Are you moving in?" (SF Pro Display Bold, 28pt)
    - Body text: "Confirm that you're taking this property and moving in. The outgoing tenant will also need to confirm."
  - Checklist (user must verify):
    - Checkbox: "I've viewed the property"
    - Checkbox: "I've been approved by the landlord"
    - Checkbox: "I'm moving in within 30 days"
    - All must be checked to proceed
  - Important information card (light yellow):
    - "⚠️ Important"
    - "Only confirm if you're actually moving in"
    - "False confirmations may result in account suspension"
  - What happens next:
    - "After both confirmations:"
    - "✓ Outgoing tenant receives 600 KES commission (in 7 days)"
    - "✓ Listing is marked as rented"
- Bottom buttons:
  - "Confirm I'm Moving In" button (terracotta, large)
  - Requires all checkboxes checked
  - Shows confirmation dialog before proceeding

Apple HIG Compliance:
- UISwitch or checkbox UI
- Confirmation alert (UIAlertController)
- Clear action consequences
- Validation before submit
- Success feedback after confirm
```

### SCREEN 26: CONFIRMATION STATUS
```
Create an iOS confirmation status tracking screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Connection Status" (SF Pro Text Semibold, 17pt)
  - Back button: "< Unlocks"
- Property card (top):
  - Small carousel of property photos
  - Price and location
  - "Unlocked 5 days ago"
- Timeline (vertical steps):
  - Step 1: "Contact Unlocked" (completed)
    - Green checkmark
    - "Mar 15, 2026"
    - Collapse/expand details
  - Step 2: "Property Viewed" (completed, optional)
    - Green checkmark
    - User can mark this manually
  - Step 3: "Your Confirmation" (completed)
    - Green checkmark
    - "You confirmed Mar 18"
    - "I'm moving in" quote
  - Step 4: "Tenant Confirmation" (current)
    - Terracotta pulsing dot
    - "Waiting for outgoing tenant"
    - "Usually confirms within 3 days"
    - Reminder options: "Send Reminder" button
  - Step 5: "Commission Payment" (future)
    - Gray outline
    - "7 days after both confirmations"
    - "600 KES to outgoing tenant"
- Contact card:
  - "Need to follow up?"
  - Tenant name and phone
  - "Call" and "WhatsApp" buttons
- Help section:
  - "Tenant not confirming?"
  - "Auto-confirmation in 11 days" (14 days from unlock)
  - "Report Issue" button
- Notification settings:
  - Toggle: "Notify me when tenant confirms"
  - Toggle: "Remind me to follow up"

Apple HIG Compliance:
- Expandable/collapsible sections
- Timeline visualization
- Push notification permissions
- Deep links to communication apps
```

### SCREEN 27: BOTH CONFIRMED (SUCCESS)
```
Create an iOS success screen when both parties confirm.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title hidden
  - Close button: "✕" (top-right)
- Content (centered and scrollable):
  - Success animation:
    - Two checkmarks merging/connecting
    - Or handshake icon with celebration animation
    - 140x140pt
  - Heading: "Connection Confirmed!" (SF Pro Display Bold, 32pt, terracotta)
  - Congratulations message:
    - "Both parties have confirmed"
    - "Enjoy your new home!"
  - Property summary card:
    - Photo thumbnail
    - Address revealed
    - Move-in date
  - Commission timeline card (for outgoing tenant):
    - "Commission Payment" heading
    - "600 KES will be paid on Mar 25, 2026"
    - Countdown: "7 days remaining"
    - Progress bar showing days
  - What's next section:
    - For incoming tenant:
      - "✓ Complete move-in process"
      - "✓ Set up utilities"
      - "✓ Rate your experience (optional)"
    - For outgoing tenant:
      - "✓ Complete move-out"
      - "✓ Commission will be sent to your M-Pesa"
      - "✓ Thank you for using PataSpace!"
  - Rating prompt (card):
    - "How was your experience?"
    - 5-star rating component
    - "Leave Review" button
- Bottom buttons:
  - "View Property Details" (outline)
  - "Done" (filled, terracotta)

Apple HIG Compliance:
- Celebration animation (Core Animation)
- Success haptic feedback
- Star rating component
- Dismissible modal
- Deep link to property
```

### SCREEN 28: PROFILE TAB
```
Create an iOS user profile screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Profile" (SF Pro Display Bold, 34pt)
  - Settings gear icon (top-right)
- Profile header:
  - Avatar (circular, 80x80pt, centered)
    - Placeholder or user photo
    - Edit button overlay (small camera icon)
  - Name: "John Kamau" (SF Pro Display Semibold, 24pt, center)
  - Phone: "+254 712 345 678" (SF Pro Text Regular, 15pt, gray, center)
  - Member since: "Joined Feb 2026" (small, gray)
- Stats cards (3 columns):
  - "2 Listings" | "3 Unlocks" | "600 KES Earned"
  - Each: Number (bold, large) above label (small, gray)
  - Light background, rounded corners
- Menu sections:
  - Section: Account
    - "Edit Profile" (chevron right)
    - "Verification Status" (checkmark badge if verified)
    - "Payment Methods" (chevron)
  - Section: My Activity
    - "My Listings" (count badge: "2")
    - "My Unlocks" (count badge: "3")
    - "Saved Properties" (heart icon)
    - "Transaction History"
  - Section: Support
    - "Help Center"
    - "Contact Support" (message icon)
    - "Report an Issue"
  - Section: About
    - "Terms of Service"
    - "Privacy Policy"
    - "App Version" (gray text, no chevron): "1.0.0 (Build 123)"
  - Section: Account Management
    - "Logout" (red text)
    - "Delete Account" (red text)
- Each row: Icon (left) + Label (center) + Badge/Chevron (right)

Apple HIG Compliance:
- UITableView grouped style
- Disclosure indicators
- Badges for counts
- System icons (SF Symbols)
- Destructive actions in red
- Image picker for avatar
```

### SCREEN 29: EDIT PROFILE
```
Create an iOS edit profile screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Edit Profile" (SF Pro Text Semibold, 17pt)
  - Cancel button (left)
  - Save button (right, terracotta, disabled until changes made)
- Content (scrollable form):
  - Avatar section:
    - Large circular avatar (120x120pt, centered)
    - "Change Photo" button below
    - Action sheet options: "Take Photo", "Choose from Library", "Remove Photo"
  - Form fields:
    - First Name:
      - Label: "First Name"
      - Text field: "John"
    - Last Name:
      - Label: "Last Name"
      - Text field: "Kamau"
    - Phone Number:
      - Label: "Phone Number"
      - Text field: "+254 712 345 678" (read-only, gray)
      - "Verified" badge (green)
      - Small text: "Contact support to change"
    - Email (optional):
      - Label: "Email Address"
      - Text field: "john@example.com"
      - "Add Email" if empty
    - Bio (optional):
      - Label: "About Me"
      - Multi-line text area
      - Placeholder: "Tell others about yourself..."
      - Character count: "0/200"
  - Verification section:
    - "Verify Your Identity" heading
    - "Upload ID for verification (optional)"
    - Benefits: "✓ Verified badge on listings"
    - "Upload Document" button
- Save changes prompt if navigating away with unsaved changes

Apple HIG Compliance:
- Standard form layout
- Image picker with permissions
- Inline validation
- Unsaved changes warning
- Keyboard avoidance
- Loading state on save
```

### SCREEN 30: SETTINGS
```
Create an iOS settings screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Settings" (SF Pro Text Semibold, 17pt)
  - Back button: "< Profile"
- Settings sections:
  - Section: Notifications
    - "Push Notifications" (toggle switch, right)
    - Subsections (if enabled):
      - "New Unlocks" (toggle)
      - "Confirmations" (toggle)
      - "Commission Payments" (toggle)
      - "Marketing Messages" (toggle)
  - Section: Privacy
    - "Phone Number Visibility" (segmented: "Public" | "Private")
    - "Profile Visibility" (toggle)
    - "Location Services" (status + arrow to system settings)
  - Section: Preferences
    - "Language" (English, Swahili options)
    - "Currency Display" (KES, USD)
    - "Dark Mode" (segmented: "Auto" | "Light" | "Dark")
  - Section: Data & Storage
    - "Clear Cache" (shows size: "45 MB")
    - "Download Data" (export user data)
  - Section: Security
    - "Change Password"
    - "Two-Factor Authentication" (toggle)
    - "Biometric Login" (Face ID/Touch ID toggle)
  - Section: About
    - "Rate PataSpace" (opens App Store)
    - "Share with Friends"
    - "Licenses & Credits"
    - "App Version: 1.0.0"

Apple HIG Compliance:
- UITableView grouped style
- UISwitch for toggles
- Disclosure indicators for sub-pages
- System settings integration
- Segmented controls for options
```

---

## 🔍 ADDITIONAL SCREENS (10 SCREENS)

### SCREEN 31: SEARCH
```
Create an iOS search screen for PataSpace.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Search bar:
  - Large search field at top (standard iOS search bar)
  - Placeholder: "Search neighborhoods, cities..."
  - Cancel button appears when active
  - Keyboard shows automatically
- Search suggestions (before user types):
  - Section: "Popular Neighborhoods"
    - List: "Kilimani", "Westlands", "Lavington", etc.
    - Each with location pin icon
  - Section: "Recent Searches" (if user has history)
    - List of previous searches
    - Clock icon for each
    - Swipe to delete
- Search results (after user types):
  - Autocomplete suggestions
  - Grouped by type:
    - Neighborhoods
    - Counties
    - Landmarks
  - Each result tappable
- Filter button (top-right):
  - Opens filter sheet
- Empty state (no results):
  - Magnifying glass icon
  - "No results for '[search term]'"
  - "Try different keywords"

Apple HIG Compliance:
- UISearchController
- UITableView for results
- Search bar in navigation bar
- Keyboard with search button
- Real-time filtering
```

### SCREEN 32: NOTIFICATIONS
```
Create an iOS notifications screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Notifications" (SF Pro Display Bold, 34pt)
  - Back button: "< Home"
  - Mark all read button (top-right)
- Segmented control:
  - "All" | "Unlocks" | "Payments" | "Listings"
- Notification list (grouped by date):
  - Section headers: "Today", "Yesterday", "This Week"
  - Each notification:
    - Icon (left, colored background):
      - 🔓 for unlocks (terracotta)
      - 💰 for payments (green)
      - 📋 for listings (blue)
      - ✓ for confirmations (green)
    - Content (center):
      - Bold title: "Someone unlocked your listing"
      - Detail: "KES 20,000/mo in Kilimani"
      - Time: "2 hours ago" (gray, small)
    - Unread indicator: Blue dot (far right)
  - Tap to navigate to relevant screen
  - Swipe left: "Mark Read" or "Delete"
- Empty state:
  - Bell icon (gray, 100x100pt)
  - "No New Notifications"
  - "You're all caught up!"
- Pull to refresh

Apple HIG Compliance:
- UITableView with sections
- Swipe actions
- Badge counts on tab bar
- Navigation to related content
- Date grouping
```

### SCREEN 33: SAVED / FAVORITES
```
Create an iOS saved properties screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Saved" (SF Pro Display Bold, 34pt)
  - Back button or part of tab bar
  - Edit button (top-right) - enables multi-select
- Filter/sort options:
  - Segmented control: "All" | "Under 20K" | "Over 20K"
  - Sort dropdown: "Recently Added" | "Price Low-High" | "Price High-Low"
- Saved listings grid:
  - 2 columns
  - Each card:
    - Property image
    - Heart icon (filled, terracotta) in top-right
    - Price badge overlay (bottom-left)
    - Below image:
      - Price and location
      - Bedrooms/bathrooms
      - "View" button
  - Long press to remove from saved
  - Tap to view details
- Edit mode:
  - Checkboxes appear on cards
  - Bottom toolbar:
    - "Remove Selected" button (destructive red)
    - "Select All" button
- Empty state:
  - Heart outline icon (100x100pt, gray)
  - "No Saved Properties"
  - "Tap the heart icon on any listing to save it"
  - "Start Browsing" button

Apple HIG Compliance:
- UICollectionView with grid layout
- Multi-select mode
- Swipe to delete
- Bottom toolbar in edit mode
- Haptic feedback on save/remove
```

### SCREEN 34: MAP VIEW
```
Create an iOS map view for property listings.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Full-screen map (MapKit):
  - Shows Nairobi area
  - Property pins (terracotta color)
  - Clustered pins when zoomed out
  - User location (blue dot)
- Top controls:
  - Search bar overlay (translucent white background)
  - "List View" button (top-right) to switch back
  - Center on my location button (floating, bottom-right)
- Pin annotations:
  - Custom pin with price: "20K" in terracotta circle
  - Tap to show callout:
    - Small thumbnail image
    - Price and neighborhood
    - "View Details" button
- Bottom sheet (draggable):
  - Collapsed state: Shows listings count "23 listings in this area"
  - Expanded state: Shows list of visible properties
  - Drag handle at top
  - Can be swiped up/down
- Filter button (floating, top-left):
  - Opens filter sheet
- Legend (if needed):
  - Price ranges color-coded

Apple HIG Compliance:
- MKMapView with custom annotations
- Sheet presentation controller
- Gesture recognizers (pinch, pan, tap)
- User location services
- Clustering for performance
```

### SCREEN 35: DISPUTE / REPORT ISSUE
```
Create an iOS dispute/report screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Report Issue" (SF Pro Text Semibold, 17pt)
  - Cancel button (left)
  - Submit button (right, disabled until valid)
- Content (scrollable form):
  - Issue type picker:
    - Label: "What went wrong?"
    - Options (segmented or dropdown):
      - "Landlord rejected without reason"
      - "Photos don't match property"
      - "Tenant not responding"
      - "Payment issue"
      - "Other"
  - Related listing (if applicable):
    - Small property card showing which listing
    - Auto-filled from context
  - Description text area:
    - Label: "Describe the issue"
    - Placeholder: "Please provide details..."
    - Character count: "0/500"
    - Minimum 50 characters required
  - Evidence upload:
    - "Add Evidence (Optional)"
    - Photo/document upload buttons
    - Shows thumbnails of uploaded files
    - Max 5 files
  - Contact preference:
    - "How should we reach you?"
    - Phone / Email / In-app only
- Important note (light blue card):
  - "We take disputes seriously"
  - "Response time: 24-48 hours"
  - "False reports may affect your account"
- Bottom:
  - "Submit Report" button (terracotta)
  - Validation: All required fields filled

Apple HIG Compliance:
- Standard form layout
- Text area with character limit
- Image picker integration
- Validation feedback
- Loading state on submit
- Success confirmation
```

### SCREEN 36: HELP CENTER / FAQ
```
Create an iOS help center screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar (large title):
  - Title: "Help Center" (SF Pro Display Bold, 34pt)
  - Back button: "< Profile"
  - Search icon (top-right)
- Search bar:
  - Placeholder: "Search for help..."
  - Standard iOS search bar
- Quick actions (cards):
  - "Contact Support" - message icon
  - "Report a Problem" - flag icon
  - "Video Tutorials" - play icon
  - Each card: Icon + Label, tappable
- FAQ sections (expandable):
  - Section: "Getting Started"
    - "How to create an account?"
    - "How to post a listing?"
    - "How to unlock contact?"
    - Each question expandable (accordion)
  - Section: "Payments & Credits"
    - "How to buy credits?"
    - "What payment methods are accepted?"
    - "How do refunds work?"
  - Section: "Safety & Trust"
    - "How is GPS verification done?"
    - "What if I'm scammed?"
    - "How to report fake listings?"
  - Section: "Commissions"
    - "How much can I earn?"
    - "When do I get paid?"
    - "How to track earnings?"
- Popular articles (if search active):
  - List of relevant help articles
  - Each with title, snippet, and chevron
- Contact support button (bottom):
  - Floating action button
  - WhatsApp or Email options

Apple HIG Compliance:
- UITableView with expandable sections
- UISearchController
- Disclosure indicators
- Expandable/collapsible rows
- Deep links to specific articles
```

### SCREEN 37: RATE & REVIEW
```
Create an iOS rating and review screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Rate Your Experience" (SF Pro Text Semibold, 17pt)
  - Close button: "✕" (top-right)
- Content (centered, scrollable):
  - Property summary card:
    - Small thumbnail
    - Address
    - "Your new home"
  - Star rating:
    - 5 large stars (44pt each, tappable)
    - "Tap to rate" instruction
    - Selected stars: Terracotta filled
    - Unselected: Gray outline
  - Rating labels (appear based on selection):
    - 1 star: "We're sorry it didn't work out"
    - 2 stars: "What could we improve?"
    - 3 stars: "It was okay"
    - 4 stars: "Great experience!"
    - 5 stars: "Amazing! Glad you found your home"
  - Review text (optional):
    - Label: "Share Your Experience (Optional)"
    - Multi-line text area
    - Placeholder: "Tell others about your experience..."
    - Character count: "0/300"
  - Specific ratings (if overall > 3 stars):
    - "Rate specific aspects:"
    - Photo Quality: 5-star mini rating
    - Tenant Responsiveness: 5-star mini rating
    - Value for Money: 5-star mini rating
  - Photo upload (optional):
    - "Add Photos" button
    - Show thumbnails if added
  - Privacy toggle:
    - "Post anonymously" switch
    - Default: OFF (shows first name only)
- Bottom:
  - "Submit Review" button (terracotta)
  - Skip button (gray text) - if optional

Apple HIG Compliance:
- Star rating component
- Conditional content based on rating
- Image picker integration
- Character count
- Validation before submit
```

### SCREEN 38: REFERRAL / INVITE FRIENDS
```
Create an iOS referral/invite screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Invite Friends" (SF Pro Text Semibold, 17pt)
  - Back button: "< Profile"
- Hero section:
  - Illustration: Two people shaking hands or gift icon (120x120pt)
  - Heading: "Give 500 KES, Get 500 KES" (SF Pro Display Bold, 28pt)
  - Subheading: "When your friend makes their first unlock"
- How it works (numbered steps):
  - "1. Share your unique code"
  - "2. Friend signs up with your code"
  - "3. They unlock their first property"
  - "4. You both get 500 KES credits!"
- Referral code card:
  - Large code display: "JOHN2026" (SF Pro Display Bold, 36pt, terracotta, center)
  - "Your Referral Code" label above
  - Copy button (icon) next to code
  - Copied feedback (checkmark animation)
- Share options:
  - Pre-filled message: "Join PataSpace and get 500 KES free credits! Use my code: JOHN2026 [link]"
  - Share buttons grid:
    - WhatsApp (green)
    - SMS (blue)
    - Copy Link (gray)
    - More... (system share sheet)
- Stats card:
  - "Your Referral Stats"
  - "3 Friends Joined" | "1,500 KES Earned"
  - "View Details" link
- Terms & conditions (small text):
  - "View Terms" link

Apple HIG Compliance:
- UIActivityViewController for sharing
- Clipboard for copy action
- Haptic feedback on copy
- Deep links with referral code
- Share sheet integration
```

### SCREEN 39: CONTACT SUPPORT
```
Create an iOS contact support screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Navigation bar:
  - Title: "Contact Support" (SF Pro Text Semibold, 17pt)
  - Back button: "< Help"
- Support options (cards):
  - Chat with us (recommended):
    - Icon: Message bubble
    - "Chat with Support"
    - "Usually responds in minutes"
    - "Start Chat" button (terracotta)
  - WhatsApp:
    - WhatsApp icon (green)
    - "+254 700 123 456"
    - "Message us on WhatsApp"
    - Opens WhatsApp app
  - Email:
    - Email icon
    - "support@pataspace.co.ke"
    - "Email Support"
    - Opens mail app with pre-filled template
  - Phone:
    - Phone icon
    - "+254 700 123 456"
    - "Call Support"
    - Available hours: "Mon-Fri 9AM-6PM EAT"
- FAQ quick links:
  - "Before you reach out, check if your question is answered:"
  - Common questions list (3-5 items)
  - Each expandable
- Ticket history (if user has open tickets):
  - "Your Open Tickets" section
  - List of previous support requests
  - Each shows: Subject, Status, Last updated
  - Tap to view details

Apple HIG Compliance:
- Action sheet style options
- Deep links to WhatsApp, Phone, Email
- UITableView for FAQ
- Disclosure indicators
- Time-sensitive information (hours)
```

### SCREEN 40: APP UPDATE / ONBOARDING NEW FEATURE
```
Create an iOS feature announcement/update screen.

Design Specifications:
- iPhone 14 Pro screen size (393x852pt)
- Modal presentation (full screen, rounded corners)
- Content (scrollable):
  - Badge: "New" or "What's New" (terracotta, top-center)
  - Illustration/animation:
    - Feature-specific graphic (200x200pt)
    - Animated if possible (Lottie)
  - Heading: "Introducing [Feature Name]" (SF Pro Display Bold, 32pt)
  - Description:
    - 2-3 sentences explaining the feature
    - Benefits highlighted
    - SF Pro Text Regular, 17pt
  - Feature highlights (if multiple):
    - Card 1: Icon + Title + Description
    - Card 2: Icon + Title + Description
    - Card 3: Icon + Title + Description
  - Video tutorial (optional):
    - Embedded video player
    - Play button overlay
    - "Watch Tutorial (30s)" label
  - Call-to-action:
    - "Try It Now" button (terracotta) - deep links to feature
    - "Maybe Later" button (gray text)
- Progress dots (if multiple features):
  - Shows which screen in sequence
  - Swipeable carousel
- Skip option:
  - "Skip Tour" link (top-right)
  - Or "Remind Me Later"

Apple HIG Compliance:
- Modal presentation (can be dismissed)
- Page control for multi-page
- Video player (AVPlayerViewController)
- Deep links to features
- Dismissible with close button
```

---

## 📝 USAGE INSTRUCTIONS FOR GOOGLE STITCH

### How to Use These Prompts:

1. **Copy each prompt exactly** (including all design specifications)
2. **Paste into Google Stitch** wireframe generator
3. **Generate wireframe** for each screen
4. **Export as PNG or PDF** for your design system

### Prompt Structure Explained:

Each prompt contains:
- **Screen dimensions** (iPhone 14 Pro: 393x852pt)
- **Navigation structure** (bar, back button, title)
- **Layout specifications** (spacing, sizing, alignment)
- **Component details** (buttons, cards, text fields)
- **Apple HIG compliance** (native iOS patterns)

### Customization Tips:

- **Change device:** Replace "iPhone 14 Pro (393x852pt)" with your target device
- **Adjust colors:** Replace terracotta (#D2691E) with your brand color
- **Modify content:** Update placeholder text with your actual content
- **Add/remove sections:** Customize each screen to your needs

---

## 🎨 DESIGN SYSTEM CONSISTENCY

All 40 screens follow these Apple HIG standards:

**Typography:**
- SF Pro Display (headlines)
- SF Pro Text (body)
- Sizes: 11pt to 48pt scale

**Spacing:**
- 8pt grid system
- Standard margins: 16pt horizontal
- Section spacing: 24pt vertical

**Components:**
- UINavigationBar (standard height: 44pt)
- UITabBar (standard height: 49pt + safe area)
- UIButton (minimum height: 44pt for touch target)
- UITableView (standard cell height: 44pt)

**Colors:**
- Primary: Terracotta (#D2691E)
- System colors: systemGray, systemGreen, systemRed
- Dynamic colors (light/dark mode support)

**Interactions:**
- Haptic feedback on important actions
- Pull to refresh on lists
- Swipe gestures (back, delete, actions)
- Long press for context menus

---

Let me save this comprehensive document:
