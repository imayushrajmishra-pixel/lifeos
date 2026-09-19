'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveGoal } from '@/lib/actions/study';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { StudyGoal } from '@/lib/types';

export function GoalForm({ goal, onDone }: { goal: StudyGoal | null; onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <form
        action={(fd) => {
          if (goal) fd.set('id', goal.id);
          startTransition(async () => {
            await saveGoal(fd);
            onDone?.();
            router.refresh();
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="title">Goal</Label>
          <Input id="title" name="title" defaultValue={goal?.title} placeholder="Complete Class 10 syllabus" required />
        </div>
        <div>
          <Label htmlFor="target_date">Target date</Label>
          <Input id="target_date" name="target_date" type="date" defaultValue={goal?.target_date} required />
        </div>
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : goal ? 'Update goal' : 'Start this goal'}</Button>
      </form>
    </Card>
  );
}
