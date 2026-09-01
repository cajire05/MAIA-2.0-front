describe('Analítica', () => {
  beforeEach(() => {
    cy.loginAs('department_head')
    cy.visit('/analytics')
  })

  it('muestra la página de analítica con el selector de período', () => {
    cy.contains('h1', 'Analítica').should('be.visible')
    cy.get('[data-testid="analytics-period-select"]').should('be.visible')
  })

  it('carga y muestra datos por defecto (mes)', () => {
    cy.get('[data-testid="analytics-period-select"]').should('be.visible')
    cy.contains('Última Semana, Último Mes, Último Trimestre, Último Año').should('not.exist')
  })

  it('cambiar período a Última Semana actualiza los datos', () => {
    cy.get('[data-testid="analytics-period-select"]').click()
    cy.get('[role="option"]').contains('Última Semana').click()
    cy.get('[data-testid="analytics-period-select"]').should('be.visible')
    cy.contains('h1', 'Analítica').should('be.visible')
  })

  it('cambiar período a Último Trimestre actualiza los datos', () => {
    cy.get('[data-testid="analytics-period-select"]').click()
    cy.get('[role="option"]').contains('Último Trimestre').click()
    cy.get('[data-testid="analytics-period-select"]').should('be.visible')
    cy.contains('h1', 'Analítica').should('be.visible')
  })

  it('cambiar período a Último Año actualiza los datos', () => {
    cy.get('[data-testid="analytics-period-select"]').click()
    cy.get('[role="option"]').contains('Último Año').click()
    cy.get('[data-testid="analytics-period-select"]').should('be.visible')
    cy.contains('h1', 'Analítica').should('be.visible')
  })

  it('muestra tarjetas de estadísticas', () => {
    cy.contains('Solicitudes de Apoyo', { timeout: 10000 }).should('exist')
  })
})
