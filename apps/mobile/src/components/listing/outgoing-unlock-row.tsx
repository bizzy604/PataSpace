/**
 * Purpose: One received-unlock row on the owner listing screen — status badges
 *   and the "Confirm I am moving out" action with its submit/error state.
 * Why important: The supply side's move-out confirmation lives here; the
 *   commission cannot proceed until this action succeeds.
 * Used by: screens/MyListingDetailsScreen.tsx.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { ReceivedUnlockRecord } from '@pataspace/contracts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function OutgoingUnlockRow({
  unlock,
  onConfirm,
}: {
  unlock: ReceivedUnlockRecord;
  onConfirm: (unlockId: string) => Promise<'success' | 'already_confirmed' | 'error'>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = unlock.isRefunded || unlock.status === 'disputed';

  return (
    <View className="gap-2 rounded-[12px] bg-surface-subtle p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-body-medium text-body-md text-foreground">
          Unlock · {unlock.incomingConfirmed ? 'tenant confirmed' : 'tenant pending'}
        </Text>
        <Badge variant={unlock.outgoingConfirmed ? 'success' : 'warning'}>
          {unlock.outgoingConfirmed ? 'You confirmed' : 'Action needed'}
        </Badge>
      </View>
      {error ? <Text className="font-body text-label-md text-danger">{error}</Text> : null}
      {unlock.outgoingConfirmed ? (
        <Text className="font-body text-label-md text-muted-foreground">
          Your move-out is confirmed. Commission unlocks once both sides agree.
        </Text>
      ) : blocked ? (
        <Text className="font-body text-label-md text-muted-foreground">
          {unlock.isRefunded
            ? 'This unlock was refunded; no confirmation needed.'
            : 'This unlock is under dispute. Resolve it before confirming.'}
        </Text>
      ) : (
        <Button
          size="sm"
          label={submitting ? 'Recording…' : 'Confirm I am moving out'}
          disabled={submitting}
          onPress={() => {
            setError(null);
            setSubmitting(true);
            void onConfirm(unlock.unlockId)
              .then((result) => {
                if (result === 'error') {
                  setError('We could not record your confirmation. Try again.');
                }
              })
              .finally(() => setSubmitting(false));
          }}
        />
      )}
    </View>
  );
}
