# PATASPACE iOS SCREENS - QUICK REFERENCE GUIDE
## 40 Screens Organized by User Flow

---

## 2026 Visual System Override

- Accent and active states: Teal `#28809A`
- Dark nav, tab bars, and hero panels: Eerie Black `#252525`
- Secondary text, metadata, and inactive icons: Battleship Grey `#8D9192`
- Search fields, muted cards, and chips: Anti-flash White `#EDEDED`
- Main canvas and elevated cards: White `#FFFFFF`
- Headings: Poppins Bold or DM Sans Bold
- Body and labels: DM Sans Regular
- Component language: dark navigation shell, teal active pill, white cards, circular teal CTA, generous 16px to 20px radii

Treat any legacy terracotta note in the detailed prompt document as replaced by this palette.

---

## 📱 COMPLETE SCREEN INVENTORY

### 🔐 AUTHENTICATION FLOW (5 Screens)
1. **Splash/Welcome** - First screen users see
2. **Onboarding Carousel** - 3-page feature introduction
3. **Phone Registration** - Sign up with phone number
4. **OTP Verification** - Verify phone with 6-digit code
5. **Login** - Returning user login

**Flow:** Splash → Onboarding → Register → OTP → (Home)

---

### 🏠 BROWSE & DISCOVER (9 Screens)
6. **Home - Browse Listings** - Main feed with property cards
7. **Listing Details** - Full property information
8. **Photo Gallery (Fullscreen)** - Immersive photo viewer
9. **Filters Sheet** - Advanced search filters
10. **Search** - Search by neighborhood/location
11. **Map View** - Properties on map with pins
12. **Saved/Favorites** - Bookmarked properties
13. **Listing Stats/Analytics** - Property performance metrics
14. **Notifications** - Activity feed

**Flow:** Home → Listing Details → Photo Gallery
**Alternative:** Home → Map View → Listing Details
**Filter:** Home → Filters Sheet → Filtered Results

---

### 🔓 UNLOCK FLOW (5 Screens)
10. **Unlock Confirmation Sheet** - Confirm unlock purchase
11. **Contact Revealed** - Show unlocked contact info
12. **Confirmation - Incoming Tenant** - "I'm moving in" confirmation
13. **Confirmation Status** - Track confirmation progress
14. **Both Confirmed (Success)** - Celebration screen

**Flow:** Listing Details → Unlock Confirmation → Contact Revealed → Confirm → Status → Success

---

### 📸 POST LISTING FLOW (6 Screens)
15. **Post Listing - Camera** - Take GPS-verified photos
16. **Post Listing - Photo Review** - Review and organize photos
17. **Post Listing - Property Details Form** - Enter property info
18. **Post Listing - Review & Submit** - Final preview
19. **Listing Submitted (Success)** - Confirmation screen
20. **My Listings Tab** - Manage posted listings

**Flow:** Camera → Photo Review → Details Form → Review → Submit → Success → My Listings

---

### 💳 CREDITS & PAYMENTS (8 Screens)
21. **Credits Tab (Wallet)** - Main credits screen
22. **Buy Credits - M-Pesa Flow** - Select package, enter phone
23. **M-Pesa Processing** - Payment in progress
24. **Payment Success** - Credits added confirmation
25. **Transaction History** - All transactions
26. **Transaction Detail** - Single transaction details
27. **Dispute/Report Issue** - File dispute or report
28. **Referral/Invite Friends** - Earn credits by referring

**Flow (Purchase):** Credits Tab → Buy Credits → M-Pesa → Processing → Success
**Flow (History):** Credits Tab → Transaction History → Transaction Detail

---

### 👤 PROFILE & SETTINGS (7 Screens)
29. **Profile Tab** - User profile overview
30. **Edit Profile** - Update personal information
31. **Settings** - App configuration
32. **Help Center/FAQ** - Support articles
33. **Contact Support** - Get help from team
34. **Rate & Review** - Rate experience
35. **App Update/New Feature** - Feature announcements

