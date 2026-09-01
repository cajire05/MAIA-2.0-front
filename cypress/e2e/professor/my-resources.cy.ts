describe('Mis Recursos', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/my-resources')
  })

  it('muestra la página de Mis Recursos', () => {
    cy.contains('h1', 'Mis Recursos').should('be.visible')
    cy.contains('button', 'Crear recurso').should('be.visible')
  })

  it('click en "Crear recurso" navega a /library/create', () => {
    cy.contains('button', 'Crear recurso').click()
    cy.url().should('include', '/library/create')
  })

  it('muestra los recursos del usuario si existen', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="my-resource-card"]').length > 0) {
        cy.get('[data-testid="my-resource-card"]').should('have.length.greaterThan', 0)
      } else {
        cy.contains('Aún no has creado ningún recurso').should('be.visible')
      }
    })
  })

  it('click en eliminar abre el dialog de confirmación', () => {
    cy.get('[data-testid="my-resource-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-testid="resource-delete-btn"]').first().click()
    cy.get('[role="alertdialog"]').should('be.visible')
    cy.contains('¿Eliminar este recurso?').should('be.visible')
  })

  it('cancelar en el dialog cierra sin eliminar', () => {
    cy.get('[data-testid="my-resource-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-testid="resource-delete-btn"]').first().click()
    cy.get('[role="alertdialog"]').should('be.visible')
    cy.contains('button', 'Cancelar').click()
    cy.get('[role="alertdialog"]').should('not.exist')
    cy.get('[data-testid="my-resource-card"]').should('have.length.greaterThan', 0)
  })
})
