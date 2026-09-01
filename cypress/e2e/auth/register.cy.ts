describe('Registro', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('muestra el formulario de registro', () => {
    cy.get('[data-testid="register-name"]').should('be.visible')
    cy.get('[data-testid="register-email"]').should('be.visible')
    cy.get('[data-testid="register-password"]').should('be.visible')
    cy.get('[data-testid="register-confirm-password"]').should('be.visible')
    cy.get('[data-testid="register-submit"]').should('be.visible')
  })

  it('carga y muestra el selector de departamentos', () => {
    cy.get('[data-testid="register-department-trigger"]').should('be.visible')
    cy.get('[data-testid="register-department-trigger"]').click()
    cy.get('[role="option"]').should('have.length.greaterThan', 0)
    cy.get('body').type('{escape}')
  })

  it('muestra error cuando las contraseñas no coinciden', () => {
    cy.get('[data-testid="register-name"]').type('Test Usuario')
    cy.get('[data-testid="register-email"]').type('test@u.icesi.edu.co')
    cy.get('[data-testid="register-password"]').type('password123')
    cy.get('[data-testid="register-confirm-password"]').type('password999')
    cy.get('[data-testid="register-submit"]').click()
    cy.get('[data-testid="register-error"]').should('be.visible')
      .and('contain', 'contraseñas')
  })

  it('muestra error cuando la contraseña es muy corta', () => {
    cy.get('[data-testid="register-name"]').type('Test Usuario')
    cy.get('[data-testid="register-email"]').type('test@u.icesi.edu.co')
    cy.get('[data-testid="register-password"]').type('abc')
    cy.get('[data-testid="register-confirm-password"]').type('abc')
    cy.get('[data-testid="register-submit"]').click()
    cy.get('[data-testid="register-error"]').should('be.visible')
  })
})
