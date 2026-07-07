import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
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

  return (
    <Screen>
      <SectionHeader
        kicker="Help center"
        title="Frequently asked questions"
        description="Unlocks, listings, confirmations"
      />

      {helpArticles.map((article) => (
        <Card key={article.id}>
          <CardTitle className="text-[20px]">{article.title}</CardTitle>
          <CardDescription>{article.body}</CardDescription>
        </Card>
      ))}

      <Link href={appRoutes.contactSupport} asChild>
        <Button label="Contact support" />
      </Link>
    </Screen>
  );
}

export function ContactSupportScreen() {
  const [topic, setTopic] = useState('Unlock issue');
  const [message, setMessage] = useState('I need help with a flow inside the prototype.');
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { supportTopics, submitSupportMessage } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Contact support"
        title="Send a message"
        description="Support log"
      />

      <View className="flex-row flex-wrap gap-2">
        {supportTopics.map((item) => (
          <Pressable
            key={item}
            className={
              topic === item ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'
            }
            onPress={() => setTopic(item)}
          >
            <Text
              className={
                topic === item
                  ? 'text-sm font-semibold text-primary-foreground'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Message</Text>
        <Input
          className="mt-3 min-h-32 py-4"
          multiline
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
      </Card>

      {sent ? (
        <Card>
          <CardDescription>
            Support request submitted. The support team will follow up via SMS or WhatsApp.
          </CardDescription>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <CardDescription>{errorMessage}</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Send support request"
        onPress={async () => {
          setErrorMessage(null);
          const outcome = await submitSupportMessage(topic, message);
          if (outcome === 'success') {
            setSent(true);
          } else {
            setErrorMessage('We could not reach the support backend. Try again later.');
          }
        }}
      />
    </Screen>
  );
}

export function RateReviewScreen() {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('The unlock flow is clear and the listing details are useful.');
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { reviewPrompts, submitReview, submitReviewForUnlock, latestUnlock } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Rate and review"
        title="How was the experience?"
        description="Quick feedback"
      />

      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            className={
              rating === star ? 'flex-1 rounded-[18px] bg-primary py-3' : 'flex-1 rounded-[18px] bg-secondary py-3'
            }
            onPress={() => setRating(star)}
          >
            <Text
              className={
                rating === star
                  ? 'text-center text-lg font-semibold text-primary-foreground'
                  : 'text-center text-lg font-semibold text-foreground'
              }
            >
              {star}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {reviewPrompts.map((prompt) => (
          <Card key={prompt} className="px-4 py-3">
            <Text className="text-sm font-medium text-foreground">{prompt}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Comment</Text>
        <Input
          className="mt-3 min-h-32 py-4"
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
      </Card>

      {submitted ? (
        <Card>
          <CardDescription>Review submitted. Thanks for the feedback.</CardDescription>
        </Card>
      ) : null}

      {errorText ? (
        <Card>
          <CardDescription>{errorText}</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Submit review"
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
            return;
          }
          if (outcome === 'already_reviewed') {
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
    </Screen>
  );
}

export function AppUpdateScreen() {
  const { updateNotes } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="App updates"
        title="What changed"
        description="Recent changes"
      />

      <View className="items-center justify-center py-4">
        <Image className="h-24 w-24" resizeMode="contain" source={pataspaceLogo} />
      </View>

      {updateNotes.map((note) => (
        <Card key={note}>
          <Text className="text-sm leading-6 text-muted-foreground">{note}</Text>
        </Card>
      ))}

      <View className="gap-3">
        <Link href={appRoutes.search} asChild>
          <Button label="Explore listings" />
        </Link>
        <Link href={appRoutes.credits} asChild>
          <Button variant="outline" label="Open wallet" />
        </Link>
      </View>
    </Screen>
  );
}
