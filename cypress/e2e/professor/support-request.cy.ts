describe('Solicitar Apoyo', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/support')
  })

  it('muestra el formulario de solicitud', () => {
    cy.get('[data-testid="support-title"]').should('be.visible')
    cy.get('[data-testid="support-description"]').should('be.visible')
    cy.get('[data-testid="support-priority"]').should('be.visible')
    cy.get('[data-testid="support-email"]').should('be.visible')
    cy.get('[data-testid="support-phone"]').should('be.visible')
    cy.get('[data-testid="support-submit"]').should('be.visible')
  })

  it('el botón Enviar está deshabilitado cuando los campos están vacíos', () => {
    cy.get('[data-testid="support-title"]').clear()
    cy.get('[data-testid="support-submit"]').should('be.disabled')
  })

  it('envía una solicitud de apoyo correctamente', () => {
    const timestamp = Date.now()
    cy.get('[data-testid="support-title"]').type(`Solicitud de prueba ${timestamp}`)
    cy.get('[data-testid="support-description"]').type('Descripción detallada de la solicitud de prueba E2E.')
    cy.get('[data-testid="support-phone"]').type('+57 300 000 0000')
    cy.get('[data-testid="support-email"]').clear().type('test@u.icesi.edu.co')
    cy.get('[data-testid="support-submit"]').click()
    cy.get('.sonner-toast, [data-sonner-toast]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="my-request-item"]', { timeout: 8000 }).should('have.length.greaterThan', 0)
  })

  it('muestra las solicitudes anteriores del usuario', () => {
    cy.contains('Tus Solicitudes Anteriores').should('be.visible')
  })

  it('click en Ver Detalles abre el dialog de detalle', () => {
    cy.get('[data-testid="my-request-item"]').should('have.length.greaterThan', 0)
    cy.get('[data-testid="my-request-item"]').first().within(() => {
      cy.contains('button', 'Ver Detalles').click()
    })
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Detalles de la Solicitud').should('be.visible')
  })
})
