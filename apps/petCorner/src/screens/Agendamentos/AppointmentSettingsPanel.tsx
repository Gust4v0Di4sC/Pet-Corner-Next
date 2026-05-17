import type { AppointmentSettings } from "../../types/appointment";
import { WEEKDAY_LABELS } from "./agendamentos.utils";

type AppointmentSettingsPanelProps = {
  settings: AppointmentSettings;
  isSavingSettings: boolean;
  onSettingsChange: (settings: AppointmentSettings) => void;
  onWeekdayChange: (
    weekday: string,
    field: "enabled" | "startTime" | "endTime",
    value: boolean | string
  ) => void;
  onSaveSettings: () => void;
};

export function AppointmentSettingsPanel({
  settings,
  isSavingSettings,
  onSettingsChange,
  onWeekdayChange,
  onSaveSettings,
}: AppointmentSettingsPanelProps) {
  return (
    <article className="appointments__panel appointments__settings">
      <header className="appointments__panel-header">
        <h3>Disponibilidade semanal</h3>
        <small>{settings.timezone}</small>
      </header>

      <div className="appointments__settings-grid">
        <label>
          <span>Intervalo (min)</span>
          <input
            type="number"
            min={5}
            value={settings.slotIntervalMinutes}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                slotIntervalMinutes: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span>Antecedencia minima (h)</span>
          <input
            type="number"
            min={0}
            value={settings.minAdvanceHours}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                minAdvanceHours: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span>Dias futuros</span>
          <input
            type="number"
            min={1}
            value={settings.maxDaysAhead}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                maxDaysAhead: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      <div className="appointments__weekday-list">
        {Object.entries(WEEKDAY_LABELS).map(([weekday, label]) => {
          const day = settings.weeklyAvailability[weekday];
          return (
            <div key={weekday} className="appointments__weekday">
              <label className="appointments__weekday-toggle">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(event) =>
                    onWeekdayChange(weekday, "enabled", event.target.checked)
                  }
                />
                <span>{label}</span>
              </label>
              <input
                type="time"
                value={day.startTime}
                onChange={(event) =>
                  onWeekdayChange(weekday, "startTime", event.target.value)
                }
                disabled={!day.enabled}
              />
              <input
                type="time"
                value={day.endTime}
                onChange={(event) => onWeekdayChange(weekday, "endTime", event.target.value)}
                disabled={!day.enabled}
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="appointments__save"
        onClick={onSaveSettings}
        disabled={isSavingSettings}
      >
        {isSavingSettings ? "Salvando..." : "Salvar configuracao"}
      </button>
    </article>
  );
}
