describe('Crear Recurso', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/library/create')
  })

  it('muestra el formulario de creación completo', () => {
    cy.get('[data-testid="create-title"]').should('be.visible')
    cy.get('[data-testid="create-description"]').should('be.visible')
    cy.get('[data-testid="create-category"]').should('be.visible')
    cy.get('[data-testid="create-discipline"]').should('be.visible')
    cy.get('[data-testid="create-aias-level"]').should('be.visible')
    cy.get('[data-testid="create-activity-type"]').should('be.visible')
    cy.get('[data-testid="create-submit"]').should('be.visible')
  })

  it('no puede publicar con campos vacíos', () => {
    cy.get('[data-testid="create-submit"]').click()
    cy.url().should('include', '/library/create')
  })

  it('publica un recurso con todos los campos requeridos', () => {
    const timestamp = Date.now()
    cy.get('[data-testid="create-title"]').type(`Recurso de prueba Cypress ${timestamp}`)
    cy.get('[data-testid="create-description"]').type('Descripción de prueba para test E2E automatizado.')
    cy.get('[data-testid="create-category"]').type('Inteligencia Artificial')
    cy.get('[data-testid="create-discipline"]').type('Ciencias de la Computación')
    cy.get('[data-testid="create-submit"]').click()
    cy.get('.sonner-toast, [data-sonner-toast]', { timeout: 10000 }).should('be.visible')
    cy.url().should('include', '/library')
  })

  it('click en Volver navega a /my-resources', () => {
    cy.contains('button', 'Volver').click()
    cy.url().should('include', '/my-resources')
  })
})
