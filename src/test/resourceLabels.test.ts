import { describe, expect, it } from 'vitest';
import {
  getActivityTypeLabel,
  getAiasLevelLabel,
  getCategoryLabel,
  getExperienceLevelLabel,
  getResourceTypeLabel,
  getRoleLabel,
  parseAiasLevel,
} from '../utils/resourceLabels';

describe('resourceLabels', () => {
  it('traduce tipos de recurso al español', () => {
    expect(getResourceTypeLabel('best_practice')).toBe('Mejor práctica');
    expect(getResourceTypeLabel('case_study')).toBe('Caso de estudio');
    expect(getResourceTypeLabel('GUIA')).toBe('Guía');
  });

  it('traduce niveles de experiencia', () => {
    expect(getExperienceLevelLabel('beginner')).toBe('Principiante');
    expect(getExperienceLevelLabel('intermediate')).toBe('Intermedio');
    expect(getExperienceLevelLabel('advanced')).toBe('Avanzado');
  });

  it('traduce nivel AIAS', () => {
    expect(getAiasLevelLabel(3)).toBe('3: Colaboración');
    expect(getAiasLevelLabel('nivel_4')).toBe('4: Uso pleno');
    expect(parseAiasLevel('nivel_2')).toBe(2);
  });

  it('traduce actividad y categoría', () => {
    expect(getActivityTypeLabel('best_practice')).toBe('Mejor práctica');
    expect(getCategoryLabel('DOCUMENTO')).toBe('Documento');
  });

  it('traduce roles de usuario', () => {
    expect(getRoleLabel('professor')).toBe('Docente');
    expect(getRoleLabel('department_head')).toBe('Jefe de departamento');
  });
});
