/**
 * Services Example for Sails Clone
 */

import sails from '../src/sails.ts';

const app = sails();

// Define a service
const EmailService = {
  send: async (to: string, subject: string, body: string) => {
    console.log(`Sending email to ${to}: ${subject}`);
    return { sent: true, to, subject };
  },
  
  sendWelcome: async (user: any) => {
    return EmailService.send(
      user.email,
      'Welcome!',
      `Welcome ${user.username}!`
    );
  }
};

const UserService = {
  create: async (data: any) => {
    const user = { id: Date.now(), ...data };
    
    // Send welcome email
    await EmailService.sendWelcome(user);
    
    return user;
  }
};

app.services.set('EmailService', EmailService);
app.services.set('UserService', UserService);

// Use service in controller
const UserController = {
  create: async (req: any, res: any) => {
    const user = await UserService.create(req.body);
    res.json({ user });
  }
};

app.lift({ port: 3200 });
console.log('Sails Services on :3200');
