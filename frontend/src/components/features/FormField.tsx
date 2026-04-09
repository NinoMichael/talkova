import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  onAdd?: () => void;
  canAdd?: boolean;
  children: ReactNode;
}

export function FormField({ label, onAdd, canAdd = true, children }: FormFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-[var(--color-primary-dark)]">
          {label}
        </label>
        {onAdd && canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="text-sm text-[var(--color-primary)] hover:underline font-medium"
          >
            + Ajouter
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface DynamicFieldProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onChange: (item: T) => void, onRemove: () => void) => ReactNode;
  removeItem: (id: string) => void;
  minItems?: number;
}

export function DynamicField<T extends { id: string }>({ 
  items, 
  onChange, 
  renderItem, 
  removeItem,
  minItems = 1 
}: DynamicFieldProps<T>) {
  const handleChange = (index: number, item: T) => {
    const newItems = [...items];
    newItems[index] = item;
    onChange(newItems);
  };

  const handleRemove = (id: string) => {
    if (items.length > minItems) {
      removeItem(id);
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id}>
          {renderItem(
            item,
            (updatedItem) => handleChange(index, updatedItem),
            () => handleRemove(item.id)
          )}
        </div>
      ))}
    </div>
  );
}