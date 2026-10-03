import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductivity } from './ProductivityProvider';
import { focusRequest } from '../../shared/productivity';
import type { Curriculum, StudyTopic } from '../../shared/study';
/** Home and Study use the main-process timer and preserve an existing run. */
export function useStudyFocus() {
  const { state } = useProductivity();
  const navigate = useNavigate();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const start = async (curriculum: Curriculum, topic?: StudyTopic, tracking = false) => {
    if (inFlight.current) return;
    const link = {
      type: 'study' as const,
      id: topic?.id ?? curriculum.id,
      name: topic?.title ?? curriculum.title,
      curriculumId: curriculum.id,
    };
    const action = focusRequest(state.timer, link);
    if (action === 'resume') {
      navigate('/focus');
      return;
    }
    if (
      action === 'confirm' &&
      !window.confirm(
        state.timer.stopwatch
          ? 'Save the current tracked time and switch to this topic?'
          : 'Replace the current focus session? Unfinished time will not be logged.',
      )
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (state.timer.startedAt !== null)
        await window.workspaceAPI.invoke('focus:command', { action: 'stop' });
      await window.workspaceAPI.invoke('focus:command', {
        action: 'configure',
        phase: 'focus',
        timerMode: tracking ? 'stopwatch' : 'pomodoro',
        link,
      });
      await window.workspaceAPI.invoke('focus:command', { action: 'start' });
      navigate('/focus');
    } catch (reason) {
      setError(String(reason));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return { start, busy, error };
}
