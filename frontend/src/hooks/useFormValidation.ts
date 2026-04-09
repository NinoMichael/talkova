import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  email?: boolean;
  match?: string;
}

type ValidationRulesMap = {
  [key: string]: ValidationRules;
};

export function useFormValidation<T extends Record<string, string>>(initialValues: T, rules: ValidationRulesMap) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback((fieldName: keyof T, value: string): string | null => {
    const rule = rules[fieldName as string];
    if (!rule) return null;

    if (rule.required && !value.trim()) {
      return 'Ce champ est requis';
    }

    if (rule.minLength && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} caractères`;
    }

    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Email invalide';
      }
    }

    if (rule.match && value !== values[rule.match as keyof T]) {
      return 'Les mots de passe ne correspondent pas';
    }

    return null;
  }, [rules, values]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    const error = validate(name as keyof T, value);
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
  }, [validate]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(rules).forEach(key => {
      const value = values[key as keyof T];
      const error = validate(key as keyof T, value);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    handleChange,
    validateAll,
    reset,
    setValues,
  };
}