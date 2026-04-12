import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ColorSchemeToggle } from '@/components/ui/color-scheme-toggle';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

const pataspaceLogo = require('../../assets/PataSpace Logo.png');

function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center justify-between rounded-[20px] bg-secondary p-4"
      onPress={onPress}
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View
        className={value ? 'rounded-full bg-primary px-3 py-1.5' : 'rounded-full bg-card px-3 py-1.5'}
      >
        <Text
          className={
            value ? 'text-xs font-semibold text-primary-foreground' : 'text-xs font-semibold text-foreground'
          }
        >
          {value ? 'On' : 'Off'}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProfileScreen() {
  const { user, walletBalance, savedListings, notifications, logout } = useMobileApp();
  const router = useRouter();

  return (
    <Screen withTabBar>
      <SectionHeader kicker="Profile" title={user.name} description={user.preferredArea} />

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/70">
          Account
        </Text>
        <Text className="mt-2 text-[28px] font-semibold text-white">{user.phone}</Text>
        <Text className="mt-2 text-sm leading-6 text-white/70">
          Preferred areas: {user.preferredArea}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Credits</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">
            {walletBalance.toLocaleString()}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Saved</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">{savedListings.length}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Alerts</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">{notifications.length}</Text>
        </Card>
      </View>

      <View className="gap-3">
        <Link href={appRoutes.editProfile} asChild>
          <Button label="Edit profile" />
        </Link>
        <Link href={appRoutes.settings} asChild>
          <Button variant="outline" label="Settings" />
        </Link>
        <Link href={appRoutes.helpCenter} asChild>
          <Button variant="outline" label="Help center" />
        </Link>
        <Link href={appRoutes.notifications} asChild>
          <Button variant="outline" label="Notifications" />
        </Link>
        <Link href={appRoutes.rateReview} asChild>
          <Button variant="outline" label="Rate experience" />
        </Link>
        <Link href={appRoutes.appUpdate} asChild>
          <Button variant="outline" label="App updates" />
        </Link>
      </View>

      <Button
        variant="secondary"
        label="Logout"
        onPress={() => {
          logout();
          router.replace(appRoutes.home);
        }}
      />
    </Screen>
  );
}

export function EditProfileScreen() {
  const { user, updateProfile } = useMobileApp();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [preferredArea, setPreferredArea] = useState(user.preferredArea);
  const [bio, setBio] = useState(user.bio);
  const router = useRouter();

  return (
    <Screen>
      <SectionHeader
        kicker="Edit profile"
        title="Update your details"
        description="Save changes"
      />

      <Card className="gap-5">
        <View className="gap-3">
          <Text className="text-sm font-semibold text-foreground">Name</Text>
          <Input value={name} onChangeText={setName} />
        </View>
        <View className="gap-3">
          <Text className="text-sm font-semibold text-foreground">Phone</Text>
          <Input value={phone} onChangeText={setPhone} />
        </View>
        <View className="gap-3">
          <Text className="text-sm font-semibold text-foreground">Preferred areas</Text>
          <Input value={preferredArea} onChangeText={setPreferredArea} />
        </View>
        <View className="gap-3">
          <Text className="text-sm font-semibold text-foreground">Bio</Text>
          <Input
            className="min-h-28 py-4"
            multiline
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
          />
        </View>
      </Card>

      <Button
        label="Save profile"
        onPress={() => {
          updateProfile({ name, phone, preferredArea, bio });
          router.back();
        }}
      />
    </Screen>
  );
}

export function SettingsScreen() {
  const { settings, updateSettings } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Settings"
        title="Notifications and appearance"
        description="Push, SMS, saved search, theme"
      />

      <Card className="items-center gap-4">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
          Appearance
        </Text>
        <ColorSchemeToggle showLabels />
        <Text className="text-center text-sm leading-6 text-muted-foreground">
          Switch the mobile app between the light and dark presentation at any time.
        </Text>
      </Card>

      <View className="gap-3">
        <ToggleRow
          label="Push notifications"
          value={settings.pushNotifications}
          onPress={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
        />
        <ToggleRow
          label="SMS alerts"
          value={settings.smsAlerts}
          onPress={() => updateSettings({ smsAlerts: !settings.smsAlerts })}
        />
        <ToggleRow
          label="Saved-search alerts"
          value={settings.savedSearchAlerts}
          onPress={() => updateSettings({ savedSearchAlerts: !settings.savedSearchAlerts })}
        />
      </View>

      <View className="gap-3">
        <Link href={appRoutes.helpCenter} asChild>
          <Button variant="outline" label="Help center" />
        </Link>
        <Link href={appRoutes.appUpdate} asChild>
          <Button variant="outline" label="What is new" />
        </Link>
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
            Support request submitted. You can see the entry in transaction history.
          </CardDescription>
        </Card>
      ) : null}

      <Button
        label="Send support request"
        onPress={() => {
          submitSupportMessage(topic, message);
          setSent(true);
        }}
      />
    </Screen>
  );
}

export function RateReviewScreen() {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('The unlock flow is clear and the listing details are useful.');
  const [submitted, setSubmitted] = useState(false);
  const { reviewPrompts, submitReview } = useMobileApp();

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

      <Button
        label="Submit review"
        onPress={() => {
          submitReview(rating, comment);
          setSubmitted(true);
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
