describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('muestra el formulario de login', () => {
    cy.get('[data-testid="login-email"]').should('be.visible')
    cy.get('[data-testid="login-password"]').should('be.visible')
    cy.get('[data-testid="login-submit"]').should('be.visible').and('contain', 'Iniciar Sesión')
  })

  it('login exitoso como profesor redirige al dashboard', () => {
    cy.get('[data-testid="login-email"]').type(Cypress.env('professorEmail'))
    cy.get('[data-testid="login-password"]').type(Cypress.env('professorPassword'))
    cy.get('[data-testid="login-submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('login exitoso como jefe de departamento redirige al dashboard', () => {
    cy.get('[data-testid="login-email"]').type(Cypress.env('deptHeadEmail'))
    cy.get('[data-testid="login-password"]').type(Cypress.env('deptHeadPassword'))
    cy.get('[data-testid="login-submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('muestra error con contraseña incorrecta', () => {
    cy.get('[data-testid="login-email"]').type(Cypress.env('professorEmail'))
    cy.get('[data-testid="login-password"]').type('contraseñaIncorrecta123')
    cy.get('[data-testid="login-submit"]').click()
    cy.get('[data-testid="login-error"]').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('muestra error con email no registrado', () => {
    cy.get('[data-testid="login-email"]').type('noexiste@u.icesi.edu.co')
    cy.get('[data-testid="login-password"]').type('password123')
    cy.get('[data-testid="login-submit"]').click()
    cy.get('[data-testid="login-error"]').should('be.visible')
  })

  it('no envía el form con campos vacíos', () => {
    cy.get('[data-testid="login-submit"]').click()
    cy.url().should('include', '/login')
    cy.get('[data-testid="login-error"]').should('not.exist')
  })
})
