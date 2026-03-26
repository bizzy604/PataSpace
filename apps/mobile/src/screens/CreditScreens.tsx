import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatCredits } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, transactionHref } from '@/lib/routes';

function PackageCard({
  selected,
  label,
  credits,
  price,
  bonus,
  description,
  onPress,
}: {
  selected: boolean;
  label: string;
  credits: number;
  price: string;
  bonus: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={
        selected
          ? 'rounded-[24px] border border-primary bg-card p-5'
          : 'rounded-[24px] border border-border bg-card p-5'
      }
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-[20px]">{label}</CardTitle>
        <Badge variant={selected ? 'dark' : 'secondary'}>{price}</Badge>
      </View>
      <Text className="mt-3 text-[15px] font-semibold text-foreground">{formatCredits(credits)}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{bonus}</Text>
      <Text className="mt-3 text-sm leading-6 text-muted-foreground">{description}</Text>
    </Pressable>
  );
}

export function CreditsScreen() {
  const { walletBalance, walletPackages, transactions } = useMobileApp();

  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Credits wallet"
        title="Wallet"
        description="Balance and activity"
      />

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/70">
          Available credits
        </Text>
        <Text className="mt-2 text-[34px] font-semibold tracking-[-0.8px] text-white">
          {formatCredits(walletBalance)}
        </Text>
        <Text className="mt-2 text-sm text-white/70">Used for unlocks</Text>
      </View>

      <View className="gap-3">
        {walletPackages.map((item) => (
          <Card key={item.id}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-lg font-semibold text-foreground">{item.label}</Text>
                <Text className="text-sm text-muted-foreground">{item.description}</Text>
              </View>
              <Badge variant="secondary">{item.price}</Badge>
            </View>
          </Card>
        ))}
      </View>

      <View className="gap-3">
        <Link href={appRoutes.buyCredits} asChild>
          <Button label="Buy credits" />
        </Link>
        <Link href={appRoutes.transactions} asChild>
          <Button variant="outline" label={`Transactions (${transactions.length})`} />
        </Link>
      </View>

      <View className="flex-row gap-3">
        <Link href={appRoutes.referral} asChild>
          <Button className="flex-1" variant="secondary" label="Referral" />
        </Link>
        <Link href={appRoutes.dispute} asChild>
          <Button className="flex-1" variant="secondary" label="Report issue" />
        </Link>
      </View>
    </Screen>
  );
}

export function BuyCreditsScreen() {
  const { walletPackages, pendingTopUp, selectTopUp, user } = useMobileApp();
  const [selectedPackageId, setSelectedPackageId] = useState(pendingTopUp?.packageId ?? walletPackages[0]?.id);
  const [phone, setPhone] = useState(pendingTopUp?.phone ?? user.phone);
  const router = useRouter();

  return (
    <Screen
      bottomBar={
        <Button
          label="Continue to M-Pesa"
          onPress={() => {
            if (!selectedPackageId) {
              return;
            }

            selectTopUp(selectedPackageId, phone);
            router.push(appRoutes.mpesaProcessing);
          }}
        />
      }
    >
      <SectionHeader
        kicker="Buy credits"
        title="Choose a package"
        description="Pick a package"
      />

      <View className="gap-3">
        {walletPackages.map((item) => (
          <PackageCard
            key={item.id}
            selected={selectedPackageId === item.id}
            label={item.label}
            credits={item.credits}
            price={item.price}
            bonus={item.bonus}
            description={item.description}
            onPress={() => setSelectedPackageId(item.id)}
          />
        ))}
      </View>

      <Card>
        <Text className="text-sm font-semibold text-foreground">M-Pesa phone number</Text>
        <Input className="mt-3" value={phone} onChangeText={setPhone} placeholder="+254 712 345 678" />
      </Card>
    </Screen>
  );
}

export function MpesaProcessingScreen() {
  const { pendingTopUp, walletPackages, completeTopUp } = useMobileApp();
  const router = useRouter();
  const selectedPackage = walletPackages.find((item) => item.id === pendingTopUp?.packageId);

  return (
    <Screen>
      <SectionHeader
        kicker="M-Pesa processing"
        title="Waiting for payment"
        description="Confirm when paid"
      />

      <Card>
        <CardTitle className="text-[20px]">{selectedPackage?.label ?? 'No package selected'}</CardTitle>
        <CardDescription>
          Phone: {pendingTopUp?.phone ?? 'No phone selected'} | Price: {selectedPackage?.price ?? 'KES 0'}
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Button
          label="Confirm payment received"
          onPress={() => {
            completeTopUp();
            router.replace(appRoutes.paymentSuccess);
          }}
        />
        <Link href={appRoutes.buyCredits} asChild>
          <Button variant="outline" label="Change package" />
        </Link>
      </View>
    </Screen>
  );
}

