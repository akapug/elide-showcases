# Real-World Testing Scenarios

Complete examples of testing real-world applications across different domains.

## E-Commerce Application

### Product Catalog

```typescript
describe('Product Catalog', () => {
  describe('Product Search', () => {
    it('should search products by name', async () => {
      const products = await searchProducts('laptop');

      expect(products.length).toBeGreaterThan(0);
      expect(products.every(p => p.name.toLowerCase().includes('laptop'))).toBe(true);
    });

    it('should filter by price range', async () => {
      const products = await searchProducts('', {
        minPrice: 100,
        maxPrice: 500
      });

      expect(products.every(p => p.price >= 100 && p.price <= 500)).toBe(true);
    });

    it('should filter by category', async () => {
      const products = await searchProducts('', {
        category: 'Electronics'
      });

      expect(products.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should sort by price', async () => {
      const products = await searchProducts('', {
        sortBy: 'price',
        order: 'asc'
      });

      for (let i = 0; i < products.length - 1; i++) {
        expect(products[i].price).toBeLessThanOrEqual(products[i + 1].price);
      }
    });
  });

  describe('Product Details', () => {
    it('should display product information', async () => {
      const product = await getProduct(1);

      expect(product).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        images: expect.arrayContaining([expect.any(String)]),
        stock: expect.any(Number),
        category: expect.any(String)
      });
    });

    it('should show related products', async () => {
      const product = await getProduct(1);
      const related = await getRelatedProducts(product.id);

      expect(related.length).toBeGreaterThan(0);
      expect(related.every(p => p.category === product.category)).toBe(true);
      expect(related.every(p => p.id !== product.id)).toBe(true);
    });

    it('should display customer reviews', async () => {
      const reviews = await getProductReviews(1);

      expect(reviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rating: expect.any(Number),
            comment: expect.any(String),
            author: expect.any(String),
            date: expect.any(Date)
          })
        ])
      );
    });
  });

  describe('Shopping Cart', () => {
    let cart: ShoppingCart;

    beforeEach(() => {
      cart = new ShoppingCart();
    });

    it('should add product to cart', () => {
      const product = { id: 1, name: 'Laptop', price: 999 };
      cart.addItem(product, 1);

      expect(cart.getItemCount()).toBe(1);
      expect(cart.getSubtotal()).toBe(999);
    });

    it('should update quantity', () => {
      const product = { id: 1, name: 'Laptop', price: 999 };
      cart.addItem(product, 1);
      cart.updateQuantity(1, 3);

      expect(cart.getItemCount()).toBe(3);
      expect(cart.getSubtotal()).toBe(2997);
    });

    it('should remove item from cart', () => {
      const product = { id: 1, name: 'Laptop', price: 999 };
      cart.addItem(product, 1);
      cart.removeItem(1);

      expect(cart.getItemCount()).toBe(0);
      expect(cart.getSubtotal()).toBe(0);
    });

    it('should apply discount code', () => {
      const product = { id: 1, name: 'Laptop', price: 1000 };
      cart.addItem(product, 1);
      cart.applyDiscount('SAVE10');

      expect(cart.getSubtotal()).toBe(1000);
      expect(cart.getDiscount()).toBe(100);
      expect(cart.getTotal()).toBe(900);
    });

    it('should calculate tax', () => {
      const product = { id: 1, name: 'Laptop', price: 1000 };
      cart.addItem(product, 1);
      cart.setTaxRate(0.08);

      expect(cart.getTax()).toBe(80);
      expect(cart.getTotal()).toBe(1080);
    });

    it('should handle free shipping threshold', () => {
      const product = { id: 1, name: 'Laptop', price: 1000 };
      cart.addItem(product, 1);

      expect(cart.getShipping()).toBe(0); // Free shipping over $500

      const cheap = { id: 2, name: 'Cable', price: 10 };
      const cart2 = new ShoppingCart();
      cart2.addItem(cheap, 1);

      expect(cart2.getShipping()).toBe(10);
    });
  });

  describe('Checkout Process', () => {
    let checkout: CheckoutService;

    beforeEach(() => {
      checkout = new CheckoutService();
    });

    it('should validate shipping address', async () => {
      const invalidAddress = {
        street: '',
        city: 'New York',
        zip: '10001'
      };

      await expect(checkout.validateAddress(invalidAddress))
        .rejects.toThrow('Street address is required');

      const validAddress = {
        street: '123 Main St',
        city: 'New York',
        zip: '10001'
      };

      const result = await checkout.validateAddress(validAddress);
      expect(result.isValid).toBe(true);
    });

    it('should process payment', async () => {
      const payment = {
        cardNumber: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        amount: 1000
      };

      const result = await checkout.processPayment(payment);

      expect(result.status).toBe('success');
      expect(result.transactionId).toBeDefined();
    });

    it('should create order', async () => {
      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        shipping: { street: '123 Main St', city: 'NY', zip: '10001' },
        payment: { method: 'card', token: 'tok_123' }
      };

      const order = await checkout.createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.total).toBeGreaterThan(0);
    });

    it('should send confirmation email', async () => {
      const emailService = jest.fn();
      checkout.setEmailService(emailService);

      const order = await checkout.createOrder({
        items: [{ productId: 1, quantity: 1 }],
        shipping: {},
        payment: {}
      });

      expect(emailService).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: 'Order Confirmation',
          body: expect.stringContaining(order.id)
        })
      );
    });
  });

  describe('Inventory Management', () => {
    let inventory: InventoryService;

    beforeEach(() => {
      inventory = new InventoryService();
    });

    it('should check stock availability', async () => {
      const available = await inventory.checkStock(1, 5);
      expect(typeof available).toBe('boolean');
    });

    it('should reserve stock', async () => {
      await inventory.reserve(1, 2);
      const stock = await inventory.getStock(1);
      expect(stock.reserved).toBe(2);
    });

    it('should handle out of stock', async () => {
      await expect(inventory.reserve(1, 1000))
        .rejects.toThrow('Insufficient stock');
    });

    it('should release reserved stock', async () => {
      await inventory.reserve(1, 5);
      await inventory.release(1, 5);
      const stock = await inventory.getStock(1);
      expect(stock.reserved).toBe(0);
    });
  });
});
```

