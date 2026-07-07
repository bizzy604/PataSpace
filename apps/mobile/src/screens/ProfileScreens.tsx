import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

const pataspaceLogo = require('../../assets/PataSpace Logo.png');

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mt-2 font-body-bold text-label-md uppercase tracking-[1px] text-muted-foreground">
      {children}
    </Text>
  );
}

export function ProfileScreen() {
  const { user, myListings, unlocks, savedListings, logout } = useMobileApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const earnedKes = myListings.reduce(
    (total, listing) =>
      total +
      listing.commissions
        .filter((commission) => commission.status === 'PAID')
        .reduce((sum, commission) => sum + commission.amountKES, 0),
    0,
  );

  async function handleLogout() {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogout(false);
    }
  }

  const stats = [
    { label: 'Listings', value: String(myListings.length) },
    { label: 'Unlocks', value: String(unlocks.length) },
    { label: 'KES Earned', value: earnedKes.toLocaleString(), highlight: true },
  ];

  return (
    <Screen withTabBar>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">Profile</Text>
        <Link href={appRoutes.settings} asChild>
          <Pressable className="h-11 w-11 items-center justify-center active:opacity-70" accessibilityLabel="Settings">
            <AppIcon name="settings-outline" size={22} active />
          </Pressable>
        </Link>
      </View>

      <View className="items-center gap-2">
        <Link href={appRoutes.editProfile} asChild>
          <Pressable className="active:opacity-80">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Text className="font-display text-headline-lg text-primary">{user.initials}</Text>
            </View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
              <AppIcon name="pencil" size={14} inverse />
            </View>
          </Pressable>
        </Link>
        <Text className="font-display text-headline-md text-foreground">{user.name}</Text>
        <Text className="font-body text-body-md text-muted-foreground">{user.phone}</Text>
      </View>

      <View className="flex-row gap-3">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1 items-center gap-1 rounded-[16px] bg-surface-inverse p-4">
            <Text
              className={
                stat.highlight
                  ? 'font-display text-headline-md text-success'
                  : 'font-display text-headline-md text-white'
              }
            >
              {stat.value}
            </Text>
            <Text className="font-body text-label-md text-white/70">{stat.label}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>Account</SectionLabel>
      <View className="gap-2">
        <Link href={appRoutes.editProfile} asChild>
          <ListRow icon="person-outline" title="Edit Profile" chevron />
        </Link>
        <Link href={appRoutes.editProfile} asChild>
          <ListRow icon="shield-checkmark-outline" title="Verification Status" value="Verify" chevron />
        </Link>
      </View>

      <SectionLabel>My Activity</SectionLabel>
      <View className="gap-2">
        <Link href={appRoutes.myListings} asChild>
          <ListRow icon="documents-outline" title="My Listings" value={String(myListings.length)} chevron />
        </Link>
        <Link href={appRoutes.transactions} asChild>
          <ListRow icon="lock-open-outline" title="My Unlocks" value={String(unlocks.length)} chevron />
        </Link>
        <Link href={appRoutes.saved} asChild>
          <ListRow icon="heart-outline" title="Saved Properties" value={String(savedListings.length)} chevron />
        </Link>
        <Link href={appRoutes.transactions} asChild>
          <ListRow icon="receipt-outline" title="Transaction History" chevron />
        </Link>
      </View>

      <SectionLabel>Support</SectionLabel>
      <View className="gap-2">
        <Link href={appRoutes.helpCenter} asChild>
          <ListRow icon="help-circle-outline" title="Help Center" chevron />
        </Link>
        <Link href={appRoutes.contactSupport} asChild>
          <ListRow icon="headset-outline" title="Contact Support" chevron />
        </Link>
        <Link href={appRoutes.dispute} asChild>
          <ListRow icon="alert-circle-outline" title="Report an Issue" chevron />
        </Link>
      </View>

      <SectionLabel>Account Management</SectionLabel>
      <View className="gap-2">
        <ListRow icon="log-out-outline" title="Logout" destructive onPress={() => setShowLogout(true)} />
        <Link href={appRoutes.deleteAccount} asChild>
          <ListRow icon="trash-outline" title="Delete Account" destructive />
        </Link>
      </View>

      <Dialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        icon="log-out-outline"
        title="Log Out?"
        message="Are you sure you want to log out of your PataSpace account? You will need to verify your phone number again to sign back in."
        confirm={{
          label: isLoggingOut ? 'Logging out…' : 'Log Out',
          variant: 'dark',
          disabled: isLoggingOut,
          onPress: () => void handleLogout(),
        }}
        cancel={{ label: 'Cancel', variant: 'ghost', onPress: () => setShowLogout(false) }}
      />
    </Screen>
  );
}