export function PaymentSuccessScreen() {
  const { latestTopUp, walletBalance } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Payment success"
        title="Credits added"
        description="Ready to use"
      />

      <Card>
        <CardTitle className="text-[20px]">{latestTopUp?.title ?? 'Latest top-up'}</CardTitle>
        <CardDescription>
          {latestTopUp?.credits ?? '+0 credits'} | New balance: {formatCredits(walletBalance)}
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Link href={appRoutes.credits} asChild>
          <Button label="Back to wallet" />
        </Link>
        <Link href={appRoutes.search} asChild>
          <Button variant="outline" label="Browse listings" />
        </Link>
      </View>
    </Screen>
  );
}

export function TransactionHistoryScreen() {
  const { transactions } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Transaction history"
        title="All activity"
        description="Top-ups, unlocks, support"
      />

      {transactions.map((transaction) => (
        <Link key={transaction.id} href={transactionHref(transaction.id)} asChild>
          <Pressable className="rounded-[24px] border border-border bg-card p-5 shadow-card">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-lg font-semibold text-foreground">{transaction.title}</Text>
                <Text className="text-sm text-muted-foreground">{transaction.date}</Text>
              </View>
              <Badge variant={transaction.status === 'Completed' ? 'dark' : 'secondary'}>
                {transaction.status}
              </Badge>
            </View>
            <Text className="mt-3 text-sm font-semibold text-foreground">{transaction.credits}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{transaction.amount}</Text>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

export function TransactionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { transactions } = useMobileApp();
  const transaction = transactions.find((item) => item.id === params.id);

  if (!transaction) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Transaction not found</CardTitle>
          <CardDescription>That activity entry could not be loaded.</CardDescription>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        kicker="Transaction detail"
        title={transaction.title}
        description="Detailed view for a single wallet event."
      />

      <Card>
        <CardTitle className="text-[20px]">{transaction.status}</CardTitle>
        <CardDescription>
          {transaction.date} | {transaction.amount} | {transaction.credits}
        </CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Notes</CardTitle>
        <CardDescription>{transaction.detail}</CardDescription>
      </Card>

      <Link href={appRoutes.dispute} asChild>
        <Button variant="outline" label="Report an issue" />
      </Link>
    </Screen>
  );
}

export function DisputeScreen() {
  const [subject, setSubject] = useState('Unlock issue');
  const [detail, setDetail] = useState('I need help reviewing a wallet or unlock event.');
  const [submitted, setSubmitted] = useState(false);
  const { supportTopics, submitDispute } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Dispute or report"
        title="Raise an issue"
        description="Unlock, wallet, listing"
      />

      <View className="flex-row flex-wrap gap-2">
        {supportTopics.map((topic) => (
          <Pressable
            key={topic}
            className={
              subject === topic ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'
            }
            onPress={() => setSubject(topic)}
          >
            <Text
              className={
                subject === topic
                  ? 'text-sm font-semibold text-primary-foreground'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {topic}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Issue detail</Text>
        <Input
          className="mt-3 min-h-32 py-4"
          multiline
          textAlignVertical="top"
          value={detail}
          onChangeText={setDetail}
        />
      </Card>

      {submitted ? (
        <Card>
          <CardTitle className="text-[20px]">Issue submitted</CardTitle>
          <CardDescription>Support has a new dispute record to review.</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Submit issue"
        onPress={() => {
          submitDispute(subject, detail);
          setSubmitted(true);
        }}
      />
    </Screen>
  );
}

export function ReferralScreen() {
  const [phone, setPhone] = useState('0700123456');
  const [sent, setSent] = useState(false);
  const { referralCode, referralHighlights, sendReferralInvite } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Referral"
        title="Invite friends"
        description="Earn bonus credits"
      />

      <Card>
        <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Referral code</Text>
        <Text className="mt-2 text-[28px] font-semibold tracking-[1px] text-foreground">{referralCode}</Text>
      </Card>

      <View className="gap-3">
        {referralHighlights.map((item) => (
          <Card key={item}>
            <Text className="text-sm leading-6 text-muted-foreground">{item}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Invite phone number</Text>
        <Input className="mt-3" value={phone} onChangeText={setPhone} placeholder="0700123456" />
      </Card>

      {sent ? (
        <Card>
          <CardDescription>Invite sent. The reward posts after the first completed top-up.</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Send invite"
        onPress={() => {
          sendReferralInvite(phone);
          setSent(true);
        }}
      />
    </Screen>
  );
}