## Social Media Application

### User Authentication

```typescript
describe('User Authentication', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('Registration', () => {
    it('should register new user', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      const user = await authService.register(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).not.toBe('SecurePass123!'); // Hashed
    });

    it('should validate password strength', async () => {
      const weakPassword = {
        username: 'johndoe',
        email: 'john@example.com',
        password: '123'
      };

      await expect(authService.register(weakPassword))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should prevent duplicate usernames', async () => {
      await authService.register({
        username: 'johndoe',
        email: 'john1@example.com',
        password: 'SecurePass123!'
      });

      await expect(authService.register({
        username: 'johndoe',
        email: 'john2@example.com',
        password: 'SecurePass123!'
      })).rejects.toThrow('Username already taken');
    });

    it('should send verification email', async () => {
      const emailService = jest.fn();
      authService.setEmailService(emailService);

      await authService.register({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      });

      expect(emailService).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('Verify'),
          body: expect.stringContaining('verification')
        })
      );
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await authService.register({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login('johndoe', 'SecurePass123!');

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('johndoe');
    });

    it('should reject invalid password', async () => {
      await expect(authService.login('johndoe', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should lock account after failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login('johndoe', 'wrong');
        } catch {}
      }

      await expect(authService.login('johndoe', 'SecurePass123!'))
        .rejects.toThrow('Account locked');
    });
  });

  describe('Password Reset', () => {
    it('should send reset email', async () => {
      const emailService = jest.fn();
      authService.setEmailService(emailService);

      await authService.requestPasswordReset('john@example.com');

      expect(emailService).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('Reset'),
          body: expect.stringContaining('reset')
        })
      );
    });

    it('should reset password with valid token', async () => {
      const token = await authService.requestPasswordReset('john@example.com');
      await authService.resetPassword(token, 'NewSecurePass123!');

      const result = await authService.login('johndoe', 'NewSecurePass123!');
      expect(result.token).toBeDefined();
    });

    it('should reject expired token', async () => {
      const token = 'expired_token';
      await expect(authService.resetPassword(token, 'NewPass123!'))
        .rejects.toThrow('Invalid or expired token');
    });
  });
});

describe('Posts and Feed', () => {
  let postService: PostService;

  beforeEach(() => {
    postService = new PostService();
  });

  describe('Creating Posts', () => {
    it('should create text post', async () => {
      const post = await postService.create({
        userId: 1,
        content: 'Hello, world!',
        type: 'text'
      });

      expect(post.id).toBeDefined();
      expect(post.content).toBe('Hello, world!');
      expect(post.type).toBe('text');
    });

    it('should create image post', async () => {
      const post = await postService.create({
        userId: 1,
        content: 'Check out this photo!',
        type: 'image',
        images: ['https://example.com/image.jpg']
      });

      expect(post.images).toHaveLength(1);
      expect(post.type).toBe('image');
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(1001);

      await expect(postService.create({
        userId: 1,
        content: longContent,
        type: 'text'
      })).rejects.toThrow('Content exceeds maximum length');
    });
  });

  describe('Engagement', () => {
    let post: any;

    beforeEach(async () => {
      post = await postService.create({
        userId: 1,
        content: 'Test post',
        type: 'text'
      });
    });

    it('should like post', async () => {
      await postService.like(post.id, 2);
      const updated = await postService.get(post.id);

      expect(updated.likes).toBe(1);
    });

    it('should unlike post', async () => {
      await postService.like(post.id, 2);
      await postService.unlike(post.id, 2);
      const updated = await postService.get(post.id);

      expect(updated.likes).toBe(0);
    });

    it('should comment on post', async () => {
      const comment = await postService.comment(post.id, {
        userId: 2,
        text: 'Great post!'
      });

      expect(comment.id).toBeDefined();
      expect(comment.postId).toBe(post.id);
      expect(comment.text).toBe('Great post!');
    });

    it('should share post', async () => {
      const share = await postService.share(post.id, 2);

      expect(share.originalPostId).toBe(post.id);
      expect(share.userId).toBe(2);
    });
  });

  describe('Feed Generation', () => {
    it('should generate personalized feed', async () => {
      const feed = await postService.getFeed(1, {
        limit: 20,
        algorithm: 'personalized'
      });

      expect(feed).toHaveLength(20);
      expect(feed[0].score).toBeGreaterThanOrEqual(feed[19].score);
    });

    it('should generate chronological feed', async () => {
      const feed = await postService.getFeed(1, {
        limit: 20,
        algorithm: 'chronological'
      });

      for (let i = 0; i < feed.length - 1; i++) {
        expect(feed[i].createdAt.getTime())
          .toBeGreaterThanOrEqual(feed[i + 1].createdAt.getTime());
      }
    });

    it('should filter by hashtags', async () => {
      const feed = await postService.getFeed(1, {
        hashtags: ['javascript', 'coding']
      });

      expect(feed.every(post =>
        post.hashtags.some(tag => ['javascript', 'coding'].includes(tag))
      )).toBe(true);
    });
  });
});

describe('Messaging', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = new MessageService();
  });

  describe('Direct Messages', () => {
    it('should send message', async () => {
      const message = await messageService.send({
        from: 1,
        to: 2,
        text: 'Hello!'
      });

      expect(message.id).toBeDefined();
      expect(message.text).toBe('Hello!');
    });

    it('should get conversation', async () => {
      await messageService.send({ from: 1, to: 2, text: 'Hi!' });
      await messageService.send({ from: 2, to: 1, text: 'Hello!' });
      await messageService.send({ from: 1, to: 2, text: 'How are you?' });

      const conversation = await messageService.getConversation(1, 2);

      expect(conversation).toHaveLength(3);
      expect(conversation[0].text).toBe('Hi!');
      expect(conversation[2].text).toBe('How are you?');
    });

    it('should mark as read', async () => {
      const message = await messageService.send({
        from: 1,
        to: 2,
        text: 'Hello!'
      });

      await messageService.markAsRead(message.id, 2);
      const updated = await messageService.get(message.id);

      expect(updated.read).toBe(true);
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it('should delete message', async () => {
      const message = await messageService.send({
        from: 1,
        to: 2,
        text: 'Hello!'
      });

      await messageService.delete(message.id, 1);
      const deleted = await messageService.get(message.id);

      expect(deleted).toBeNull();
    });
  });

  describe('Group Chat', () => {
    it('should create group', async () => {
      const group = await messageService.createGroup({
        name: 'Study Group',
        members: [1, 2, 3, 4]
      });

      expect(group.id).toBeDefined();
      expect(group.members).toHaveLength(4);
    });

    it('should send group message', async () => {
      const group = await messageService.createGroup({
        name: 'Study Group',
        members: [1, 2, 3]
      });

      const message = await messageService.sendToGroup(group.id, {
        from: 1,
        text: 'Meeting at 3pm'
      });

      expect(message.groupId).toBe(group.id);
    });

    it('should add member to group', async () => {
      const group = await messageService.createGroup({
        name: 'Study Group',
        members: [1, 2]
      });

      await messageService.addToGroup(group.id, 3);
      const updated = await messageService.getGroup(group.id);

      expect(updated.members).toContain(3);
    });
  });
});
```

