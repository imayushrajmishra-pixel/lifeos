import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askGemini } from '@/lib/ai/gemini';
import { buildStudyOverview } from '@/lib/study';
import { saveTask } from '@/lib/actions/tasks';

type AIAction =
  | 'mark_chapter_complete'
  | 'set_chapter_strength'
  | 'update_daily_context'
  | 'create_task'
  | null;

type AIActionPayload = {
  action?: AIAction;

  chapter_id?: string | null;
  strength?: 'weak' | 'average' | 'strong' | null;

  available_minutes?: number | null;
  study_minutes?: number | null;
  mobile_minutes?: number | null;
  tv_minutes?: number | null;

  mood?: string | null;
  energy?: string | null;
  preferred_subject?: string | null;
  notes?: string | null;

  title?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  category?: string | null;
  is_recurring?: boolean | null;
};

function cleanNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number < 0 || number > 1440) {
    return null;
  }

  return Math.round(number);
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function formatTodayPlan(overview: any) {
  if (!overview?.todayPlan) {
    return [];
  }

  return overview.todayPlan.slice(0, 8).map((item: any) => ({
    chapter_id: item?.chapter?.id ?? null,
    chapter:
      item?.chapter?.title ??
      item?.chapter?.name ??
      'Chapter',
    subject: item?.subjectName ?? 'Study',
    minutes: item?.minutes ?? 0,
    priority: item?.priority ?? 'medium',
    kind: item?.kind ?? 'chapter',
    reason:
      item?.reason ??
      "Part of today's study plan.",
  }));
}

function buildPlanSummary(overview: any) {
  if (!overview) {
    return null;
  }

  return {
    study_minutes:
      overview.todayStudyBudgetMinutes ?? 0,
    leisure_minutes:
      overview.todayLeisureMinutes ?? 0,
    remaining_chapters:
      overview.remainingChapters ?? 0,
    days_remaining:
      overview.daysRemaining ?? 0,
    is_behind_pace:
      overview.isBehindOriginalPace ?? false,
    plan: formatTodayPlan(overview),
  };
}

