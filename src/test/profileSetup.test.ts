import { describe, it, expect } from 'vitest';
import {
  EXPERIENCE_LEVEL_TO_BACKEND,
  getExperienceLevelLabel,
  mapBackendExperienceLevel,
  isProfileSetupComplete,
} from '../utils/profileSetup';
import type { User } from '../contexts/AuthContext';

describe('profileSetup utils', () => {
  it('EXPERIENCE_LEVEL_TO_BACKEND maps frontend keys', () => {
    expect(EXPERIENCE_LEVEL_TO_BACKEND.beginner).toBe('Principiante');
    expect(EXPERIENCE_LEVEL_TO_BACKEND.intermediate).toBe('Intermedio');
    expect(EXPERIENCE_LEVEL_TO_BACKEND.advanced).toBe('Avanzado');
  });

  it('getExperienceLevelLabel returns Spanish labels', () => {
    expect(getExperienceLevelLabel('beginner')).toBe('Principiante');
    expect(getExperienceLevelLabel('intermediate')).toBe('Intermedio');
    expect(getExperienceLevelLabel('advanced')).toBe('Avanzado');
    expect(getExperienceLevelLabel('Principiante')).toBe('Principiante');
  });

  it('mapBackendExperienceLevel handles Spanish and English labels', () => {
    expect(mapBackendExperienceLevel('Principiante')).toBe('beginner');
    expect(mapBackendExperienceLevel('intermedio')).toBe('intermediate');
    expect(mapBackendExperienceLevel('ADVANCED')).toBe('advanced');
    expect(mapBackendExperienceLevel('  ')).toBeUndefined();
    expect(mapBackendExperienceLevel(null)).toBeUndefined();
  });

  it('isProfileSetupComplete for department head only needs department', () => {
    const head: User = {
      id: '1',
      idNumber: 'h@maia.com',
      name: 'Jefe',
      email: 'h@maia.com',
      role: 'department_head',
      department: 'Ing',
    };
    expect(isProfileSetupComplete(head)).toBe(true);
  });

  it('isProfileSetupComplete for professor needs area and level', () => {
    const incomplete: User = {
      id: '2',
      idNumber: 'p@maia.com',
      name: 'Prof',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
    };
    expect(isProfileSetupComplete(incomplete)).toBe(false);

    const complete: User = {
      ...incomplete,
      academicArea: 'Matemáticas',
      experienceLevel: 'beginner',
    };
    expect(isProfileSetupComplete(complete)).toBe(true);
    expect(isProfileSetupComplete(null)).toBe(false);
  });

  it('getExperienceLevelLabel devuelve cadena vacía sin nivel', () => {
    expect(getExperienceLevelLabel(null)).toBe('');
    expect(getExperienceLevelLabel('   ')).toBe('');
  });

  it('getExperienceLevelLabel conserva etiquetas personalizadas desconocidas', () => {
    expect(getExperienceLevelLabel('Experto')).toBe('Experto');
  });

  it('isProfileSetupComplete exige departamento para jefe de departamento', () => {
    const head: User = {
      id: '1',
      idNumber: 'h@maia.com',
      name: 'Jefe',
      email: 'h@maia.com',
      role: 'department_head',
      department: '   ',
    };
    expect(isProfileSetupComplete(head)).toBe(false);
  });

  it('isProfileSetupComplete rechaza área académica solo con espacios', () => {
    const prof: User = {
      id: '2',
      idNumber: 'p@maia.com',
      name: 'Prof',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
      academicArea: '   ',
      experienceLevel: 'beginner',
    };
    expect(isProfileSetupComplete(prof)).toBe(false);
  });
});