export function EditProfileScreen() {
  const { user, updateProfile } = useMobileApp();
  const [firstName, ...restName] = user.name.split(' ');
  const [first, setFirst] = useState(firstName ?? '');
  const [last, setLast] = useState(restName.join(' '));
  const [preferredArea, setPreferredArea] = useState(user.preferredArea);
  const [bio, setBio] = useState(user.bio);
  const router = useRouter();

  function save() {
    const fullName = `${first} ${last}`.trim() || user.name;
    updateProfile({ name: fullName, preferredArea, bio });
    router.back();
  }

  return (
    <Screen
      header={
        <View className="flex-row items-center justify-between bg-surface-elevated px-4 py-3">
          <Pressable onPress={() => router.back()} className="active:opacity-70" accessibilityLabel="Cancel">
            <Text className="font-body-medium text-body-md text-primary">Cancel</Text>
          </Pressable>
          <Text className="font-display text-headline-sm text-foreground">Edit Profile</Text>
          <Pressable onPress={save} className="active:opacity-70" accessibilityLabel="Save">
            <Text className="font-display text-body-md text-primary">Save</Text>
          </Pressable>
        </View>
      }
    >
      <View className="items-center gap-2 py-2">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Text className="font-display text-headline-lg text-primary">{user.initials}</Text>
        </View>
        <Text className="font-body text-label-md text-muted-foreground">
          Photo upload coming soon
        </Text>
      </View>

      <Input label="First Name" value={first} onChangeText={setFirst} placeholder="John" />
      <Input label="Last Name" value={last} onChangeText={setLast} placeholder="Kamau" />

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-body-bold text-label-md text-muted-foreground">Phone Number</Text>
          <AppIcon name="lock-closed-outline" size={14} />
        </View>
        <View className="min-h-12 justify-center rounded-[12px] bg-surface-subtle px-4 py-3 opacity-70">
          <Text className="font-body text-body-lg text-muted-foreground">{user.phone}</Text>
        </View>
      </View>

      <Input
        label="Preferred Areas"
        value={preferredArea}
        onChangeText={setPreferredArea}
        placeholder="Kilimani, Westlands"
      />

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-body-bold text-label-md text-muted-foreground">Bio</Text>
          <Text className="font-body text-label-md text-muted-foreground">{bio.length}/200</Text>
        </View>
        <Input
          className="min-h-28 py-4"
          multiline
          textAlignVertical="top"
          value={bio}
          onChangeText={(value) => setBio(value.slice(0, 200))}
          placeholder="Tell us a bit about yourself…"
        />
      </View>

      <View className="flex-row items-start gap-3 rounded-[16px] bg-surface-subtle p-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <AppIcon name="shield-checkmark-outline" size={20} active />
        </View>
        <View className="flex-1">
          <Text className="font-display text-body-lg text-foreground">Verify Your Identity</Text>
          <Text className="font-body text-body-md text-muted-foreground">
            ID verification is handled by the PataSpace team. We will reach out when it is your turn.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

export function HelpCenterScreen() {
  const { helpArticles } = useMobileApp();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = helpArticles.filter((article) =>
    article.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Screen header={<ScreenHeader title="Help Center" />}>
      <Text className="font-display text-display-02 text-foreground">Help Center</Text>

      <View className="flex-row items-center gap-3 rounded-[12px] bg-surface-subtle px-4">
        <AppIcon name="search-outline" size={20} />
        <Input
          className="flex-1 bg-transparent px-0"
          value={query}
          onChangeText={setQuery}
          placeholder="Search for help…"
        />
      </View>

      <Text className="font-display text-headline-sm text-foreground">Quick Actions</Text>
      <View className="flex-row gap-3">
        <Link href={appRoutes.contactSupport} asChild>
          <Pressable className="flex-1 gap-3 rounded-[16px] bg-card p-4 shadow-card active:opacity-90">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <AppIcon name="headset-outline" size={20} active />
            </View>
            <View>
              <Text className="font-display text-body-lg text-foreground">Contact Support</Text>
              <Text className="font-body text-label-md text-muted-foreground">24/7 assistance</Text>
            </View>
          </Pressable>
        </Link>
        <Link href={appRoutes.dispute} asChild>
          <Pressable className="flex-1 gap-3 rounded-[16px] bg-card p-4 shadow-card active:opacity-90">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-danger/10">
              <AppIcon name="alert-circle-outline" size={20} color="#FF3B30" />
            </View>
            <View>
              <Text className="font-display text-body-lg text-foreground">Report Problem</Text>
              <Text className="font-body text-label-md text-muted-foreground">Found a bug?</Text>
            </View>
          </Pressable>
        </Link>
      </View>

      <Text className="font-display text-headline-sm text-foreground">Frequently Asked Questions</Text>
      <View className="gap-2">
        {filtered.map((article) => {
          const open = expanded === article.id;
          return (
            <View key={article.id} className="rounded-[16px] bg-card shadow-card">
              <Pressable
                onPress={() => setExpanded(open ? null : article.id)}
                className="flex-row items-center gap-3 px-4 py-4 active:opacity-90"
              >
                <AppIcon name="help-circle-outline" size={20} active />
                <Text className="flex-1 font-body-medium text-body-lg text-foreground">{article.title}</Text>
                <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} />
              </Pressable>
              {open ? (
                <Text className="px-4 pb-4 font-body text-body-md leading-6 text-muted-foreground">
                  {article.body}
                </Text>
              ) : null}
            </View>
          );
        })}
        {filtered.length === 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            No articles match "{query}". Try Contact Support.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const SUPPORT_WHATSAPP = '+254 700 123 456';
const SUPPORT_EMAIL = 'support@pataspace.co.ke';

function SupportChannel({
  icon,
  iconTint,
  iconColor,
  title,
  value,
  onPress,
  divider,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  iconTint: string;
  iconColor: string;
  title: string;
  value: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-4 active:opacity-90 ${divider ? 'border-b border-border' : ''}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: iconTint }}>
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-body-lg text-foreground">{title}</Text>
        <Text className="font-body text-body-md text-muted-foreground">{value}</Text>
      </View>
      <AppIcon name="chevron-forward" size={18} />
    </Pressable>
  );
}

export function ContactSupportScreen() {
  const [topic, setTopic] = useState('Unlock issue');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { supportTopics, submitSupportMessage } = useMobileApp();
  const waDigits = SUPPORT_WHATSAPP.replace(/[^0-9]/g, '');

  return (
    <Screen header={<ScreenHeader title="Contact Support" />}>
      <Text className="font-display text-display-02 text-foreground">Contact Support</Text>

      <Button
        shape="pill"
        label="Chat with Support"
        onPress={() => void Linking.openURL(`https://wa.me/${waDigits}`)}
      />

      <View className="rounded-[16px] bg-card shadow-card">
        <SupportChannel
          icon="logo-whatsapp"
          iconTint="rgba(52,199,89,0.15)"
          iconColor="#25D366"
          title="WhatsApp"
          value={SUPPORT_WHATSAPP}
          onPress={() => void Linking.openURL(`https://wa.me/${waDigits}`)}
          divider
        />
        <SupportChannel
          icon="mail-outline"
          iconTint="rgba(0,0,0,0.06)"
          iconColor="#8D9192"
          title="Email Support"
          value={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          divider
        />
        <SupportChannel
          icon="call-outline"
          iconTint="rgba(0,0,0,0.06)"
          iconColor="#8D9192"
          title="Call Support"
          value="Available 24/7"
          onPress={() => void Linking.openURL(`tel:${waDigits}`)}
        />
      </View>

      <Text className="font-display text-headline-sm text-foreground">Send us a message</Text>
      <View className="flex-row flex-wrap gap-2">
        {supportTopics.map((item) => (
          <Chip key={item} label={item} active={topic === item} onPress={() => setTopic(item)} />
        ))}
      </View>
      <Input
        className="min-h-32 py-4"
        multiline
        textAlignVertical="top"
        value={message}
        onChangeText={setMessage}
        placeholder="Describe your issue…"
      />

      {sent ? (
        <View className="flex-row items-center gap-2 rounded-[16px] bg-success/10 p-4">
          <AppIcon name="checkmark-circle" size={18} color="#34C759" />
          <Text className="flex-1 font-body text-body-md text-success">
            Message sent. Support will follow up via SMS or WhatsApp.
          </Text>
        </View>
      ) : null}
      {errorMessage ? (
        <View className="flex-row items-center gap-2 rounded-[16px] bg-danger/10 p-4">
          <AppIcon name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{errorMessage}</Text>
        </View>
      ) : null}

      <Button
        label="Send Message"
        disabled={!message.trim()}
        onPress={async () => {
          setErrorMessage(null);
          const outcome = await submitSupportMessage(topic, message);
          if (outcome === 'success') {
            setSent(true);
            setMessage('');
          } else {
            setErrorMessage('We could not reach the support backend. Try again later.');
          }
        }}
      />
    </Screen>
  );
}

export function RateReviewScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { submitReview, submitReviewForUnlock, latestUnlock, getListingById } = useMobileApp();
  const router = useRouter();
  const listing = getListingById(latestUnlock?.listingId);

  return (
    <Screen
      header={<ScreenHeader title="Rate Your Experience" back={false} right={
        <Pressable className="h-11 w-11 items-center justify-center active:opacity-70" onPress={() => router.back()} accessibilityLabel="Close">
          <AppIcon name="close" size={22} color="#28809A" />
        </Pressable>
      } />}
      bottomBar={
        <Button
          shape="pill"
          disabled={rating === 0}
          label="Submit Review"
          onPress={async () => {
            setErrorText(null);
            if (!latestUnlock) {
              submitReview(rating, comment);
              setSubmitted(true);
              return;
            }
            const outcome = await submitReviewForUnlock(latestUnlock.id, rating, comment);
            if (outcome === 'success') {
              setSubmitted(true);
            } else if (outcome === 'already_reviewed') {
              setErrorText('You have already reviewed this unlock.');
            } else if (outcome === 'not_confirmed') {
              setErrorText('Reviews unlock after both parties confirm the move-in.');
            } else if (outcome === 'forbidden') {
              setErrorText('Only unlock participants can leave a review.');
            } else {
              setErrorText('We could not submit your review. Try again later.');
            }
          }}
        />
      }
    >
      {listing ? (
        <View className="flex-row items-center gap-3 rounded-[16px] bg-card p-3 shadow-card">
          <Image className="h-16 w-16 rounded-[12px] bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
          <View className="flex-1">
            <Text className="font-display text-headline-sm text-foreground">{listing.title}</Text>
            <Text className="font-body text-body-md text-muted-foreground">{listing.location}</Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <AppIcon name="calendar-outline" size={13} />
              <Text className="font-body text-label-md text-muted-foreground">{listing.availableFrom}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View className="items-center gap-4 py-4">
        <Text className="font-display text-headline-lg text-foreground">How was your stay?</Text>
        <View className="flex-row gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} className="active:opacity-70" accessibilityLabel={`${star} star`}>
              <AppIcon
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFCC00' : '#8D9192'}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-label-md text-muted-foreground">
          Share details of your experience (Optional)
        </Text>
        <Input
          className="min-h-32 py-4"
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
          placeholder="What did you love? What could be improved?"
        />
      </View>

      {submitted ? (
        <View className="flex-row items-center gap-2 rounded-[16px] bg-success/10 p-4">
          <AppIcon name="checkmark-circle" size={18} color="#34C759" />
          <Text className="flex-1 font-body text-body-md text-success">Review submitted. Thanks for the feedback.</Text>
        </View>
      ) : null}
      {errorText ? (
        <View className="flex-row items-center gap-2 rounded-[16px] bg-danger/10 p-4">
          <AppIcon name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{errorText}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

export function AppUpdateScreen() {
  const { updateNotes } = useMobileApp();
  const router = useRouter();

  return (
    <Screen
      bottomBar={
        <View className="gap-1">
          <Link href={appRoutes.search} asChild>
            <Button shape="pill" label="Try It Now" />
          </Link>
          <Pressable className="items-center py-3 active:opacity-70" onPress={() => router.back()}>
            <Text className="font-body-medium text-body-md text-muted-foreground">Maybe Later</Text>
          </Pressable>
        </View>
      }
    >
      <View className="items-center justify-center gap-3 rounded-[16px] bg-primary/5 py-10">
        <Image className="h-16 w-16" resizeMode="contain" source={pataspaceLogo} />
        <View className="flex-row items-center gap-2">
          <AppIcon name="shield-checkmark" size={22} color="#34C759" />
          <AppIcon name="flash" size={22} active />
        </View>
        <Text className="font-body-medium text-label-md uppercase tracking-[1.5px] text-muted-foreground">
          App Update
        </Text>
      </View>

      <View className="items-center gap-3">
        <View className="rounded-full bg-success/10 px-4 py-1.5">
          <Text className="font-body-bold text-label-md uppercase tracking-[1px] text-success">New Feature</Text>
        </View>
        <Text className="text-center font-display text-headline-lg text-foreground">
          Introducing Verified Listings
        </Text>
        <Text className="px-4 text-center font-body text-body-lg leading-6 text-muted-foreground">
          Properties with the verified badge have undergone rigorous physical and GPS checks by the
          PataSpace team, so you can browse with confidence.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 items-center gap-2 rounded-[16px] bg-surface-subtle p-5">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <AppIcon name="shield-checkmark-outline" size={20} active />
          </View>
          <Text className="font-display text-body-lg text-foreground">Authentic</Text>
          <Text className="text-center font-body text-label-md text-muted-foreground">GPS-vetted photos</Text>
        </View>
        <View className="flex-1 items-center gap-2 rounded-[16px] bg-surface-subtle p-5">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <AppIcon name="flash" size={20} active />
          </View>
          <Text className="font-display text-body-lg text-foreground">Fast Track</Text>
          <Text className="text-center font-body text-label-md text-muted-foreground">Priority in search</Text>
        </View>
      </View>

      <Text className="font-display text-headline-sm text-foreground">Also in this release</Text>
      <View className="gap-2">
        {updateNotes.map((note) => (
          <View key={note} className="flex-row items-start gap-2 rounded-[16px] bg-card p-4 shadow-card">
            <AppIcon name="checkmark-circle" size={18} color="#34C759" />
            <Text className="flex-1 font-body text-body-md leading-6 text-muted-foreground">{note}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
