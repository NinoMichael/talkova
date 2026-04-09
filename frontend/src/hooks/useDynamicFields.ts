import { useState, useCallback } from 'react';

interface UseDynamicFieldsOptions<T extends { id: string }> {
  initialValue: T[];
}

export function useDynamicFields<T extends { id: string }>(options: UseDynamicFieldsOptions<T>) {
  const [items, setItems] = useState<T[]>(options.initialValue);

  const add = useCallback(() => {
    const newItem = { ...items[0], id: Date.now().toString() } as T;
    setItems([...items, newItem]);
  }, [items]);

  const remove = useCallback((id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  }, [items]);

  const update = useCallback((id: string, updates: Partial<T>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  }, [items]);

  const reset = useCallback(() => {
    setItems(options.initialValue);
  }, [options.initialValue]);

  return {
    items,
    setItems,
    add,
    remove,
    update,
    reset,
  };
}