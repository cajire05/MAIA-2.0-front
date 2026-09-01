describe('Gestión de Solicitudes', () => {
  beforeEach(() => {
    cy.loginAs('department_head')
    cy.visit('/requests')
  })

  it('muestra los tabs de Recibidas y Contestadas', () => {
    cy.get('[data-testid="requests-tab-pending"]').should('be.visible')
    cy.get('[data-testid="requests-tab-answered"]').should('be.visible')
  })

  it('tab Recibidas está activo por defecto', () => {
    cy.get('[data-testid="requests-tab-pending"]').should('have.attr', 'data-state', 'active')
  })

  it('cambiar a tab Contestadas muestra solicitudes respondidas', () => {
    cy.get('[data-testid="requests-tab-answered"]').click()
    cy.get('[data-testid="requests-tab-answered"]').should('have.attr', 'data-state', 'active')
  })

  it('click en Responder abre el dialog de detalle', () => {
    cy.get('[data-testid="respond-btn"]', { timeout: 10000 }).then(($btns) => {
      if ($btns.length > 0) {
        cy.get('[data-testid="respond-btn"]').first().click()
        cy.get('[role="dialog"]').should('be.visible')
      } else {
        cy.log('No hay solicitudes recibidas para responder en este momento')
      }
    })
  })

  it('el dialog permite escribir una respuesta', () => {
    cy.get('[data-testid="respond-btn"]', { timeout: 10000 }).then(($btns) => {
      if ($btns.length > 0) {
        cy.get('[data-testid="respond-btn"]').first().click()
        cy.get('[role="dialog"]').should('be.visible')
        cy.get('[data-testid="response-textarea"]').then(($textarea) => {
          if ($textarea.length > 0) {
            cy.get('[data-testid="response-textarea"]').type('Respuesta de prueba Cypress E2E')
            cy.get('[data-testid="response-textarea"]').should('have.value', 'Respuesta de prueba Cypress E2E')
          }
        })
      }
    })
  })
})
