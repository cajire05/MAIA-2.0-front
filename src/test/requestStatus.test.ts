import { describe, it, expect } from 'vitest';
import {
  getRequestStatusLabel,
  getRequestStatusStyles,
  isRequestAnswered,
} from '../utils/requestStatus';

describe('requestStatus utils', () => {
  it('maps RECIBIDA to Pendiente', () => {
    expect(getRequestStatusLabel('RECIBIDA')).toBe('Pendiente');
    expect(getRequestStatusStyles('RECIBIDA')).toContain('status-pendiente');
  });

  it('maps CONTESTADA and legacy statuses to Contestado verde', () => {
    expect(getRequestStatusLabel('CONTESTADA')).toBe('Contestado');
    expect(getRequestStatusStyles('CONTESTADA')).toContain('status-contestado');

    expect(getRequestStatusLabel('EN_PROCESO')).toBe('Contestado');
    expect(getRequestStatusLabel('RESUELTA')).toBe('Contestado');
    expect(getRequestStatusStyles('RESUELTA')).toContain('status-contestado');
  });

  it('isRequestAnswered returns false only for RECIBIDA', () => {
    expect(isRequestAnswered('RECIBIDA')).toBe(false);
    expect(isRequestAnswered('CONTESTADA')).toBe(true);
    expect(isRequestAnswered('EN_PROCESO')).toBe(true);
  });

  it('handles unknown status with defaults', () => {
    expect(getRequestStatusLabel('CUSTOM')).toBe('CUSTOM');
    expect(getRequestStatusStyles('CUSTOM')).toBe('status-badge');
  });

  it('getRequestStatusStyles aplica contestado a EN_PROCESO', () => {
    expect(getRequestStatusStyles('EN_PROCESO')).toContain('status-contestado');
  });

  it('isRequestAnswered trata estados distintos de RECIBIDA como respondidos', () => {
    expect(isRequestAnswered('RESUELTA')).toBe(true);
    expect(isRequestAnswered('OTRO')).toBe(true);
  });
});
