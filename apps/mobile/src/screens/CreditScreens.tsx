import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, Share, Text, View } from 'react-native';
import { formatCredits } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader, ScreenHeaderAction } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  filterTransactions,
  groupTransactionsByDate,
  transactionDirection,
  transactionFilters,
  type TransactionFilter,
} from '@/lib/payments/transaction-view';
import { appRoutes, transactionHref } from '@/lib/routes';

function PackageRow({
  selected,
  label,
  credits,
  price,
  bonus,
  onPress,
}: {
  selected: boolean;
  label: string;
  credits: number;
  price: string;
  bonus: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={
        selected
          ? 'flex-row items-center gap-3 rounded-[16px] border-2 border-primary bg-surface-subtle p-4'
          : 'flex-row items-center gap-3 rounded-[16px] border border-border bg-surface-subtle p-4'
      }
      onPress={onPress}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-display text-body-lg text-foreground">{formatCredits(credits)}</Text>
          <View className="rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="font-body-medium text-caption text-primary">{label}</Text>
          </View>
        </View>
        <Text className="mt-0.5 font-body text-body-md text-muted-foreground">{price} • {bonus}</Text>
      </View>
      <AppIcon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} active={selected} />
    </Pressable>
  );
}

/** Payment method row for the payment-method sheet (M-Pesa / card / wallet). */
function MethodRow({
  icon,
  iconTint,
  title,
  subtitle,
  selected,
  disabled = false,
  badge,
  onPress,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  iconTint: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={
        selected
          ? 'flex-row items-center gap-3 rounded-[16px] border-2 border-primary bg-surface-subtle p-4'
          : `flex-row items-center gap-3 rounded-[16px] border border-border bg-surface-subtle p-4 ${disabled ? 'opacity-60' : ''}`
      }
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: iconTint }}
      >
        <AppIcon name={icon} size={20} active={!disabled} />
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-body-lg text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 font-body text-label-md text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {badge ? (
        <View className="rounded-full bg-secondary px-3 py-1">
          <Text className="font-body text-caption text-muted-foreground">{badge}</Text>
        </View>
      ) : (
        <AppIcon
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          active={selected}
        />
      )}
    </Pressable>
  );
}