**Flow:** Profile → Edit Profile → (Save)
**Support:** Profile → Help Center → Contact Support
**Review:** (After move-in) → Rate & Review

---

## 🎯 NAVIGATION STRUCTURE

### Tab Bar (5 Tabs)
```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  Home   │ Search  │  Post   │ Credits │ Profile │
│   🏠    │   🔍    │   ➕    │   💳    │   👤    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

**Tab 1: Home** → Screen 06 (Browse Listings)
**Tab 2: Search** → Screen 31 (Search)
**Tab 3: Post** → Screen 15 (Post Listing Camera)
**Tab 4: Credits** → Screen 21 (Credits Wallet)
**Tab 5: Profile** → Screen 29 (Profile)

---

## 📊 SCREEN COMPLEXITY LEVELS

### Simple (5-10 min to design)
- Splash/Welcome
- OTP Verification
- Payment Success
- Listing Submitted
- Both Confirmed

### Medium (15-20 min to design)
- Login/Register
- Browse Listings
- Credits Tab
- My Listings
- Search

### Complex (30-45 min to design)
- Listing Details
- Post Listing Form
- Filters Sheet
- Confirmation Status
- Transaction History

### Very Complex (45-60 min to design)
- Photo Gallery (with gestures)
- Map View (with MapKit)
- Camera Screen (with GPS)
- Listing Analytics
- Dispute Flow

---

## 🔄 USER JOURNEYS

### Journey 1: First-Time User → Find Housing
```
Splash → Onboarding → Register → OTP → Home (Browse) → 
Listing Details → Photo Gallery → Unlock Confirmation → 
Contact Revealed → Confirmation → Both Confirmed → Rate & Review
```
**Screens Used:** 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 34
**Total: 12 screens**

---

### Journey 2: Outgoing Tenant → Post Listing
```
Home (Tab 3: Post) → Camera → Photo Review → 
Details Form → Review & Submit → Submitted → My Listings
```
**Screens Used:** 15, 16, 17, 18, 19, 20
**Total: 6 screens**

---

### Journey 3: Buy Credits → Unlock Property
```
Credits Tab → Buy Credits → M-Pesa → Processing → 
Success → Browse → Listing Details → Unlock → Contact Revealed
```
**Screens Used:** 21, 22, 23, 24, 6, 7, 10, 11
**Total: 8 screens**

---

### Journey 4: Repeat User → Browse & Save
```
Login → Home → Filters → Browse → Listing Details → 
Save (Heart) → Saved Tab → Map View
```
**Screens Used:** 5, 6, 9, 7, 33, 34
**Total: 6 screens**

---

## 🎨 DESIGN PRIORITIES

### Phase 1: MVP (Must-Have) - 20 Screens
Critical for launch:
1. Welcome (1)
2. Register (3)
3. OTP (4)
4. Login (5)
5. Home (6)
6. Listing Details (7)
7. Photo Gallery (8)
8. Filters (9)
9. Unlock Confirmation (10)
10. Contact Revealed (11)
11. Camera (15)
12. Photo Review (16)
13. Details Form (17)
14. Review & Submit (18)
15. Submitted (19)
16. My Listings (20)
17. Credits Tab (21)
18. Buy Credits (22)
19. M-Pesa Processing (23)
20. Payment Success (24)

### Phase 2: Enhancement - 10 Screens
Important for complete experience:
21. Onboarding (2)
22. Confirmation Flow (12, 13, 14)
23. Transaction History (25, 26)
24. Profile (29)
25. Settings (31)
26. Notifications (32)
27. Search (31)

### Phase 3: Polish - 10 Screens
Nice-to-have features:
28. Map View (34)
29. Saved/Favorites (33)
30. Listing Analytics (13)
31. Edit Profile (30)
32. Help Center (35)
33. Contact Support (36)
34. Rate & Review (37)
35. Referral (38)
36. Dispute (27)
37. App Update (40)

---

## 📋 CHECKLIST FOR GOOGLE STITCH

### Before You Start:
- [ ] Read Apple HIG documentation
- [ ] Review PataSpace mobile palette: `#252525`, `#8D9192`, `#EDEDED`, `#FFFFFF`, `#28809A`
- [ ] Understand user flows (see above)
- [ ] Prepare placeholder images/icons

