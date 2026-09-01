describe('Dashboard Jefe de Departamento', () => {
  beforeEach(() => {
    cy.loginAs('department_head')
    cy.visit('/dashboard')
  })

  it('muestra las métricas del departamento', () => {
    cy.get('[data-testid="dept-dashboard-stats"]', { timeout: 10000 }).should('be.visible')
  })

  it('muestra la navegación de jefe de departamento', () => {
    cy.get('[data-testid="nav-requests"]').should('be.visible')
    cy.get('[data-testid="nav-analytics"]').should('be.visible')
    cy.get('[data-testid="nav-library"]').should('be.visible')
  })

  it('click en Solicitudes navega a /requests', () => {
    cy.get('[data-testid="nav-requests"]').click()
    cy.url().should('include', '/requests')
  })

  it('click en Analítica navega a /analytics', () => {
    cy.get('[data-testid="nav-analytics"]').click()
    cy.url().should('include', '/analytics')
  })
})
