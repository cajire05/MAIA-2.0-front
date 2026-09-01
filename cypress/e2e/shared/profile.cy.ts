describe('Perfil - Profesor', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/profile')
  })

  it('muestra la información de perfil del usuario', () => {
    cy.get('[data-testid="profile-name"]').should('be.visible')
    cy.get('[data-testid="profile-email"]').should('be.visible')
    cy.get('[data-testid="profile-department"]').should('be.visible')
  })

  it('click en Editar navega a /edit-profile', () => {
    cy.get('[data-testid="edit-profile-link"]').click()
    cy.url().should('include', '/edit-profile')
  })

  it('muestra el botón Cambiar Contraseña', () => {
    cy.get('[data-testid="change-password-btn"]').should('be.visible')
  })

  it('click en Cambiar Contraseña abre el dialog', () => {
    cy.get('[data-testid="change-password-btn"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Cambiar Contraseña').should('be.visible')
  })

  it('error al cambiar contraseña con contraseña actual incorrecta', () => {
    cy.get('[data-testid="change-password-btn"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').within(() => {
      cy.get('input').first().type('contraseñaIncorrecta123')
      cy.get('input').eq(1).type('nuevaContraseña456')
      cy.get('input').eq(2).type('nuevaContraseña456')
      cy.contains('button', 'Cambiar Contraseña').click()
    })
    cy.get('.sonner-toast, [data-sonner-toast]', { timeout: 5000 }).should('be.visible')
  })
})

describe('Editar Perfil - Profesor', () => {
  beforeEach(() => {
    cy.loginAs('professor')
    cy.visit('/edit-profile')
  })

  it('muestra el formulario de edición con datos actuales', () => {
    cy.get('[data-testid="edit-name"]').should('be.visible').and('not.have.value', '')
    cy.get('[data-testid="edit-experience-level"]').should('be.visible')
    cy.get('[data-testid="edit-academic-area"]').should('be.visible')
    cy.get('[data-testid="edit-submit"]').should('be.visible')
  })

  it('actualizar área académica y guardar muestra toast de éxito', () => {
    cy.get('[data-testid="edit-academic-area"]').clear().type('Ingeniería de Software')
    cy.get('[data-testid="edit-submit"]').click()
    cy.get('.sonner-toast, [data-sonner-toast]', { timeout: 8000 }).should('be.visible')
    cy.url().should('include', '/profile')
  })

  it('click en Cancelar regresa a /profile', () => {
    cy.contains('button', 'Cancelar').click()
    cy.url().should('include', '/profile')
  })
})
