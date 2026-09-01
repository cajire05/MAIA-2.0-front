describe('Rutas protegidas', () => {
  it('redirige a /login si no hay token', () => {
    cy.clearLocalStorage()
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('redirige a /login al acceder a /requests sin token', () => {
    cy.clearLocalStorage()
    cy.visit('/requests')
    cy.url().should('include', '/login')
  })

  it('redirige a /login al acceder a /analytics sin token', () => {
    cy.clearLocalStorage()
    cy.visit('/analytics')
    cy.url().should('include', '/login')
  })

  it('redirige a /login al acceder a /library sin token', () => {
    cy.clearLocalStorage()
    cy.visit('/library')
    cy.url().should('include', '/login')
  })

  it('profesor autenticado accede a /dashboard', () => {
    cy.loginAs('professor')
    cy.visit('/dashboard')
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="nav-dashboard"]').should('be.visible')
  })

  it('cierre de sesión limpia el token y redirige a /login', () => {
    cy.loginAs('professor')
    cy.visit('/dashboard')
    cy.get('[data-testid="logout-button"]').click()
    cy.url().should('include', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.be.null
    })
  })
})
