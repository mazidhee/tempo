import { usePrivacy } from '../../hooks/PrivacyContext';
import { Link } from 'react-router-dom';
import { CalendarCheck, Target, BookOpen } from 'lucide-react';
import { localDate } from '../../../shared/productivity';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Empty } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { useReflection } from './useReflection';
import { LoadState } from './ui';
export function TodayPlanWidget() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection();
  if (!snapshot) return <LoadState />;
  const plan = snapshot.plans.find((p) => p.date === localDate());
  return (
    <Card className="reflection-widget">
      <CardHeader>
        <CardTitle>Today’s plan</CardTitle>
      </CardHeader>
      <CardContent>
        {plan?.priorities.length ? (
          <ul className="reflection-list">
            {plan.priorities.map((p) => (
              <li className="reflection-row" key={p.id}>
                <span className="reflection-grow">
                  {privacy && p.kind === 'habit' ? 'Private habit' : p.title}
                </span>
                <Badge variant="secondary">{p.done ? 'Done' : 'Planned'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            icon={<CalendarCheck />}
            title="Choose your priorities"
            description="Make a little room for what matters today."
          />
        )}
        <Link className="reflection-widget-link" to="/plan">
          Open daily plan
        </Link>
      </CardContent>
    </Card>
  );
}
export function GoalsWidget() {
  const privacy = usePrivacy();
  const { snapshot } = useReflection();
  if (!snapshot) return <LoadState />;
  return (
    <Card className="reflection-widget">
      <CardHeader>
        <CardTitle>Goals</CardTitle>
      </CardHeader>
      <CardContent>
        {snapshot.goalProgress.length ? (
          <ul className="reflection-list">
            {snapshot.goalProgress.slice(0, 3).map((p) => (
              <li className="reflection-row" key={p.goal.id}>
                <div className="reflection-grow">
                  <h3>
                    {privacy && p.goal.kind === 'habit' ? 'Private habit goal' : p.goal.title}
                  </h3>
                  <p className="reflection-caption">
                    {Math.round(p.percent)}% ·{' '}
                    {p.status === 'on-track'
                      ? 'On track'
                      : p.status === 'behind'
                        ? 'Behind'
                        : 'Complete'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            icon={<Target />}
            title="Set a direction"
            description="Link a goal to your existing activity."
          />
        )}
        <Link className="reflection-widget-link" to="/goals">
          View goals
        </Link>
      </CardContent>
    </Card>
  );
}
export function ReviewsDueWidget() {
  const { snapshot } = useReflection();
  if (!snapshot) return <LoadState />;
  const today = localDate(),
    due = snapshot.source.study.topics.filter(
      (t) =>
        !t.archived &&
        t.learnedAt &&
        t.reviewDue &&
        t.reviewDue <= today &&
        snapshot.source.study.curricula.some((c) => c.id === t.curriculumId && !c.archived),
    );
  return (
    <Card className="reflection-widget">
      <CardHeader>
        <CardTitle>Reviews due</CardTitle>
      </CardHeader>
      <CardContent>
        {due.length ? (
          <>
            <p>
              {due.length} study {due.length === 1 ? 'topic is' : 'topics are'} ready to revisit.
            </p>
            <ul className="reflection-list">
              {due.slice(0, 3).map((t) => (
                <li className="reflection-row" key={t.id}>
                  {t.title}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Empty
            icon={<BookOpen />}
            title="Nothing due today"
            description="Learn a topic in Study to begin your review rhythm."
          />
        )}
        <div className="reflection-actions">
          <Link className="reflection-widget-link" to="/study">
            Open study reviews
          </Link>
          {snapshot.reviews.length > 0 && (
            <Link className="reflection-widget-link" to="/review">
              Latest weekly review
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
