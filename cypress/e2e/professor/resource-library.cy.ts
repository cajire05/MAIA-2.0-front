describe('Biblioteca de Recursos', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/library')
  })

  it('muestra el campo de búsqueda y los filtros', () => {
    cy.get('[data-testid="library-search"]').should('be.visible')
    cy.get('[data-testid="filter-level"]').should('be.visible')
    cy.get('[data-testid="filter-aias"]').should('be.visible')
    cy.get('[data-testid="filter-type"]').should('be.visible')
  })

  it('carga y muestra las tarjetas de recursos', () => {
    cy.get('[data-testid="resource-card"]', { timeout: 10000 }).should('have.length.greaterThan', 0)
  })

  it('búsqueda por texto filtra los resultados', () => {
    cy.get('[data-testid="resource-card"]', { timeout: 10000 }).then((cards) => {
      const totalCards = cards.length
      cy.get('[data-testid="library-search"]').type('IA')
      cy.wait(500)
      cy.get('[data-testid="resource-card"]').its('length').should('be.lte', totalCards)
    })
  })

  it('filtrar por nivel de experiencia actualiza la lista', () => {
    cy.get('[data-testid="filter-level"]').click()
    cy.get('[role="option"]').contains('Principiante').click()
    cy.get('[data-testid="resource-card"]', { timeout: 10000 }).should('exist')
  })

  it('filtrar por tipo de actividad actualiza la lista', () => {
    cy.get('[data-testid="filter-type"]').click()
    cy.get('[role="option"]').contains('Guías').click()
    cy.get('[data-testid="resource-card"]', { timeout: 10000 }).should('exist')
  })

  it('click en favorito alterna el estado de favorito', () => {
    cy.get('[data-testid="resource-card"]', { timeout: 10000 }).first().within(() => {
      cy.get('[data-testid="resource-favorite-btn"]').click()
    })
    cy.get('.sonner-toast, [data-sonner-toast]', { timeout: 5000 }).should('be.visible')
  })

  it('botón Limpiar filtros restaura la vista completa', () => {
    cy.get('[data-testid="library-search"]').type('xyz')
    cy.contains('button', 'Limpiar filtros').click()
    cy.get('[data-testid="library-search"]').should('have.value', '')
  })
})
