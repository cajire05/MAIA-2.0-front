describe('Dashboard Profesor', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/dashboard')
  })

  it('muestra el saludo con el nombre del usuario', () => {
    cy.get('[data-testid="dashboard-greeting"]').should('be.visible')
    cy.get('[data-testid="dashboard-greeting"] h1').should('contain', 'Bienvenido')
  })

  it('muestra la sección de recursos recientes', () => {
    cy.get('[data-testid="recent-resources-section"]').should('be.visible')
  })

  it('muestra la sección de solicitudes de apoyo', () => {
    cy.get('[data-testid="my-requests-section"]').should('be.visible')
  })

  it('la navegación lateral muestra los ítems de profesor', () => {
    cy.get('[data-testid="nav-library"]').should('be.visible')
    cy.get('[data-testid="nav-collections"]').should('be.visible')
    cy.get('[data-testid="nav-my-resources"]').should('be.visible')
    cy.get('[data-testid="nav-support"]').should('be.visible')
    cy.get('[data-testid="nav-surveys"]').should('be.visible')
  })

  it('click en "Explorar Biblioteca" navega a /library', () => {
    cy.contains('button', 'Explorar Biblioteca').click()
    cy.url().should('include', '/library')
  })

  it('click en "Solicitar Apoyo" navega a /support', () => {
    cy.contains('button', 'Solicitar Apoyo').click()
    cy.url().should('include', '/support')
  })
})
