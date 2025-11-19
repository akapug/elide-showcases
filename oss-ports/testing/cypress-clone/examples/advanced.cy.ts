/**
 * Cypress Clone - Advanced Usage Examples
 */

/// <reference types="../src" />

describe('Advanced Cypress Patterns', () => {
  context('Custom Commands', () => {
    beforeEach(() => {
      cy.visit('https://example.com/login');
    });

    it('should use custom login command', () => {
      cy.login('user@example.com', 'password123');
      cy.url().should('include', '/dashboard');
      cy.get('.user-name').should('contain', 'User');
    });

    it('should use custom assertion command', () => {
      cy.get('.btn-primary')
        .should('be.visible')
        .and('be.enabled')
        .and('have.class', 'btn-primary');
    });
  });

  context('Network Interception', () => {
    it('should intercept and modify requests', () => {
      cy.intercept('GET', '/api/users', (req) => {
        req.reply({
          statusCode: 200,
          body: [
            { id: 1, name: 'Alice', role: 'admin' },
            { id: 2, name: 'Bob', role: 'user' }
          ]
        });
      }).as('getUsers');

      cy.visit('/users');
      cy.wait('@getUsers');
      cy.get('.user-list li').should('have.length', 2);
    });

    it('should test error handling', () => {
      cy.intercept('POST', '/api/users', {
        statusCode: 400,
        body: { error: 'Invalid data' }
      });

      cy.visit('/users/new');
      cy.get('input[name="name"]').type('Test User');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('contain', 'Invalid data');
    });

    it('should delay responses', () => {
      cy.intercept('GET', '/api/slow', (req) => {
        req.reply({
          delay: 1000,
          body: { data: 'slow response' }
        });
      }).as('slowRequest');

      cy.visit('/slow-page');
      cy.get('.loading').should('be.visible');
      cy.wait('@slowRequest');
      cy.get('.loading').should('not.exist');
      cy.get('.content').should('contain', 'slow response');
    });
  });

  context('Fixtures and Aliases', () => {
    beforeEach(() => {
      cy.fixture('users.json').as('users');
    });

    it('should use fixture data', function() {
      cy.intercept('GET', '/api/users', this.users);
      cy.visit('/users');
      cy.get('.user-list li').should('have.length', this.users.length);
    });

    it('should chain fixtures', () => {
      cy.fixture('users.json')
        .then((users) => {
          cy.intercept('GET', '/api/users', users);
          return cy.fixture('posts.json');
        })
        .then((posts) => {
          cy.intercept('GET', '/api/posts', posts);
          cy.visit('/dashboard');
        });
    });
  });

  context('Form Testing', () => {
    beforeEach(() => {
      cy.visit('/forms');
    });

    it('should fill complex form', () => {
      // Text inputs
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john@example.com');

      // Select dropdown
      cy.get('select[name="country"]').select('United States');

      // Radio buttons
      cy.get('input[type="radio"][value="male"]').check();

      // Checkboxes
      cy.get('input[type="checkbox"][name="terms"]').check();
      cy.get('input[type="checkbox"][name="newsletter"]').check();

      // Textarea
      cy.get('textarea[name="message"]').type('This is a test message');

      // Date input
      cy.get('input[type="date"]').type('2024-01-15');

      // File upload
      cy.get('input[type="file"]').selectFile('path/to/file.pdf');

      // Submit
      cy.get('button[type="submit"]').click();

      // Verify submission
      cy.get('.success-message').should('be.visible');
    });

    it('should validate form inputs', () => {
      cy.get('button[type="submit"]').click();

      // Check validation messages
      cy.get('input[name="email"]:invalid').should('exist');
      cy.get('.error-message').should('contain', 'Email is required');

      // Fill valid email
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('.error-message').should('contain', 'Invalid email format');

      cy.get('input[name="email"]').clear().type('valid@example.com');
      cy.get('.error-message').should('not.exist');
    });
  });

  context('Table Interactions', () => {
    beforeEach(() => {
      cy.visit('/table');
    });

    it('should sort table columns', () => {
      cy.get('th.name').click(); // Sort by name ascending
      cy.get('tbody tr:first td.name').should('contain', 'Alice');

      cy.get('th.name').click(); // Sort by name descending
      cy.get('tbody tr:first td.name').should('contain', 'Zack');
    });

    it('should filter table rows', () => {
      cy.get('input.search').type('john');
      cy.get('tbody tr').should('have.length', 2);
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'John');
      });
    });

    it('should paginate table', () => {
      cy.get('tbody tr').should('have.length', 10);
      cy.get('.pagination .next').click();
      cy.get('tbody tr').should('have.length', 10);
      cy.get('.pagination .current').should('contain', '2');
    });

    it('should select table rows', () => {
      cy.get('tbody tr:nth-child(1) input[type="checkbox"]').check();
      cy.get('tbody tr:nth-child(3) input[type="checkbox"]').check();
      cy.get('.selected-count').should('contain', '2 selected');

      cy.get('button.delete-selected').click();
      cy.get('.confirm-modal').should('be.visible');
    });
  });

  context('Drag and Drop', () => {
    beforeEach(() => {
      cy.visit('/drag-drop');
    });

    it('should drag and drop items', () => {
      cy.get('.draggable-item:first')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 500, clientY: 200 })
        .trigger('mouseup');

      cy.get('.drop-zone').should('contain', 'Item 1');
    });

    it('should reorder list items', () => {
      const dataTransfer = new DataTransfer();

      cy.get('.sortable-list li:first')
        .trigger('dragstart', { dataTransfer });

      cy.get('.sortable-list li:last')
        .trigger('drop', { dataTransfer });

      cy.get('.sortable-list li:last').should('contain', 'Item 1');
    });
  });

  context('Modal Dialogs', () => {
    beforeEach(() => {
      cy.visit('/modals');
    });

    it('should open and close modal', () => {
      cy.get('.open-modal').click();
      cy.get('.modal').should('be.visible');
      cy.get('.modal-backdrop').should('exist');

      cy.get('.modal .close').click();
      cy.get('.modal').should('not.exist');
    });

    it('should close modal on backdrop click', () => {
      cy.get('.open-modal').click();
      cy.get('.modal-backdrop').click({ force: true });
      cy.get('.modal').should('not.exist');
    });

    it('should trap focus in modal', () => {
      cy.get('.open-modal').click();
      cy.get('.modal input:first').should('have.focus');

      cy.get('.modal input:first').tab();
      cy.get('.modal input:last').should('have.focus');
    });
  });

  context('Cookies and Storage', () => {
    it('should set and get cookies', () => {
      cy.visit('/');
      cy.setCookie('sessionId', 'abc123');
      cy.getCookie('sessionId').should('have.property', 'value', 'abc123');

      cy.clearCookie('sessionId');
      cy.getCookie('sessionId').should('be.null');
    });

    it('should work with local storage', () => {
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.setItem('theme', 'dark');
        expect(win.localStorage.getItem('theme')).to.equal('dark');
      });

      cy.reload();
      cy.window().then((win) => {
        expect(win.localStorage.getItem('theme')).to.equal('dark');
      });
    });

    it('should persist session across pages', () => {
      cy.visit('/login');
      cy.login('user@example.com', 'password');

      cy.visit('/profile');
      cy.get('.user-info').should('be.visible');

      cy.visit('/settings');
      cy.get('.user-info').should('be.visible');
    });
  });

  context('Viewport Testing', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should work on ${name} viewport`, () => {
        cy.viewport(width, height);
        cy.visit('/');

        if (name === 'mobile') {
          cy.get('.mobile-menu').should('be.visible');
          cy.get('.desktop-menu').should('not.be.visible');
        } else {
          cy.get('.mobile-menu').should('not.be.visible');
          cy.get('.desktop-menu').should('be.visible');
        }
      });
    });
  });

  context('Performance Testing', () => {
    it('should load page within acceptable time', () => {
      const start = Date.now();

      cy.visit('/');

      cy.window().then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should measure API response time', () => {
      cy.intercept('GET', '/api/data').as('getData');

      cy.visit('/');
      cy.wait('@getData').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        // Check response time
      });
    });
  });

  context('Accessibility Testing', () => {
    it('should have proper heading structure', () => {
      cy.visit('/');
      cy.get('h1').should('have.length', 1);
      cy.get('h1').should('be.visible');
    });

    it('should have alt text on images', () => {
      cy.visit('/');
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should be keyboard navigable', () => {
      cy.visit('/');
      cy.get('body').tab();
      cy.focused().should('have.class', 'skip-link');

      cy.focused().tab();
      cy.focused().should('match', 'a, button, input');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/');
      cy.get('[role="button"]').should('have.attr', 'aria-label');
      cy.get('[role="navigation"]').should('exist');
    });
  });

  context('Data-driven Tests', () => {
    const testUsers = [
      { email: 'user1@example.com', password: 'pass1', role: 'admin' },
      { email: 'user2@example.com', password: 'pass2', role: 'user' },
      { email: 'user3@example.com', password: 'pass3', role: 'guest' }
    ];

    testUsers.forEach((user) => {
      it(`should login as ${user.role}`, () => {
        cy.visit('/login');
        cy.get('input[name="email"]').type(user.email);
        cy.get('input[name="password"]').type(user.password);
        cy.get('button[type="submit"]').click();

        cy.get('.user-role').should('contain', user.role);
      });
    });
  });

  context('File Operations', () => {
    it('should upload file', () => {
      cy.visit('/upload');
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test.pdf');
      cy.get('.file-name').should('contain', 'test.pdf');
      cy.get('button.upload').click();
      cy.get('.success-message').should('be.visible');
    });

    it('should download file', () => {
      cy.visit('/downloads');
      cy.get('a.download-link').click();
      cy.readFile('cypress/downloads/file.pdf').should('exist');
    });
  });
});
