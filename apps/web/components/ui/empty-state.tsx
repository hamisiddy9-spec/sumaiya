import { Icon, IconName } from "@/components/ui/icon";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = "folder", title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sand dark:bg-espresso_line mb-6">
        <Icon name={icon} size={32} className="text-text-muted dark:text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-espresso dark:text-cream mb-2">{title}</h3>
      <p className="text-sm text-text-body dark:text-text-muted max-w-xs mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold py-2 px-6 rounded-lg transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
