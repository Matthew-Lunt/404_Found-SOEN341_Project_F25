const { money, toISO, fmtRange } = require('../js/helpers');

describe('helpers', () => {
    // Tests that money() formats prices correctly:

    test('money formats zero as Free and positive as $n', () => {
        expect(money(0)).toBe('Free');
        expect(money('0')).toBe('Free');
        expect(money(25)).toBe('$25');
        expect(money('9.5')).toBe('$9.5');
    });

    //  an empty string if date is missing
    //  properly combined "date + T + time" string
    //  default time handling when only date is given
    test('toISO returns empty for falsy date and combines date+time', () => {
        expect(toISO('', '18:00')).toBe('');
        expect(toISO('2025-11-10', '20:30')).toBe('2025-11-10T20:30');
        expect(toISO('2025-11-10')).toBe('2025-11-10T18:00');
    });

    //  returns a valid formatted date/time range when data exists
    //  returns "—" when no date/time is available
    test('fmtRange returns formatted range when date present or placeholder', () => {
        const result = fmtRange('2025-11-10', '18:00', '21:00');
        expect(result).toMatch(/2025/);
        expect(fmtRange('', '', '')).toBe('—');
    });
});


const fs = require('fs');
const path = require('path');

describe('publishEvent flow', () => {
    let publishEvent;
    beforeEach(() => {
        document.body.innerHTML = `
      <form id="createForm">
        <input name="title" value="Test Event" />
        <input name="location" value="Test Venue" />
        <input name="organization" value="OrgX" />
        <select name="type"><option value="Other">Other</option></select>
        <input id="price" value="10" />
        <input id="capacity" value="100" />
        <input id="date" value="2025-11-20" />
        <input id="start" value="18:00" />
        <input id="end" value="21:00" />
        <textarea id="desc">desc</textarea>
      </form>
    `;

        localStorage.clear();

        jest.resetModules();
        publishEvent = require('../js/createEvent').publishEvent;

        window.alert = jest.fn();
        delete window.location;
        window.location = { href: '' };
    });

    // Tests full successful event publishing flow
    test('publishes event into eventsCatalog and eventsPublic and redirects', () => {
        publishEvent();
        const cat = JSON.parse(localStorage.getItem('eventsCatalog') || '[]');
        const pub = JSON.parse(localStorage.getItem('eventsPublic') || '[]');
        expect(cat.length).toBe(1);
        expect(cat[0].title).toBe('Test Event');
        expect(pub.length).toBe(1);
        expect(pub[0].name).toBe('Test Event');
        expect(window.alert).toHaveBeenCalledWith('Event published.');
        expect(window.location.href).toContain('SearchResults.html?event=');
    });

    //checks event validity before publishing
    test('blocks publish when required fields missing', () => {
        document.querySelector('input[name=title]').value = '';
        publishEvent();
        expect(window.alert).toHaveBeenCalledWith('Title, location, and date are required.');
        const cat = JSON.parse(localStorage.getItem('eventsCatalog') || '[]');
        expect(cat.length).toBe(0);
    });
});


describe('Concert ticket app - core flows', () => {
    const base = 'http://localhost:8080/';

    //tests admin access and security
    it('prevents non-admin from accessing admin page', () => {
        cy.visit(`${base}AdminManagement.html`);
        cy.url().should('include', '404NotFoundLogin.html?reason=admin_only');
    });

   //checks event creation by organizer
    it('organizer creates and publishes event', () => {
        cy.visit(base);
        cy.window().then(win => {
            win.localStorage.setItem('auth', JSON.stringify({ email: 'org@x.com', role: 'organizer' }));
        });

        cy.visit(`${base}CreateEvent.html`);
        cy.get('#createForm [name=title]').clear().type('Cypress Event');
        cy.get('#createForm [name=location]').clear().type('Cypress Venue');
        cy.get('#createForm [name=organization]').clear().type('Cypress Org');
        cy.get('#price').clear().type('15');
        cy.get('#capacity').clear().type('200');
        cy.get('#date').type('2025-12-01');
        cy.get('#start').type('19:00');
        cy.get('#end').type('22:00');
        cy.get('#publishBtn').click();


        cy.url().should('include', 'SearchResults.html?event=');
        cy.window().then(win => {
            const pub = JSON.parse(win.localStorage.getItem('eventsPublic') || '[]');
            expect(pub.some(e => e.name === 'Cypress Event')).to.be.true;
            const cat = JSON.parse(win.localStorage.getItem('eventsCatalog') || '[]');
            expect(cat.some(e => e.title === 'Cypress Event')).to.be.true;
        });
    });

    it('admin analytics export CSV and Excel buttons are callable', () => {
        cy.visit(base);
        cy.window().then(win => {
            win.localStorage.setItem('auth', JSON.stringify({ email: 'admin@x.com', role: 'admin' }));
        });

        cy.visit(`${base}AdminAnalytics.html`);


        cy.window().then(win => {
            cy.stub(win, '_download').as('downloadStub');
        });

        cy.get('button').contains('Generate Report').click();
        cy.get('button').contains('Export as CSV').click();

        cy.get('@downloadStub').should('have.been.called');
    });
});