export function CreditsScreen() {
  const { walletBalance, walletPackages, transactions } = useMobileApp();

  return (
    <Screen withTabBar>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">Wallet</Text>
        <Link href={appRoutes.transactions} asChild>
          <Pressable className="h-11 w-11 items-center justify-center active:opacity-70">
            <AppIcon name="receipt-outline" size={22} active />
          </Pressable>
        </Link>
      </View>

      <View className="gap-4 rounded-[16px] bg-primary p-6">
        <View className="gap-1">
          <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-white/70">
            Available Credits
          </Text>
          <Text className="font-display text-display-02 text-white">
            {walletBalance.toLocaleString()}
          </Text>
          <Text className="font-body text-body-md text-white/70">Used for verified unlocks</Text>
        </View>
        <Link href={appRoutes.buyCredits} asChild>
          <Pressable className="flex-row items-center justify-center gap-2 rounded-full bg-white py-3 active:opacity-90">
            <AppIcon name="add" size={20} color="#00667E" />
            <Text className="font-display text-body-md text-primary">Top Up Wallet</Text>
          </Pressable>
        </Link>
      </View>

      <Text className="font-display text-headline-sm text-foreground">Top-up packages</Text>
      <View className="gap-3">
        {walletPackages.map((item) => (
          <Link key={item.id} href={appRoutes.buyCredits} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-[16px] border border-border bg-card p-4 active:opacity-90 shadow-card">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <AppIcon name="wallet" size={20} active />
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-body-lg text-foreground">
                  {formatCredits(item.credits)}
                </Text>
                <Text className="mt-0.5 font-body text-body-md text-muted-foreground">
                  {item.bonus}
                </Text>
              </View>
              <Text className="font-display text-body-lg text-primary">{item.price}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Link href={appRoutes.transactions} asChild>
        <Button
          variant="outline"
          label={`View all transactions (${transactions.length})`}
        />
      </Link>
    </Screen>
  );
}

export function BuyCreditsScreen() {
  const { walletPackages, pendingTopUp, initiatePurchase, user } = useMobileApp();
  const [selectedPackageId, setSelectedPackageId] = useState(pendingTopUp?.packageId ?? walletPackages[0]?.id);
  const [method, setMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [phone, setPhone] = useState(pendingTopUp?.phone ?? user.phone);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Screen
      bottomBar={
        <Button
          shape="pill"
          label={isLoading ? 'Sending STK push…' : 'Confirm Payment'}
          disabled={isLoading}
          onPress={async () => {
            if (!selectedPackageId || isLoading) return;
            setPurchaseError(null);
            setIsLoading(true);
            try {
              await initiatePurchase(selectedPackageId, phone);
              router.push(appRoutes.mpesaProcessing);
            } catch (err) {
              setPurchaseError(
                err instanceof Error ? err.message : 'Could not send payment request. Try again.',
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      }
    >
      <Text className="font-display text-display-02 text-foreground">Buy Credits</Text>

      <Text className="font-display text-headline-sm text-foreground">Choose amount</Text>
      <View className="gap-3">
        {walletPackages.map((item) => (
          <PackageRow
            key={item.id}
            selected={selectedPackageId === item.id}
            label={item.label}
            credits={item.credits}
            price={item.price}
            bonus={item.bonus}
            onPress={() => setSelectedPackageId(item.id)}
          />
        ))}
      </View>

      <Text className="font-display text-headline-sm text-foreground">Payment Method</Text>
      <View className="gap-3">
        <MethodRow
          icon="cash-outline"
          iconTint="rgba(52,199,89,0.15)"
          title="M-Pesa"
          subtitle="Instant processing"
          selected={method === 'mpesa'}
          onPress={() => setMethod('mpesa')}
        />
        <MethodRow
          icon="card-outline"
          iconTint="rgba(0,0,0,0.06)"
          title="Credit/Debit Card"
          selected={false}
          disabled
          badge="Coming soon"
          onPress={() => {}}
        />
      </View>

      {method === 'mpesa' ? (
        <View className="gap-2">
          <Text className="font-body-medium text-body-md text-foreground">M-Pesa phone number</Text>
          <Input value={phone} onChangeText={setPhone} placeholder="+254 712 345 678" keyboardType="phone-pad" />
        </View>
      ) : null}

      {purchaseError ? (
        <View className="flex-row items-start gap-2 rounded-[16px] bg-danger/10 p-4">
          <AppIcon name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{purchaseError}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

export function MpesaProcessingScreen() {
  const { pendingTopUp, walletPackages, completeTopUp, refreshWallet } = useMobileApp();
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();
  const selectedPackage = walletPackages.find((item) => item.id === pendingTopUp?.packageId);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Screen header={<ScreenHeader title="Processing Payment" back={false} />}>
      <View className="items-center gap-6 pt-16">
        <View className="h-40 w-40 items-center justify-center rounded-full bg-primary/10">
          <AppIcon name="phone-portrait-outline" size={56} active />
          <Animated.View
            className="absolute right-6 h-3 w-3 rounded-full bg-primary"
            style={{
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) },
              ],
            }}
          />
        </View>

        <View className="items-center gap-2">
          <Text className="font-display text-headline-md text-foreground">
            STK prompt sent to your phone
          </Text>
          <Text className="font-body text-body-lg text-muted-foreground">
            Check your phone for the M-Pesa prompt
          </Text>
          <Text className="font-body text-body-md text-muted-foreground">
            This usually takes <Text className="font-body-bold text-foreground">28 seconds</Text>
          </Text>
        </View>

        {selectedPackage ? (
          <Text className="font-body text-body-md text-muted-foreground">
            {selectedPackage.price} to {pendingTopUp?.phone}
          </Text>
        ) : null}
      </View>

      <View className="gap-3 pt-6">
        <Button
          shape="pill"
          label={isConfirming ? 'Confirming…' : "I've completed the payment"}
          disabled={isConfirming}
          onPress={async () => {
            if (isConfirming) return;
            setIsConfirming(true);
            await refreshWallet();
            completeTopUp();
            router.replace(appRoutes.paymentSuccess);
          }}
        />
        <Link href={appRoutes.contactSupport} asChild>
          <Pressable className="items-center py-2 active:opacity-70">
            <Text className="font-body-medium text-body-md text-primary">Having trouble?</Text>
          </Pressable>
        </Link>
        <Button shape="pill" variant="outline" label="Cancel Payment" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

export function PaymentSuccessScreen() {
  const { latestTopUp, walletBalance } = useMobileApp();
  const router = useRouter();
  const shortId = latestTopUp
    ? `${latestTopUp.id.slice(0, 3).toUpperCase()}…${latestTopUp.id.slice(-4).toUpperCase()}`
    : '—';

  return (
    <Screen
      bottomBar={
        <View className="gap-1">
          <Link href={appRoutes.search} asChild>
            <Button shape="pill" label="Start Browsing" />
          </Link>
          <Pressable className="items-center py-3 active:opacity-70" onPress={() => router.replace(appRoutes.credits)}>
            <Text className="font-body-medium text-body-md text-muted-foreground">Done</Text>
          </Pressable>
        </View>
      }
    >
      <View className="flex-row justify-end">
        <Pressable
          className="h-10 w-10 items-center justify-center active:opacity-70"
          onPress={() => router.replace(appRoutes.credits)}
          accessibilityLabel="Close"
        >
          <AppIcon name="close" size={26} active />
        </Pressable>
      </View>

      <View className="items-center gap-6 pt-4">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-primary shadow-floating">
          <AppIcon name="checkmark" size={56} inverse />
        </View>
        <Text className="text-center font-display text-display-02 text-foreground">
          Payment Successful!
        </Text>
      </View>

      <View className="items-center gap-1 rounded-[16px] bg-surface-subtle p-6">
        <Text className="font-display text-headline-md text-primary">
          {latestTopUp?.credits?.replace(/\s*credits$/i, '').replace(/^\+/, '') ?? '0'} Credits Added
        </Text>
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          Transaction ID: {shortId}
        </Text>
      </View>

      <View className="items-center gap-1 rounded-[16px] bg-surface-subtle p-6">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          Your New Balance
        </Text>
        <Text className="font-display text-display-02 text-foreground">
          {walletBalance.toLocaleString()} KES
        </Text>
      </View>

      <Link href={latestTopUp ? transactionHref(latestTopUp.id) : appRoutes.transactions} asChild>
        <Pressable className="flex-row items-center justify-center gap-2 py-2 active:opacity-70">
          <AppIcon name="receipt-outline" size={18} active />
          <Text className="font-body-medium text-body-md text-primary underline">View Receipt</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const TRANSACTION_ICON: Record<
  TransactionFilter | 'support',
  { name: React.ComponentProps<typeof AppIcon>['name']; tint: string; color: string }
> = {
  all: { name: 'swap-horizontal-outline', tint: 'rgba(0,0,0,0.06)', color: '#8D9192' },
  topup: { name: 'add', tint: 'rgba(52,199,89,0.15)', color: '#34C759' },
  unlock: { name: 'lock-open-outline', tint: 'rgba(0,102,126,0.12)', color: '#00667E' },
  referral: { name: 'reload', tint: 'rgba(255,204,0,0.18)', color: '#B8860B' },
  support: { name: 'help-circle-outline', tint: 'rgba(0,0,0,0.06)', color: '#8D9192' },
};

export function TransactionHistoryScreen() {
  const { transactions } = useMobileApp();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const groups = groupTransactionsByDate(filterTransactions(transactions, filter));

  return (
    <Screen header={<ScreenHeader title="Transactions" />}>
      <View className="flex-row flex-wrap gap-2">
        {transactionFilters.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            active={filter === chip.key}
            onPress={() => setFilter(chip.key)}
          />
        ))}
      </View>

      {groups.length === 0 ? (
        <View className="items-center gap-2 rounded-[16px] bg-surface-subtle py-12">
          <AppIcon name="receipt-outline" size={28} />
          <Text className="font-body text-body-md text-muted-foreground">No transactions yet</Text>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.date} className="gap-3">
          <Text className="font-display text-headline-sm text-foreground">{group.date}</Text>
          {group.items.map((transaction) => {
            const meta = TRANSACTION_ICON[transaction.type] ?? TRANSACTION_ICON.all;
            const direction = transactionDirection(transaction);
            return (
              <Link key={transaction.id} href={transactionHref(transaction.id)} asChild>
                <Pressable className="flex-row items-center gap-3 rounded-[16px] border border-border bg-card p-4 shadow-card active:opacity-90">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: meta.tint }}
                  >
                    <AppIcon name={meta.name} size={20} color={meta.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-medium text-body-lg text-foreground" numberOfLines={1}>
                      {transaction.title}
                    </Text>
                    <Text className="mt-0.5 font-body text-label-md text-muted-foreground">
                      {transaction.status}
                    </Text>
                  </View>
                  <Text
                    className={
                      direction === 'in'
                        ? 'font-display text-body-lg text-success'
                        : direction === 'out'
                          ? 'font-display text-body-lg text-foreground'
                          : 'font-display text-body-lg text-muted-foreground'
                    }
                  >
                    {transaction.credits.replace(/\s*credits$/i, '')}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={
        last
          ? 'flex-row items-center justify-between gap-4 px-4 py-4'
          : 'flex-row items-center justify-between gap-4 border-b border-border px-4 py-4'
      }
    >
      <Text className="font-body text-body-lg text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right font-body-medium text-body-lg text-foreground">{value}</Text>
    </View>
  );
}

export function TransactionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { transactions } = useMobileApp();
  const router = useRouter();
  const transaction = transactions.find((item) => item.id === params.id);

  if (!transaction) {
    return (
      <Screen header={<ScreenHeader title="Transaction Details" />}>
        <Card>
          <CardTitle>Transaction not found</CardTitle>
          <CardDescription>That activity entry could not be loaded.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const direction = transactionDirection(transaction);
  const paymentMethod = transaction.type === 'topup' ? 'M-Pesa' : 'PataSpace Wallet';
  const primaryAmount =
    transaction.type === 'topup' ? transaction.amount : transaction.credits.replace(/\s*credits$/i, ' credits');

  return (
    <Screen
      header={
        <ScreenHeader
          title="Transaction Details"
          right={
            <ScreenHeaderAction
              icon="share-outline"
              accessibilityLabel="Share receipt"
              onPress={() =>
                void Share.share({
                  message: `${transaction.title} — ${primaryAmount} (${transaction.status}). Ref ${transaction.id}, ${transaction.date}.`,
                })
              }
            />
          }
        />
      }
      bottomBar={
        <View className="flex-row gap-3">
          <Link href={appRoutes.contactSupport} asChild>
            <Button className="flex-1" shape="pill" variant="outline" label="Get Help" />
          </Link>
          <Link href={appRoutes.dispute} asChild>
            <Button className="flex-1" shape="pill" variant="secondary" label="Request Refund" />
          </Link>
        </View>
      }
    >
      <View className="flex-row items-center justify-center gap-2 rounded-full bg-success/10 py-3">
        <AppIcon
          name={transaction.status === 'Completed' ? 'checkmark-circle' : 'time-outline'}
          size={18}
          color={transaction.status === 'Completed' ? '#34C759' : '#8D9192'}
        />
        <Text
          className={
            transaction.status === 'Completed'
              ? 'font-body-medium text-body-md text-success'
              : 'font-body-medium text-body-md text-muted-foreground'
          }
        >
          {transaction.status}
        </Text>
      </View>

      <View className="gap-3 rounded-[16px] bg-card p-5 shadow-card">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-subtle">
          <AppIcon
            name={direction === 'in' ? 'add' : 'lock-open-outline'}
            size={22}
            active
          />
        </View>
        <Text className="font-display text-display-02 text-foreground">{primaryAmount}</Text>
        <Text className="font-body text-body-lg text-muted-foreground">{transaction.title}</Text>
      </View>

      <View className="rounded-[16px] bg-card shadow-card">
        <DetailRow label="Transaction ID" value={transaction.id} />
        <DetailRow label="Date" value={transaction.date} />
        <DetailRow label="Status" value={transaction.status} />
        <DetailRow label="Payment Method" value={paymentMethod} last />
      </View>

      <View className="gap-2 rounded-[16px] bg-surface-subtle p-4">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          Notes
        </Text>
        <Text className="font-body text-body-md text-foreground">{transaction.detail}</Text>
      </View>

      <View className="h-2" />
      <View className="items-center">
        <Pressable
          className="flex-row items-center gap-2 py-1 active:opacity-70"
          onPress={() => router.push(appRoutes.transactions)}
        >
          <AppIcon name="chevron-back" size={16} active />
          <Text className="font-body-medium text-body-md text-primary">Back to all transactions</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export function DisputeScreen() {
  const params = useLocalSearchParams<{ unlockId?: string }>();
  const unlockId = Array.isArray(params.unlockId) ? params.unlockId[0] : params.unlockId;
  const [subject, setSubject] = useState('Unlock issue');
  const [detail, setDetail] = useState('I need help reviewing a wallet or unlock event.');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { supportTopics, submitDispute, submitDisputeForUnlock } = useMobileApp();

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

      {errorMessage ? (
        <Card>
          <CardTitle className="text-[20px]">Could not file dispute</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Submit issue"
        onPress={async () => {
          setErrorMessage(null);
          if (!unlockId) {
            submitDispute(subject, detail);
            setSubmitted(true);
            return;
          }
          const outcome = await submitDisputeForUnlock(unlockId, subject, detail);
          if (outcome === 'success') {
            setSubmitted(true);
          } else if (outcome === 'already_filed') {
            setErrorMessage('A dispute is already on file for this unlock.');
          } else {
            setErrorMessage('We could not reach the support backend. Try again.');
          }
        }}
      />
    </Screen>
  );
}

function referralStatusLabel(status: string): string {
  if (status === 'INVITED') return 'Invite sent';
  if (status === 'JOINED') return 'Joined — reward pending purchase';
  if (status === 'REWARDED') return 'Rewarded';
  return status;
}

export function ReferralScreen() {
  const [phone, setPhone] = useState('0700123456');
  const [sent, setSent] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const {
    referralCode,
    referralHighlights,
    sendReferralInvite,
    referrals,
    rewardedReferralCount,
    refreshReferrals,
  } = useMobileApp();

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

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Invites</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">{referrals.length}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Rewarded</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">{rewardedReferralCount}</Text>
        </Card>
      </View>

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

      {errorText ? (
        <Card>
          <CardDescription>{errorText}</CardDescription>
        </Card>
      ) : null}

      <Button
        label="Send invite"
        onPress={async () => {
          setErrorText(null);
          const outcome = await sendReferralInvite(phone);
          if (outcome === 'success') {
            setSent(true);
            return;
          }
          if (outcome === 'already_invited') {
            setErrorText('You have already invited that number.');
          } else if (outcome === 'self') {
            setErrorText('You cannot refer yourself.');
          } else {
            setErrorText('We could not send the invite. Try again later.');
          }
        }}
      />

      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-semibold text-foreground">Your invites</Text>
        <Pressable onPress={() => refreshReferrals()}>
          <Text className="text-sm text-primary">Refresh</Text>
        </Pressable>
      </View>

      {referrals.length === 0 ? (
        <Card>
          <CardDescription>
            No invites yet. Use the form above to invite a friend.
          </CardDescription>
        </Card>
      ) : (
        <View className="gap-2">
          {referrals.map((entry) => (
            <Card key={entry.id} className="px-4 py-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-sm font-semibold text-foreground">
                  {entry.inviteePhoneMasked}
                </Text>
                <Badge variant={entry.status === 'REWARDED' ? 'dark' : 'secondary'}>
                  {entry.status}
                </Badge>
              </View>
              <Text className="mt-1 text-xs text-muted-foreground">
                {referralStatusLabel(entry.status)}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
