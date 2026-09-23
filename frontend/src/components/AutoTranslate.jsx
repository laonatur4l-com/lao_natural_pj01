import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function AutoTranslate({ children }) {
  const { t, language } = useLanguage();

  if (language === 'en') return children;

  const translateTree = (node) => {
    if (node === null || node === undefined) return node;

    // Handle string nodes
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (!trimmed) return node;

      const translated = t(trimmed);
      if (translated !== trimmed) {
        const leadingSpace = node.startsWith(' ') ? ' ' : '';
        const trailingSpace = node.endsWith(' ') ? ' ' : '';
        return `${leadingSpace}${translated}${trailingSpace}`;
      }
      return node;
    }

    if (typeof node === 'number' || typeof node === 'boolean') {
      return node;
    }

    // Handle arrays
    if (Array.isArray(node)) {
      return node.map((child, index) => {
        const translated = translateTree(child);
        return React.isValidElement(translated)
          ? React.cloneElement(translated, { key: translated.key || index })
          : translated;
      });
    }

    // Handle React elements
    if (React.isValidElement(node)) {
      const { children: nodeChildren, ...props } = node.props;
      const newProps = { ...props };
      let changed = false;

      // Translate placeholder attributes if present
      if (props.placeholder && typeof props.placeholder === 'string') {
        const trPlaceholder = t(props.placeholder.trim());
        if (trPlaceholder !== props.placeholder.trim()) {
          newProps.placeholder = trPlaceholder;
          changed = true;
        }
      }

      // Translate title attributes if present
      if (props.title && typeof props.title === 'string') {
        const trTitle = t(props.title.trim());
        if (trTitle !== props.title.trim()) {
          newProps.title = trTitle;
          changed = true;
        }
      }

      if (nodeChildren !== undefined) {
        return React.cloneElement(node, newProps, translateTree(nodeChildren));
      }

      return changed ? React.cloneElement(node, newProps) : node;
    }

    return node;
  };

  return translateTree(children);
}

export default AutoTranslate;