## Banking Application

### Account Management

```typescript
describe('Banking System', () => {
  let bankService: BankService;

  beforeEach(() => {
    bankService = new BankService();
  });

  describe('Account Operations', () => {
    it('should create savings account', async () => {
      const account = await bankService.createAccount({
        userId: 1,
        type: 'savings',
        currency: 'USD'
      });

      expect(account.number).toMatch(/^\d{10}$/);
      expect(account.balance).toBe(0);
      expect(account.type).toBe('savings');
    });

    it('should deposit money', async () => {
      const account = await bankService.createAccount({
        userId: 1,
        type: 'savings',
        currency: 'USD'
      });

      await bankService.deposit(account.number, 1000);
      const updated = await bankService.getAccount(account.number);

      expect(updated.balance).toBe(1000);
    });

    it('should withdraw money', async () => {
      const account = await bankService.createAccount({
        userId: 1,
        type: 'savings',
        currency: 'USD'
      });

      await bankService.deposit(account.number, 1000);
      await bankService.withdraw(account.number, 300);
      const updated = await bankService.getAccount(account.number);

      expect(updated.balance).toBe(700);
    });

    it('should prevent overdraft', async () => {
      const account = await bankService.createAccount({
        userId: 1,
        type: 'savings',
        currency: 'USD'
      });

      await bankService.deposit(account.number, 100);

      await expect(bankService.withdraw(account.number, 500))
        .rejects.toThrow('Insufficient funds');
    });
  });

  describe('Transfers', () => {
    let fromAccount: any;
    let toAccount: any;

    beforeEach(async () => {
      fromAccount = await bankService.createAccount({
        userId: 1,
        type: 'checking',
        currency: 'USD'
      });

      toAccount = await bankService.createAccount({
        userId: 2,
        type: 'checking',
        currency: 'USD'
      });

      await bankService.deposit(fromAccount.number, 1000);
    });

    it('should transfer between accounts', async () => {
      await bankService.transfer(fromAccount.number, toAccount.number, 300);

      const from = await bankService.getAccount(fromAccount.number);
      const to = await bankService.getAccount(toAccount.number);

      expect(from.balance).toBe(700);
      expect(to.balance).toBe(300);
    });

    it('should create transaction record', async () => {
      await bankService.transfer(fromAccount.number, toAccount.number, 300);

      const transactions = await bankService.getTransactions(fromAccount.number);

      expect(transactions).toHaveLength(2); // Deposit + Transfer
      expect(transactions[1].type).toBe('transfer');
      expect(transactions[1].amount).toBe(300);
    });

    it('should rollback failed transfer', async () => {
      // Simulate network error during transfer
      jest.spyOn(bankService, 'deposit').mockRejectedValueOnce(new Error('Network error'));

      await expect(
        bankService.transfer(fromAccount.number, toAccount.number, 300)
      ).rejects.toThrow();

      const from = await bankService.getAccount(fromAccount.number);
      expect(from.balance).toBe(1000); // Original balance
    });
  });

  describe('Interest Calculation', () => {
    it('should calculate simple interest', () => {
      const interest = bankService.calculateInterest(
        1000,
        0.05,
        12,
        'simple'
      );

      expect(interest).toBe(50); // 1000 * 0.05 * 1
    });

    it('should calculate compound interest', () => {
      const interest = bankService.calculateInterest(
        1000,
        0.05,
        12,
        'compound'
      );

      expect(interest).toBeCloseTo(51.16, 2); // Compounded monthly
    });

    it('should apply interest to savings account', async () => {
      const account = await bankService.createAccount({
        userId: 1,
        type: 'savings',
        currency: 'USD',
        interestRate: 0.05
      });

      await bankService.deposit(account.number, 1000);
      await bankService.applyInterest(account.number);

      const updated = await bankService.getAccount(account.number);
      expect(updated.balance).toBeGreaterThan(1000);
    });
  });
});
```

This comprehensive guide provides real-world testing examples that cover common application domains and scenarios.
