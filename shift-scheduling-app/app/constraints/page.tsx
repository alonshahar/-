'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/navigation';
import { WeekSelector } from '@/components/week-selector';
import { DAYS_OF_WEEK, getWeekStart } from '@/lib/types';
import { 
  getSoldiers, 
  getConstraintsBySoldier, 
  addConstraint, 
  removeConstraint,
} from '@/app/actions/schedule';
import useSWR from 'swr';

interface Soldier {
  id: number;
  name: string;
}

interface Constraint {
  id: number;
  soldierId: number;
  weekStart: string;
  dayOfWeek: number;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export default function ConstraintsPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [selectedSoldierId, setSelectedSoldierId] = useState<string>('');
  
  // Form state
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch soldiers
  const { data: soldiers = [] } = useSWR<Soldier[]>('soldiers', getSoldiers);

  // Fetch constraints for selected soldier
  const { data: soldierConstraints = [], mutate: mutateConstraints } = useSWR<Constraint[]>(
    selectedSoldierId ? `constraints-${selectedSoldierId}-${weekStart}` : null,
    () => selectedSoldierId ? getConstraintsBySoldier(Number(selectedSoldierId), weekStart) : []
  );

  const handleAddConstraint = async () => {
    if (!selectedSoldierId || !selectedDay) return;
    
    setIsSubmitting(true);
    try {
      await addConstraint({
        soldierId: Number(selectedSoldierId),
        weekStart,
        dayOfWeek: parseInt(selectedDay),
        allDay: isFullDay,
        startTime: isFullDay ? undefined : startTime,
        endTime: isFullDay ? undefined : endTime,
        reason: reason || undefined,
      });
      
      mutateConstraints();
      setSelectedDay('');
      setIsFullDay(true);
      setStartTime('');
      setEndTime('');
      setReason('');
    } catch (error) {
      console.error('Error adding constraint:', error);
      alert('שגיאה בהוספת האילוץ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveConstraint = async (id: number) => {
    try {
      await removeConstraint(id);
      mutateConstraints();
    } catch (error) {
      console.error('Error removing constraint:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">הגשת אילוצים</h1>
            <p className="text-muted-foreground mt-2">בחר את שמך והוסף את האילוצים שלך לשבוע</p>
          </div>

          <WeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />

          <Card>
            <CardHeader>
              <CardTitle>בחר חייל</CardTitle>
              <CardDescription>בחר את שמך מהרשימה</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSoldierId} onValueChange={setSelectedSoldierId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר חייל..." />
                </SelectTrigger>
                <SelectContent>
                  {soldiers.map((soldier) => (
                    <SelectItem key={soldier.id} value={soldier.id.toString()}>
                      {soldier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedSoldierId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>הוסף אילוץ חדש</CardTitle>
                  <CardDescription>ציין את הימים והשעות בהם אינך יכול</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>יום</Label>
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר יום..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              יום {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>סוג אילוץ</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Checkbox 
                          id="fullDay" 
                          checked={isFullDay}
                          onCheckedChange={(checked) => setIsFullDay(checked as boolean)}
                        />
                        <Label htmlFor="fullDay" className="font-normal cursor-pointer">
                          כל היום
                        </Label>
                      </div>
                    </div>
                  </div>

                  {!isFullDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>משעה</Label>
                        <Input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>עד שעה</Label>
                        <Input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>סיבה (אופציונלי)</Label>
                    <Textarea 
                      placeholder="למה אתה לא יכול?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleAddConstraint}
                    disabled={!selectedDay || isSubmitting}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    {isSubmitting ? 'מוסיף...' : 'הוסף אילוץ'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>האילוצים שלי</CardTitle>
                  <CardDescription>
                    {soldierConstraints.length === 0 
                      ? 'לא הוגשו אילוצים לשבוע זה' 
                      : `${soldierConstraints.length} אילוצים לשבוע זה`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {soldierConstraints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין אילוצים להצגה</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {soldierConstraints.map((constraint) => (
                        <div 
                          key={constraint.id}
                          className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              יום {DAYS_OF_WEEK[constraint.dayOfWeek]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {constraint.allDay 
                                ? 'כל היום' 
                                : `${constraint.startTime} - ${constraint.endTime}`}
                            </div>
                            {constraint.reason && (
                              <div className="text-sm text-muted-foreground mt-1">
                                סיבה: {constraint.reason}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveConstraint(constraint.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
