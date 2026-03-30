export type MediaTone =
  | "lagoon"
  | "midnight"
  | "sunrise"
  | "sand"
  | "forest"
  | "graphite";

export type MockListingMedia = {
  id: string;
  title: string;
  caption: string;
  tone: MediaTone;
  gpsTag: string;
};

export type MockListing = {
  id: string;
  title: string;
  county: string;
  neighborhood: string;
  address: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnished: boolean;
  availableFrom: string;
  availableTo?: string;
  unlockCostCredits: number;
  description: string;
  propertyNotes?: string;
  amenities: string[];
  verification: string[];
  viewCount: number;
  unlockCount: number;
  createdAt: string;
  tenant: {
    firstName: string;
    lastName: string;
    joinedDate: string;
    listingsPosted: number;
    phoneNumber: string;
  };
  mapLocation: {
    approxLatitude: number;
    approxLongitude: number;
  };
  contactInfo: {
    address: string;
    phoneNumber: string;
    latitude: number;
    longitude: number;
  };
  media: MockListingMedia[];
};

export const mockListings: MockListing[] = [
  {
    id: "listing-1",
    title: "Sunny 2BR handover near Yaya Centre",
    county: "Nairobi",
    neighborhood: "Kilimani",
    address: "Argwings Kodhek Road, Kilimani",
    monthlyRent: 25000,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "Apartment",
    furnished: false,
    availableFrom: "2026-05-01",
    unlockCostCredits: 2500,
    description:
      "A calm two-bedroom handover with balcony light, dependable water, and quick matatu access toward Ngong Road and Yaya Centre.",
    propertyNotes:
      "Caretaker is responsive, the compound is quiet after 9 PM, and move-in is easiest during weekdays.",
    amenities: ["Water 24/7", "Backup generator", "Parking", "Balcony", "Fiber ready"],
    verification: [
      "10 media captures uploaded from mobile",
      "GPS coordinates matched the listing point",
      "Video walkthrough was confirmed before publish",
    ],
    viewCount: 45,
    unlockCount: 3,
    createdAt: "2026-03-21T09:00:00.000Z",
    tenant: {
      firstName: "John",
      lastName: "Kamau",
      joinedDate: "2026-01-15T00:00:00.000Z",
      listingsPosted: 2,
      phoneNumber: "+254712345678",
    },
    mapLocation: {
      approxLatitude: -1.2896,
      approxLongitude: 36.7909,
    },
    contactInfo: {
      address: "123 Argwings Kodhek Rd, Apartment 5B",
      phoneNumber: "+254712345678",
      latitude: -1.2896,
      longitude: 36.7909,
    },
    media: [
      {
        id: "listing-1-media-1",
        title: "Living room",
        caption: "South-facing windows and balcony light.",
        tone: "lagoon",
        gpsTag: "GPS matched",
      },
      {
        id: "listing-1-media-2",
        title: "Kitchen pass-through",
        caption: "Compact layout with upper storage and cooker space.",
        tone: "sand",
        gpsTag: "Block A capture",
      },
      {
        id: "listing-1-media-3",
        title: "Bedroom one",
        caption: "Fits a queen bed and wardrobe without crowding.",
        tone: "midnight",
        gpsTag: "Timestamp verified",
      },
    ],
  },
  {
    id: "listing-2",
    title: "Affordable studio close to CBD routes",
    county: "Nairobi",
    neighborhood: "South B",
    address: "Likoni Road, South B",
    monthlyRent: 14500,
    bedrooms: 0,
    bathrooms: 1,
    propertyType: "Studio",
    furnished: false,
    availableFrom: "2026-04-12",
    unlockCostCredits: 1450,
    description:
      "A tidy studio for a solo renter who wants predictable commuter access, low monthly overhead, and a secure gate.",
    propertyNotes:
      "Best fit for one tenant. Water delivery is strongest in the evening and there is a shared drying area.",
    amenities: ["Secure gate", "Water tank", "Near matatu stage", "Caretaker on site"],
    verification: [
      "8 mobile images approved",
      "Walkthrough clip attached",
      "Neighborhood point validated against GPS",
    ],
    viewCount: 28,
    unlockCount: 2,
    createdAt: "2026-03-18T14:30:00.000Z",
    tenant: {
      firstName: "Mercy",
      lastName: "Achieng",
      joinedDate: "2025-11-02T00:00:00.000Z",
      listingsPosted: 1,
      phoneNumber: "+254722111222",
    },
    mapLocation: {
      approxLatitude: -1.3132,
      approxLongitude: 36.8378,
    },
    contactInfo: {
      address: "Likoni Road Court, Room 17",
      phoneNumber: "+254722111222",
      latitude: -1.3132,
      longitude: 36.8378,
    },
    media: [
      {
        id: "listing-2-media-1",
        title: "Main room",
        caption: "Efficient layout with direct natural light.",
        tone: "sunrise",
        gpsTag: "Front block verified",
      },
      {
        id: "listing-2-media-2",
        title: "Kitchenette",
        caption: "Sink, counter, and open shelf arrangement.",
        tone: "graphite",
        gpsTag: "Timestamp verified",
      },
      {
        id: "listing-2-media-3",
        title: "Compound entry",
        caption: "Secure metal gate and paved inner court.",
        tone: "forest",
        gpsTag: "Gate location matched",
      },
    ],
  },
  {
    id: "listing-3",
    title: "Furnished one-bedroom in Westlands",
    county: "Nairobi",
    neighborhood: "Westlands",
    address: "Muthithi Road, Westlands",
    monthlyRent: 42000,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    furnished: true,
    availableFrom: "2026-06-01",
    availableTo: "2027-06-01",
    unlockCostCredits: 4200,
    description:
      "A furnished one-bedroom in a quieter Westlands pocket with backup power, elevator access, and a move-in-ready finish.",
    propertyNotes:
      "Current internet setup is fiber. Building management prefers daytime viewing coordination.",
    amenities: ["Furnished", "Backup power", "Elevator", "Fiber available", "Lift access"],
    verification: [
      "12 media captures confirmed",
      "Full walkthrough clip uploaded",
      "Location and media metadata aligned",
    ],
    viewCount: 63,
    unlockCount: 5,
    createdAt: "2026-03-16T11:20:00.000Z",
    tenant: {
      firstName: "Brian",
      lastName: "Otieno",
      joinedDate: "2025-08-20T00:00:00.000Z",
      listingsPosted: 3,
      phoneNumber: "+254733444555",
    },
    mapLocation: {
      approxLatitude: -1.2684,
      approxLongitude: 36.8065,
    },
    contactInfo: {
      address: "Muthithi Heights, Unit 14C",
      phoneNumber: "+254733444555",
      latitude: -1.2684,
      longitude: 36.8065,
    },
    media: [
      {
        id: "listing-3-media-1",
        title: "Lounge setup",
        caption: "Sofa, dining nook, and layered lighting in one frame.",
        tone: "midnight",
        gpsTag: "Tower verified",
      },
      {
        id: "listing-3-media-2",
        title: "Bedroom",
        caption: "Ready-to-use setup with wardrobe wall and blackout curtains.",
        tone: "lagoon",
        gpsTag: "Interior capture",
      },
      {
        id: "listing-3-media-3",
        title: "Kitchen and breakfast edge",
        caption: "Fitted cabinets with direct ventilation.",
        tone: "sand",
        gpsTag: "Timestamp verified",
      },
    ],
  },
];

export function getMockListingById(id: string) {
  return mockListings.find((listing) => listing.id === id);
}