function getTodayIndia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // ---------------------------------------------------------------
    // AUTH
    // ---------------------------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'You must be signed in.',
        },
        { status: 401 }
      );
    }
    

    // ---------------------------------------------------------------
    // REQUEST
    // ---------------------------------------------------------------

    const body = await request.json();

    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : '';

    const history = Array.isArray(body.history)
      ? body.history
      : [];

    if (!message) {
      return NextResponse.json(
        {
          error: 'Message is required.',
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------
    // TODAY
    // ---------------------------------------------------------------

    const today = getTodayIndia();

    // ---------------------------------------------------------------
    // LOAD LIFEOS DATA
    // ---------------------------------------------------------------

    const [
      { data: goal },
      { data: subjects },
      { data: chapters },
      { data: revisions },
      { data: sessions },
      { data: tests },
      { data: tasks },
    ] = await Promise.all([
      supabase
        .from('study_goals')
        .select('*')
        .eq('is_active', true)
        .maybeSingle(),

      supabase
        .from('study_subjects')
        .select('*')
        .order('created_at', {
          ascending: true,
        }),

      supabase
        .from('study_chapters')
        .select('*')
        .order('created_at', {
          ascending: true,
        }),

      supabase
        .from('study_revisions')
        .select('*')
        .order('scheduled_for', {
          ascending: true,
        }),

      supabase
        .from('study_sessions')
        .select('*')
        .order('started_at', {
          ascending: false,
        })
        .limit(50),

      supabase
        .from('study_tests')
        .select('*')
        .order('test_date', {
          ascending: true,
        }),

      supabase
        .from('tasks')
        .select('*')
        .eq('is_completed', false)
        .order('due_date', {
          ascending: true,
          nullsFirst: false,
        }),
    ]);

    // ---------------------------------------------------------------
    // DAILY CONTEXT
    // ---------------------------------------------------------------

    let dailyContext: any = null;

    if (goal?.id) {
      const { data, error } = await supabase
        .from('study_daily_context')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error(
          'Daily context load error:',
          error
        );
      }

      dailyContext = data;
    }

    // ---------------------------------------------------------------
    // OLD AVAILABILITY
    // ---------------------------------------------------------------

    let oldAvailability: any = null;

    if (goal?.id) {
      const { data } = await supabase
        .from('study_daily_availability')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('date', today)
        .maybeSingle();

      oldAvailability = data;
    }

    // ---------------------------------------------------------------
    // STUDY OVERVIEW
    // ---------------------------------------------------------------

    const overview = goal
      ? buildStudyOverview(
          goal,
          subjects ?? [],
          chapters ?? [],
          {
            revisions: revisions ?? [],
            sessions: sessions ?? [],
            tests: tests ?? [],
            dailyContext: dailyContext ?? null,
          }
        )
      : null;

    // ---------------------------------------------------------------
    // CHAPTER CONTEXT
    // ---------------------------------------------------------------

    const chapterLookup = (chapters ?? []).map(
      (chapter: any) => ({
        id: chapter.id,

        title:
          chapter.title ??
          chapter.name ??
          'Untitled chapter',

        subject_id: chapter.subject_id,

        subject_name:
          (subjects ?? []).find(
            (subject: any) =>
              subject.id === chapter.subject_id
          )?.name ?? 'Unknown subject',

        status: chapter.status,
        strength: chapter.strength,
      })
    );

    // ---------------------------------------------------------------
    // TASK CONTEXT
    // ---------------------------------------------------------------

    const taskContext = (tasks ?? []).map(
      (task: any) => ({
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        priority: task.priority,
        category: task.category ?? null,
      })
    );

    // ---------------------------------------------------------------
    // SYSTEM PROMPT
    // ---------------------------------------------------------------

    const systemPrompt = `
You are LifeOS AI.

You are the personal AI layer inside LifeOS.

You help the user manage:

- study
- tasks
- goals
- time
- mood
- energy
- leisure
- preferences
- deadlines
- tests
- routines

The user should be able to speak naturally.

Examples:

"Aaj mere paas 3 ghante free hain."

"Aaj padhne ka mann nahi hai."

"Aaj thoda mobile chalana hai."

"Shaam ko TV dekhna hai."

"Aaj Maths karne ka mood hai."

"Science aaj nahi karni."

"Kal Maths ka test hai."

"I have to go to gym, add it to my tasks."

"Kal doctor ke paas jaana hai, task bana do."

"Tomorrow I need to submit my assignment."

Do not judge:

- mobile
- TV
- entertainment
- going out
- rest
- breaks
- hobbies
- leisure

These are part of the user's real life.

DAILY PLANNING:

available_minutes means the total amount of free time the user says they have.

It does NOT mean the user must study for the entire amount.

Example:

available_minutes = 180
mobile_minutes = 30
tv_minutes = 45

The user has 180 minutes available and wants to spend 75 minutes on mobile/TV.

Study should fit inside realistic remaining capacity.

Consider:

- upcoming tests
- deadlines
- weak chapters
- revisions
- completed chapters
- motivation
- energy
- mood
- preferred subjects
- existing tasks
- remaining chapters
- days remaining

If the user does not feel like studying, reduce intensity rather than ignoring what they said.

If an urgent test exists, it can still receive priority.

The goal is a realistic day, not maximum study time.

CONTROLLED WRITE ACTIONS:

1. mark_chapter_complete
2. set_chapter_strength
3. update_daily_context
4. create_task

For write actions, return ONLY valid JSON.

For normal questions, return normal helpful text.

ACTION: mark_chapter_complete

{
  "action": "mark_chapter_complete",
  "chapter_id": "exact-id"
}

ACTION: set_chapter_strength

{
  "action": "set_chapter_strength",
  "chapter_id": "exact-id",
  "strength": "weak"
}

ACTION: update_daily_context

{
  "action": "update_daily_context",
  "available_minutes": 180,
  "mobile_minutes": 30,
  "tv_minutes": 45,
  "mood": "low",
  "energy": "medium",
  "preferred_subject": "Maths",
  "notes": "Does not feel like studying much today"
}

For update_daily_context:

Only include information the user actually communicated.

Do not invent values.

Do not automatically set unspecified fields to zero.

Do not erase existing information unless the user explicitly changes it.

ACTION: create_task

Use create_task whenever the user clearly asks LifeOS to create or add something to their task list.

Examples:

"I have to go to gym, add it to my tasks."

"Add gym to my tasks."

"Kal assignment submit karna hai, task bana do."

"Tomorrow I need to call my teacher."

"Add buy notebooks to my tasks."

Return:

{
  "action": "create_task",
  "title": "Gym",
  "due_date": "YYYY-MM-DD",
  "priority": "medium",
  "category": "general",
  "notes": null,
  "is_recurring": false
}

CREATE_TASK RULES:

1. title is required.

2. Use a short natural task title.

3. If the user clearly says today, use today's date.

4. If the user clearly says tomorrow, use tomorrow's date.

5. If the user gives another explicit date, use that date.

6. If the user gives no date, use today's date for a normal immediate/personal task.

7. Default priority is medium.

8. Use high priority only when the user clearly communicates urgency or importance.

9. Default category is general.

10. Use a more specific category only when clearly appropriate.

11. Default notes is null.

12. Default is_recurring is false.

13. Never invent a recurrence pattern.

14. Never invent a specific time because the task system stores dates, not times.

15. Never create a task unless the user clearly asks for a task/action to be added.

16. Do not create duplicate tasks based only on normal conversation.

17. For a simple request such as:

"I have to go to gym, add it to my tasks"

return a create_task action directly.

IMPORTANT:

Chapter IDs must come EXACTLY from the supplied chapter data.

Never invent chapter IDs.

CURRENT DATE:
${today}

CURRENT CHAPTER DATA:
${JSON.stringify(chapterLookup, null, 2)}

CURRENT STUDY OVERVIEW:
${JSON.stringify(overview, null, 2)}

CURRENT DAILY CONTEXT:
${JSON.stringify(dailyContext ?? null, null, 2)}

OLD AVAILABILITY DATA:
${JSON.stringify(oldAvailability ?? null, null, 2)}

CURRENT PENDING TASKS:
${JSON.stringify(taskContext, null, 2)}

CURRENT ACTIVE GOAL:
${JSON.stringify(goal ?? null, null, 2)}

CURRENT SUBJECTS:
${JSON.stringify(subjects ?? [], null, 2)}

CURRENT TESTS:
${JSON.stringify(tests ?? [], null, 2)}
`;

    // ---------------------------------------------------------------
    // CONVERSATION HISTORY
    // ---------------------------------------------------------------

    const recentHistory = history
      .slice(-10)
      .map((item: any) => {
        const role =
          item?.role === 'assistant'
            ? 'Assistant'
            : 'User';

        const content =
          typeof item?.content === 'string'
            ? item.content
            : '';

        return `${role}: ${content}`;
      })
      .join('\n');

    // ---------------------------------------------------------------
    // GEMINI
    // ---------------------------------------------------------------

    const prompt = `
${systemPrompt}

RECENT CONVERSATION:

${recentHistory || '(No previous conversation)'}

NEW USER MESSAGE:

${message}

Now respond according to the rules above.
`;

    const rawAnswer = await askGemini(prompt);

    // ---------------------------------------------------------------
    // PARSE ACTION
    // ---------------------------------------------------------------

    let parsedAction: AIActionPayload | null = null;

    try {
      const cleaned = rawAnswer
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const possibleJson = JSON.parse(cleaned);

      if (
        possibleJson &&
        typeof possibleJson === 'object' &&
        possibleJson.action
      ) {
        parsedAction = possibleJson;
      }
    } catch {
      // Normal text response.
    }

    // ---------------------------------------------------------------
    // NO ACTION
    // ---------------------------------------------------------------

    if (!parsedAction?.action) {
      return NextResponse.json({
        answer: rawAnswer,
      });
    }

    // ---------------------------------------------------------------
    // ACTION 1 — MARK CHAPTER COMPLETE
    // ---------------------------------------------------------------

    if (
      parsedAction.action ===
      'mark_chapter_complete'
    ) {
      const chapterId =
        cleanNullableString(
          parsedAction.chapter_id
        );

      if (!chapterId) {
        return NextResponse.json({
          answer:
            'Mujhe exact chapter identify nahi hua. Chapter ka naam bata do.',
        });
      }

      const chapterExists =
        (chapters ?? []).some(
          (chapter: any) =>
            chapter.id === chapterId
        );

      if (!chapterExists) {
        return NextResponse.json({
          answer:
            'Ye chapter current study data me nahi mila, isliye maine koi change nahi kiya.',
        });
      }

      const { error } = await supabase
        .from('study_chapters')
        .update({
          status: 'completed',
        })
        .eq('id', chapterId);

      if (error) {
        console.error(
          'AI chapter completion error:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Chapter update nahi ho paya.',
          },
          { status: 500 }
        );
      }

      const chapter =
        (chapters ?? []).find(
          (item: any) =>
            item.id === chapterId
        );

      const updatedOverview = goal
        ? buildStudyOverview(
            goal,
            subjects ?? [],
            (chapters ?? []).map(
              (item: any) =>
                item.id === chapterId
                  ? {
                      ...item,
                      status: 'completed',
                    }
                  : item
            ),
            {
              revisions: revisions ?? [],
              sessions: sessions ?? [],
              tests: tests ?? [],
              dailyContext:
                dailyContext ?? null,
            }
          )
        : null;

      return NextResponse.json({
        answer: `Done — ${
          chapter?.title ??
          chapter?.name ??
          'chapter'
        } ko completed mark kar diya.`,

        action:
          'mark_chapter_complete',

        todayEngine:
          buildPlanSummary(
            updatedOverview
          ),
      });
    }

    // ---------------------------------------------------------------
    // ACTION 2 — SET CHAPTER STRENGTH
    // ---------------------------------------------------------------

    if (
      parsedAction.action ===
      'set_chapter_strength'
    ) {
      const chapterId =
        cleanNullableString(
          parsedAction.chapter_id
        );

      const strength =
        parsedAction.strength;

      if (!chapterId || !strength) {
        return NextResponse.json({
          answer:
            'Chapter aur strength dono clearly identify nahi hue.',
        });
      }

      if (
        ![
          'weak',
          'average',
          'strong',
        ].includes(strength)
      ) {
        return NextResponse.json({
          answer:
            'Strength sirf weak, average ya strong ho sakti hai.',
        });
      }

      const chapterExists =
        (chapters ?? []).some(
          (chapter: any) =>
            chapter.id === chapterId
        );

      if (!chapterExists) {
        return NextResponse.json({
          answer:
            'Ye chapter current study data me nahi mila.',
        });
      }

      const { error } = await supabase
        .from('study_chapters')
        .update({
          strength,
        })
        .eq('id', chapterId);

      if (error) {
        console.error(
          'AI chapter strength error:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Chapter strength update nahi ho payi.',
          },
          { status: 500 }
        );
      }

      const chapter =
        (chapters ?? []).find(
          (item: any) =>
            item.id === chapterId
        );

      const updatedOverview = goal
        ? buildStudyOverview(
            goal,
            subjects ?? [],
            (chapters ?? []).map(
              (item: any) =>
                item.id === chapterId
                  ? {
                      ...item,
                      strength,
                    }
                  : item
            ),
            {
              revisions: revisions ?? [],
              sessions: sessions ?? [],
              tests: tests ?? [],
              dailyContext:
                dailyContext ?? null,
            }
          )
        : null;

      return NextResponse.json({
        answer: `Done — ${
          chapter?.title ??
          chapter?.name ??
          'chapter'
        } ko ${strength} mark kar diya.`,

        action:
          'set_chapter_strength',

        todayEngine:
          buildPlanSummary(
            updatedOverview
          ),
      });
    }

    // ---------------------------------------------------------------
    // ACTION 3 — UPDATE DAILY CONTEXT
    // ---------------------------------------------------------------

    if (
      parsedAction.action ===
      'update_daily_context'
    ) {
      if (!goal?.id) {
        return NextResponse.json({
          answer:
            'Pehle ek active study goal set karna hoga.',
        });
      }

      const updates: Record<string, any> = {};

      const availableMinutes =
        validMinutes(
          parsedAction.available_minutes
        );

      const studyMinutes =
        validMinutes(
          parsedAction.study_minutes
        );

      const mobileMinutes =
        validMinutes(
          parsedAction.mobile_minutes
        );

      const tvMinutes =
        validMinutes(
          parsedAction.tv_minutes
        );

      if (availableMinutes !== null) {
        updates.available_minutes =
          availableMinutes;
      }

      if (studyMinutes !== null) {
        updates.study_minutes =
          studyMinutes;
      }

      if (mobileMinutes !== null) {
        updates.mobile_minutes =
          mobileMinutes;
      }

      if (tvMinutes !== null) {
        updates.tv_minutes =
          tvMinutes;
      }

      const mood =
        cleanNullableString(
          parsedAction.mood
        );

      const energy =
        cleanNullableString(
          parsedAction.energy
        );

      const preferredSubject =
        cleanNullableString(
          parsedAction.preferred_subject
        );

      const notes =
        cleanNullableString(
          parsedAction.notes
        );

      if (mood !== null) {
        updates.mood = mood;
      }

      if (energy !== null) {
        updates.energy = energy;
      }

      if (preferredSubject !== null) {
        updates.preferred_subject =
          preferredSubject;
      }

      if (notes !== null) {
        updates.notes = notes;
      }

      if (
        Object.keys(updates).length === 0
      ) {
        return NextResponse.json({
          answer:
            'Mujhe daily context me update karne ke liye koi clear information nahi mili.',
        });
      }

      const {
        data: existingContext,
        error: existingError,
      } = await supabase
        .from('study_daily_context')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('date', today)
        .maybeSingle();

      if (existingError) {
        console.error(
          'Daily context read error:',
          existingError
        );

        return NextResponse.json(
          {
            error:
              'Daily context read nahi ho paya.',
          },
          { status: 500 }
        );
      }

      const payload: Record<string, any> = {
        goal_id: goal.id,
        date: today,
        ...(existingContext ?? {}),
        ...updates,
        updated_at:
          new Date().toISOString(),
      };

      delete payload.id;
      delete payload.created_at;

      const { error: upsertError } =
        await supabase
          .from('study_daily_context')
          .upsert(payload, {
            onConflict:
              'goal_id,date',
          });

      if (upsertError) {
        console.error(
          'AI daily context update error:',
          upsertError
        );

        return NextResponse.json(
          {
            error:
              'Daily context update nahi ho paya.',
          },
          { status: 500 }
        );
      }

      const freshDailyContext = {
        ...(existingContext ?? {}),
        ...updates,
      };

      const updatedOverview =
        buildStudyOverview(
          goal,
          subjects ?? [],
          chapters ?? [],
          {
            revisions: revisions ?? [],
            sessions: sessions ?? [],
            tests: tests ?? [],
            dailyContext:
              freshDailyContext,
          }
        );

      const changedParts: string[] = [];

      if (availableMinutes !== null) {
        changedParts.push(
          `${availableMinutes} min free time`
        );
      }

      if (studyMinutes !== null) {
        changedParts.push(
          `${studyMinutes} min study`
        );
      }

      if (mobileMinutes !== null) {
        changedParts.push(
          `${mobileMinutes} min mobile`
        );
      }

      if (tvMinutes !== null) {
        changedParts.push(
          `${tvMinutes} min TV`
        );
      }

      if (mood) {
        changedParts.push(
          `mood: ${mood}`
        );
      }

      if (energy) {
        changedParts.push(
          `energy: ${energy}`
        );
      }

      if (preferredSubject) {
        changedParts.push(
          `preferred subject: ${preferredSubject}`
        );
      }

      if (notes) {
        changedParts.push(
          `note: ${notes}`
        );
      }

      const studyMinutesResult =
        updatedOverview
          ?.todayStudyBudgetMinutes ?? 0;

      const leisureMinutesResult =
        updatedOverview
          ?.todayLeisureMinutes ?? 0;

      const plan =
        formatTodayPlan(
          updatedOverview
        );

      const planText =
        plan.length > 0
          ? plan
              .slice(0, 4)
              .map(
                (item: any) =>
                  `${item.subject} — ${item.chapter} (${item.minutes}m)`
              )
              .join(', ')
          : 'No study item scheduled right now.';

      return NextResponse.json({
        answer:
          changedParts.length > 0
            ? `Done — aaj ka context update kar diya: ${changedParts.join(
                ', '
              )}. Ab adjusted plan me around ${studyMinutesResult} min study aur ${leisureMinutesResult} min leisure fit ho raha hai. Aaj ka plan: ${planText}`
            : `Done — aaj ka context update kar diya. Adjusted study plan: ${planText}`,

        action:
          'update_daily_context',

        todayEngine:
          buildPlanSummary(
            updatedOverview
          ),
      });
    }

    // ---------------------------------------------------------------
    // ACTION 4 — CREATE TASK
    // ---------------------------------------------------------------

    if (
      parsedAction.action ===
      'create_task'
    ) {
      const title =
        cleanNullableString(
          parsedAction.title
        );

      if (!title) {
        return NextResponse.json({
          answer:
            'Task ka naam clearly identify nahi hua, isliye maine task create nahi kiya.',
        });
      }

      const dueDate =
        isValidDateString(
          parsedAction.due_date
        )
          ? parsedAction.due_date
          : today;

      const priority =
        parsedAction.priority &&
        [
          'low',
          'medium',
          'high',
        ].includes(
          parsedAction.priority
        )
          ? parsedAction.priority
          : 'medium';

      const category =
        cleanNullableString(
          parsedAction.category
        ) ?? 'general';

      const notes =
        cleanNullableString(
          parsedAction.notes
        );

      const isRecurring =
        parsedAction.is_recurring === true;

      // Create FormData for the existing
      // task server action.
      const formData = new FormData();

      formData.set(
        'title',
        title
      );

      formData.set(
        'due_date',
        dueDate
      );

      formData.set(
        'priority',
        priority
      );

      formData.set(
        'category',
        category
      );

      if (notes) {
        formData.set(
          'notes',
          notes
        );
      }

      if (isRecurring) {
        formData.set(
          'is_recurring',
          'on'
        );
      }

      const result =
        await saveTask(formData);

      if (
        result?.error
      ) {
        console.error(
          'AI task creation error:',
          result.error
        );

        return NextResponse.json(
          {
            error:
              'Task create nahi ho paya.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        answer:
          dueDate === today
            ? `Done — "${title}" aaj ke tasks me add kar diya.`
            : `Done — "${title}" task ${dueDate} ke liye add kar diya.`,

        action:
          'create_task',

        task: {
          title,
          due_date: dueDate,
          priority,
          category,
          notes,
          is_recurring: isRecurring,
        },
      });
    }

    // ---------------------------------------------------------------
    // FALLBACK
    // ---------------------------------------------------------------

    return NextResponse.json({
      answer: rawAnswer,
    });
  } catch (error) {
    console.error(
      'LifeOS AI error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'LifeOS AI request failed',
      },
      { status: 500 }
    );
  }
}