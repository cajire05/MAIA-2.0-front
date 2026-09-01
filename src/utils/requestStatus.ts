/** Clases CSS fijas en styles/request-status.css (el build no incluye yellow-*). */
export function getRequestStatusStyles(status: string): string {
  switch (status) {
    case 'CONTESTADA':
    case 'RESUELTA':
    case 'EN_PROCESO':
      return 'status-badge status-contestado';
    case 'RECIBIDA':
      return 'status-badge status-pendiente';
    default:
      return 'status-badge';
  }
}

export function getRequestStatusLabel(status: string): string {
  switch (status) {
    case 'CONTESTADA':
    case 'RESUELTA':
    case 'EN_PROCESO':
      return 'Contestado';
    case 'RECIBIDA':
      return 'Pendiente';
    default:
      return status;
  }
}

export function isRequestAnswered(status: string): boolean {
  return status !== 'RECIBIDA';
}
