import { useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useReflection, refreshReflection } from './useReflection';
import { toast } from 'sonner';
import './reflection.css';
export function ReflectionNav() {
  return (
    <nav aria-label="Reflection navigation" className="reflection-nav">
      {[
        ['/plan', 'Daily plan'],
        ['/journal', 'Journal'],
        ['/review', 'Weekly review'],
        ['/goals', 'Goals'],
      ].map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'selected' : '')}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="reflection-heading">{title}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`reflection-select ${props.className || ''}`} />;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="reflection-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function LoadState() {
  const { error, retry } = useReflection();
  return error ? (
    <div role="alert" className="reflection-status">
      <p>{error}</p>
      <Button variant="secondary" onClick={() => void retry()}>
        Try again
      </Button>
    </div>
  ) : (
    <div role="status" aria-label="Loading reflection">
      <Skeleton className="h-10 w-full" />
      <p className="muted">Loading your workspace…</p>
    </div>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const run = async (operation: () => Promise<unknown>, message = 'Saved') => {
    setBusy(true);
    setError('');
    try {
      await operation();
      await refreshReflection();
      toast.success(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}
export function ActionError({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="reflection-error">
      {error}
    </p>
  ) : null;
}
