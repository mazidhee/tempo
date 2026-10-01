import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { defaultReflectionSettings } from '../../../shared/reflection';
import { useReflection } from './useReflection';
import { ActionError, Field, LoadState, Panel, Select, useAction } from './ui';
export function ReflectionNotifications() {
  const { snapshot } = useReflection(),
    action = useAction(),
    [settings, setSettings] = useState(defaultReflectionSettings);
  useEffect(() => {
    if (snapshot) setSettings(snapshot.settings);
  }, [JSON.stringify(snapshot?.settings)]);
  if (!snapshot) return <LoadState />;
  return (
    <Panel
      title="Reflection reminders"
      description="Choose when Tempo should invite you to plan or reflect. Native reminders are off until you enable them."
    >
      <div className="reflection-stack">
        <ActionError error={action.error} />
        {(['morning', 'evening', 'weekly'] as const).map((kind) => (
          <div className="reflection-row" key={kind}>
            <label className="reflection-grow" htmlFor={`reminder-${kind}`}>
              {kind === 'morning'
                ? 'Morning plan'
                : kind === 'evening'
                  ? 'Evening reflection'
                  : 'Weekly review'}
            </label>
            <Switch
              id={`reminder-${kind}`}
              checked={settings[kind].enabled}
              onCheckedChange={(enabled) =>
                setSettings({ ...settings, [kind]: { ...settings[kind], enabled } })
              }
            />
            <Input
              aria-label={`${kind} reminder time`}
              type="time"
              value={settings[kind].time}
              onChange={(e) =>
                setSettings({ ...settings, [kind]: { ...settings[kind], time: e.target.value } })
              }
            />
          </div>
        ))}
        <Field label="Weekly reminder day">
          <Select
            value={settings.weekly.day}
            onChange={(e) =>
              setSettings({
                ...settings,
                weekly: { ...settings.weekly, day: Number(e.target.value) },
              })
            }
          >
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
              (label, day) => (
                <option key={label} value={day}>
                  {label}
                </option>
              ),
            )}
          </Select>
        </Field>
        <p className="reflection-caption">
          Weekly summaries are saved automatically after Sunday evening. Reminders run while Tempo
          is open, including in the tray; missed reminders are not replayed.
        </p>
        <Button
          disabled={action.busy}
          onClick={() =>
            void action.run(
              () => window.workspaceAPI.invoke('plan:saveSettings', settings),
              'Reminder settings saved',
            )
          }
        >
          Save reminder settings
        </Button>
      </div>
    </Panel>
  );
}