### For Each Screen:
- [ ] Copy prompt exactly from main document
- [ ] Paste into Google Stitch
- [ ] Generate wireframe
- [ ] Verify iOS compliance (nav bar, tab bar, safe areas)
- [ ] Check spacing (8pt grid)
- [ ] Validate touch targets (minimum 44pt)
- [ ] Export as PNG (2x or 3x for retina)
- [ ] Name file clearly (e.g., "01-splash.png")

### After Generation:
- [ ] Organize in folders by flow (Auth, Browse, Post, etc.)
- [ ] Create clickable prototype (use Figma/InVision)
- [ ] Share with team for feedback
- [ ] Iterate based on user testing

---

## 🚀 PRODUCTION TIMELINE

### Week 1: Authentication & Core Flows (8 screens)
- Screens 1-5: Auth flow
- Screens 6-8: Browse basics

### Week 2: Unlock & Post Flows (12 screens)
- Screens 9-14: Unlock flow
- Screens 15-20: Post listing flow

### Week 3: Credits & Profile (10 screens)
- Screens 21-28: Credits & payments
- Screens 29-31: Profile & settings

### Week 4: Polish & Additional (10 screens)
- Screens 32-40: Support, features, polish
- Review and iterate on all screens

---

## 💡 TIPS FOR SUCCESS

### 1. Start with High-Priority Screens
Design Screens 1, 3-7 first (critical path)

### 2. Maintain Consistency
- Use same navigation patterns
- Consistent spacing (8pt grid)
- Standard component sizes
- Unified color palette

### 3. Think Mobile-First
- Thumb-friendly zones
- Larger touch targets
- Readable text sizes
- Clear visual hierarchy

### 4. Leverage iOS Patterns
- Standard nav bar height (44pt)
- Tab bar with safe area (49pt + 34pt)
- Sheet presentations (rounded corners)
- Native gestures (swipe back, pull refresh)

### 5. Test on Real Devices
- View wireframes on actual iPhone
- Check safe areas (notch, home indicator)
- Validate text readability
- Test scrolling behavior

---

## 📱 DEVICE SPECIFICATIONS

**Primary Target:** iPhone 14 Pro
- Screen size: 393 × 852 pt
- Safe area top: 59pt (status bar + notch)
- Safe area bottom: 34pt (home indicator)

**Also Support:**
- iPhone SE (375 × 667 pt) - Smaller screen
- iPhone 14 Pro Max (430 × 932 pt) - Larger screen

**Responsive Design:**
- Use Auto Layout principles
- Flexible spacing
- Scalable images
- Adaptive typography

---

## 🎯 SUCCESS METRICS

After wireframes are complete, measure:

### Design Quality
- [ ] All 40 screens follow Apple HIG
- [ ] Consistent spacing and typography
- [ ] Clear visual hierarchy
- [ ] Intuitive navigation

### User Experience
- [ ] User flows are logical
- [ ] No dead ends
- [ ] Error states covered
- [ ] Loading states defined

### Technical Feasibility
- [ ] Components are buildable
- [ ] Interactions are clear
- [ ] API needs identified
- [ ] Performance considerations documented

---

## 📚 NEXT STEPS

1. **Generate all 40 wireframes** using Google Stitch prompts
2. **Create clickable prototype** linking screens together
3. **Conduct user testing** with 5-10 Kenyan users
4. **Iterate based on feedback**
5. **Hand off to developers** with annotated specs

**Ready to build PataSpace? Start with Screen 06 (Home), Screen 07 (Listing Details), and Screen 10 (Unlock Confirmation).**

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Total Screens:** 40  
**Estimated Design Time:** 15-20 hours
