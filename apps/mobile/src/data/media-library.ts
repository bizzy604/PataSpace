import type { ImageSourcePropType } from 'react-native';

export type LocalMedia = {
  id: string;
  label: string;
  source: ImageSourcePropType;
};

const uploadedPhotos = [
  require('../../assets/photo1.jpg'),
  require('../../assets/photo2.jpg'),
  require('../../assets/photo3.jpg'),
  require('../../assets/photo4.jpg'),
  require('../../assets/photo5.jpg'),
  require('../../assets/photo6.jpg'),
] as const;

function media(id: string, label: string, index: number): LocalMedia {
  return {
    id,
    label,
    source: uploadedPhotos[index],
  };
}

export const draftCameraSequence: LocalMedia[] = [
  media('draft-entrance', 'Entrance', 5),
  media('draft-living', 'Living room', 0),
  media('draft-kitchen', 'Kitchen', 1),
  media('draft-bedroom', 'Bedroom', 2),
  media('draft-bathroom', 'Bathroom', 3),
  media('draft-view', 'View', 4),
];

export const listingGallerySets = {
  kilimani: [
    media('kilimani-living', 'Living room', 0),
    media('kilimani-kitchen', 'Kitchen', 1),
    media('kilimani-bedroom', 'Bedroom', 2),
    media('kilimani-bathroom', 'Bathroom', 3),
    media('kilimani-balcony', 'Balcony', 4),
    media('kilimani-entrance', 'Entrance', 5),
  ],
  southB: [
    media('southb-room', 'Studio room', 4),
    media('southb-kitchen', 'Kitchenette', 1),
    media('southb-bathroom', 'Bathroom', 3),
    media('southb-gate', 'Front gate', 5),
  ],
  westlands: [
    media('westlands-loft', 'Loft view', 2),
    media('westlands-lounge', 'Lounge', 0),
    media('westlands-rooftop', 'Rooftop', 4),
    media('westlands-lobby', 'Lobby', 5),
    media('westlands-kitchen', 'Kitchen', 1),
    media('westlands-bathroom', 'Bathroom', 3),
  ],
} as const;
