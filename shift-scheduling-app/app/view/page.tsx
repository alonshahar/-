'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import { WeekSelector } from '@/components/week-selector';
import { 
  getSoldiers, 
  getAssignments,
  getWeekStatus,
} from '@/app/actions/schedule';
import { DAYS_OF_WEEK, TASK_COLORS, getWeekStart, getWeekDates, formatDateShort, TaskType } from '@/lib/types';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

interface Soldier {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  soldierId: number;
  weekStart: string;
  dayOfWeek: number;
  task: string;
  details: string | null;
}

interface WeekStatus {
  weekStart: string;
  published: boolean;
}

export default function ViewPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());

  // Fetch soldiers
  const { data: soldiers = [] } = useSWR<Soldier[]>('soldiers', getSoldiers);

  // Fetch week status
  const { data: weekStatus } = useSWR<WeekStatus>(
    `week-status-${weekStart}`,
    () => getWeekStatus(weekStart)
  );

  // Fetch assignments
  const { data: assignments = [] } = useSWR<Assignment[]>(
    `assignments-${weekStart}`,
    () => getAssignments(weekStart)
  );

  const isPublished = weekStatus?.published ?? false;

  const getAssignment = (soldierId: number, dayOfWeek: number): Assignment | undefined => {
    return assignments.find(a => a.soldierId === soldierId && a.dayOfWeek === dayOfWeek);
  };

  const weekDates = getWeekDates(weekStart);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">סידור שבועי</h1>
            <p className="text-muted-foreground mt-2">צפה בשיבוצים לשבוע הנבחר</p>
          </div>

          <WeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />

          {!isPublished ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">הסידור טרם פורסם</h2>
                  <p>המפקד עדיין לא פרסם את הסידור לשבוע זה</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>טבלת שיבוצים</CardTitle>
                <CardDescription>
                  סידור עבודה לשבוע {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border bg-muted p-3 text-right font-semibold sticky right-0 bg-muted z-10 min-w-[120px]">
                          חייל
                        </th>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <th key={index} className="border bg-muted p-3 text-center font-semibold min-w-[100px]">
                            <div>{day}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              {formatDateShort(weekDates[index])}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {soldiers.map((soldier) => (
                        <tr key={soldier.id}>
                          <td className="border p-3 font-medium sticky right-0 bg-card z-10">
                            {soldier.name}
                          </td>
                          {DAYS_OF_WEEK.map((_, dayIndex) => {
                            const assignment = getAssignment(soldier.id, dayIndex);
                            return (
                              <td key={dayIndex} className="border p-2 text-center">
                                {assignment ? (
                                  <div 
                                    className={cn(
                                      'px-2 py-1 rounded text-sm font-medium border',
                                      TASK_COLORS[assignment.task as TaskType]
                                    )}
                                  >
                                    <div>{assignment.task}</div>
                                    {assignment.details && (
                                      <div className="text-xs opacity-75 mt-1">
                                        {assignment.details}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm font-medium">מקרא:</div>
                  {Object.entries(TASK_COLORS).map(([task, colors]) => (
                    <div 
                      key={task}
                      className={cn('px-3 py-1 rounded text-sm border', colors)}
                    >
                      {task}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
