declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: 'professor' | 'department_head'): Chainable<void>
      loginViaUI(email: string, password: string): Chainable<void>
    }
  }
}

// Login programático vía API — para usar en beforeEach de tests que no prueban auth
Cypress.Commands.add('loginAs', (role: 'professor' | 'department_head') => {
  const email =
    role === 'professor'
      ? Cypress.env('professorEmail')
      : Cypress.env('deptHeadEmail')
  const password =
    role === 'professor'
      ? Cypress.env('professorPassword')
      : Cypress.env('deptHeadPassword')

  cy.request('POST', '/api/auth/login', { email, password }).then((resp) => {
    window.localStorage.setItem('authToken', resp.body.token)
  })
})

// Login a través de la UI — para tests de autenticación
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="login-email"]').type(email)
  cy.get('[data-testid="login-password"]').type(password)
  cy.get('[data-testid="login-submit"]').click()
})

export {}
