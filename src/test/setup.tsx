import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@/components/ui/select', () => ({
    Select: ({ onValueChange, children, value }: { onValueChange?: (v: string) => void; children?: ReactNode; value?: string }) => (
        <div data-testid="mock-select" data-value={value}>
            {children}
            <button type="button" data-testid="select-beginner" onClick={() => onValueChange?.('beginner')}>beginner</button>
            <button type="button" data-testid="select-intermediate" onClick={() => onValueChange?.('intermediate')}>intermediate</button>
            <button type="button" data-testid="select-advanced" onClick={() => onValueChange?.('advanced')}>advanced</button>
            <button type="button" data-testid="select-alta" onClick={() => onValueChange?.('ALTA')}>ALTA</button>
            <button type="button" data-testid="select-media" onClick={() => onValueChange?.('MEDIA')}>MEDIA</button>
            <button type="button" data-testid="select-guide" onClick={() => onValueChange?.('guide')}>guide</button>
            <button type="button" data-testid="select-all" onClick={() => onValueChange?.('all')}>all</button>
            <button type="button" data-testid="select-dept-1" onClick={() => onValueChange?.('dept-1')}>dept-1</button>
            <button type="button" data-testid="select-week" onClick={() => onValueChange?.('week')}>week</button>
            <button type="button" data-testid="select-month" onClick={() => onValueChange?.('month')}>month</button>
            <button type="button" data-testid="select-list-1" onClick={() => onValueChange?.('list-1')}>list-1</button>
            <button type="button" data-testid="select-aias-2" onClick={() => onValueChange?.('2')}>aias-2</button>
            <button type="button" data-testid="select-all-level" onClick={() => onValueChange?.('all')}>all-level</button>
        </div>
    ),
    SelectTrigger: ({ children, id }: { children?: ReactNode; id?: string }) => <div id={id}>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder ?? ''}</span>,
    SelectContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

window.HTMLElement.prototype.scrollIntoView = function () {};

afterEach(() => {
    cleanup();
});
