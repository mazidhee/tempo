import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { focusRequest, type Task } from '../../shared/productivity';
import { taskFocusLink } from '../../shared/taskLifecycle';
import { useProductivity } from './ProductivityProvider';

export function useTaskFocus() {
  const { state } = useProductivity();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const start = async (task: Task) => {
    if (pending.current) return;
    const link = taskFocusLink(task),
      request = focusRequest(state.timer, link);
    if (request === 'resume') {
      navigate('/focus');
      return;
    }
    if (
      request === 'confirm' &&
      !window.confirm(
        state.timer.stopwatch
          ? 'Save the current tracked time and switch to this task?'
          : 'Replace the current focus session? Unfinished time will not be logged.',
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (state.timer.startedAt !== null)
        await window.workspaceAPI.invoke('focus:command', { action: 'stop' });
      await window.workspaceAPI.invoke('focus:command', {
        action: 'configure',
        phase: 'focus',
        timerMode: 'pomodoro',
        link,
      });
      await window.workspaceAPI.invoke('focus:command', { action: 'start' });
      navigate('/focus');
    } catch (reason) {
      setError('Could not start focus. ' + (reason as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return { start, busy, error };
}
