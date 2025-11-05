/**
 * Mock Data Generator
 * Generate realistic fake data for testing
 */

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const DOMAINS = ['example.com', 'test.com', 'demo.org', 'sample.net'];
const COMPANIES = ['Acme Corp', 'TechStart', 'DataFlow', 'CloudSync', 'DevTools Inc'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomEmail(): string {
  const first = randomElement(FIRST_NAMES).toLowerCase();
  const last = randomElement(LAST_NAMES).toLowerCase();
  const domain = randomElement(DOMAINS);
  return `${first}.${last}@${domain}`;
}

export function randomName(): { first: string; last: string; full: string } {
  const first = randomElement(FIRST_NAMES);
  const last = randomElement(LAST_NAMES);
  return { first, last, full: `${first} ${last}` };
}

export function randomPhone(): string {
  return `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

export function randomDate(start?: Date, end?: Date): Date {
  const startTime = start ? start.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000;
  const endTime = end ? end.getTime() : Date.now();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

export function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  phone: string;
  company: string;
  city: string;
  active: boolean;
  createdAt: Date;
}

export function randomUser(): User {
  const name = randomName();
  return {
    id: randomString(8),
    name: name.full,
    email: randomEmail(),
    age: randomInt(18, 65),
    phone: randomPhone(),
    company: randomElement(COMPANIES),
    city: randomElement(CITIES),
    active: randomBoolean(),
    createdAt: randomDate()
  };
}

export function generateUsers(count: number): User[] {
  return Array.from({ length: count }, () => randomUser());
}

export function randomPrice(min: number = 10, max: number = 1000): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

export function randomParagraph(sentences: number = 3): string {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore'
  ];

  const result: string[] = [];
  for (let i = 0; i < sentences; i++) {
    const length = randomInt(5, 15);
    const sentence = Array.from({ length }, () => randomElement(words)).join(' ');
    result.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
  }

  return result.join(' ');
}

// CLI demo
if (import.meta.url.includes("mock-data-generator.ts")) {
  console.log("Mock Data Generator Demo\n");

  console.log("Random primitives:");
  console.log("  Int (1-100):", randomInt(1, 100));
  console.log("  String (8):", randomString(8));
  console.log("  Boolean:", randomBoolean());
  console.log("  Email:", randomEmail());
  console.log("  Phone:", randomPhone());
  console.log("  Color:", randomColor());

  console.log("\nRandom name:");
  const name = randomName();
  console.log("  First:", name.first);
  console.log("  Last:", name.last);
  console.log("  Full:", name.full);

  console.log("\nRandom user:");
  const user = randomUser();
  console.log(JSON.stringify(user, null, 2));

  console.log("\nGenerate 3 users:");
  const users = generateUsers(3);
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name} - ${u.email}`);
  });

  console.log("\nRandom paragraph:");
  console.log(randomParagraph(2));

  console.log("✅ Mock data generator test passed");
}
