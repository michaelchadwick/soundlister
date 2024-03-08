/// <reference types="Cypress" />

context('anon', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load front page and have correct title', () => {
    cy.title()
      .should('contain', 'SoundLister')
    cy.get('h1')
      .invoke('text')
      .should('contain', 'SoundLister')
  })

  it('should have a complete audio player', () => {
    cy.get('#audio-player-container')
      .find('#track-current-name')
      .should('exist')
    cy.get('#play-icon')
      .should('exist')
    cy.get('#time-current')
      .should('exist')
    cy.get('#seek-slider')
      .should('exist')
    cy.get('#seek-slider')
      .should('exist')
    cy.get('#time-total')
      .should('exist')
    cy.get('#volume-slider')
      .should('exist')
    cy.get('#mute-icon')
      .should('exist')
    cy.get('#backward')
      .should('exist')
    cy.get('#repeat-mode')
      .should('exist')
    cy.get('#shuffle-mode')
      .should('exist')
    cy.get('#forward')
      .should('exist')
  })

  it('should have a playlist', () => {
    cy.get('#playlist')
      .should('exist')
  })
})
