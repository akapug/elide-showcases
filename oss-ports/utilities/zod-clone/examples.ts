/**
 * Zod Clone - Comprehensive Usage Examples
 */

import { z } from './zod-clone.ts'

console.log('=== Zod Clone Examples ===\n')

// Example 1: Basic Primitives
console.log('1. Basic Primitives')
const StringSchema = z.string()
const NumberSchema = z.number()
const BooleanSchema = z.boolean()

console.log(`  String: ${StringSchema.parse('hello')}`)
console.log(`  Number: ${NumberSchema.parse(42)}`)
console.log(`  Boolean: ${BooleanSchema.parse(true)}`)

// Example 2: String Validation
console.log('\n2. String Validation')
const EmailSchema = z.string().email()
const UrlSchema = z.string().url()
const UuidSchema = z.string().uuid()

const emailResult = EmailSchema.safeParse('user@example.com')
console.log(`  Email valid: ${emailResult.success}`)

const urlResult = UrlSchema.safeParse('https://example.com')
console.log(`  URL valid: ${urlResult.success}`)

// Example 3: Number Validation
console.log('\n3. Number Validation')
const AgeSchema = z.number().min(0).max(120)
const PositiveSchema = z.number().positive()
const IntegerSchema = z.number().int()

console.log(`  Age 30: ${AgeSchema.safeParse(30).success}`)
console.log(`  Positive 42: ${PositiveSchema.safeParse(42).success}`)
console.log(`  Integer 5: ${IntegerSchema.safeParse(5).success}`)

// Example 4: Objects
console.log('\n4. Objects')
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
})

const user = UserSchema.parse({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
})

console.log(`  User: ${JSON.stringify(user)}`)

// Example 5: Arrays
console.log('\n5. Arrays')
const StringArraySchema = z.array(z.string())
const NumberArraySchema = z.array(z.number()).min(1).max(10)

const strings = StringArraySchema.parse(['a', 'b', 'c'])
const numbers = NumberArraySchema.parse([1, 2, 3])

console.log(`  Strings: ${JSON.stringify(strings)}`)
console.log(`  Numbers: ${JSON.stringify(numbers)}`)

// Example 6: Nested Objects
console.log('\n6. Nested Objects')
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
})

const PersonSchema = z.object({
  name: z.string(),
  address: AddressSchema,
})

const person = PersonSchema.parse({
  name: 'Jane',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
  },
})

console.log(`  Person: ${JSON.stringify(person)}`)

// Example 7: Optional and Nullable
console.log('\n7. Optional and Nullable')
const OptionalString = z.string().optional()
const NullableString = z.string().nullable()
const NullishString = z.string().nullish()

console.log(`  Optional undefined: ${OptionalString.safeParse(undefined).success}`)
console.log(`  Nullable null: ${NullableString.safeParse(null).success}`)
console.log(`  Nullish undefined: ${NullishString.safeParse(undefined).success}`)

// Example 8: Unions
console.log('\n8. Unions')
const StringOrNumber = z.union([z.string(), z.number()])
const AlternativeSyntax = z.string().or(z.number())

console.log(`  Union string: ${StringOrNumber.safeParse('hello').success}`)
console.log(`  Union number: ${StringOrNumber.safeParse(42).success}`)

// Example 9: Literals and Enums
console.log('\n9. Literals and Enums')
const StatusLiteral = z.literal('active')
const RoleEnum = z.enum(['admin', 'user', 'guest'])

console.log(`  Literal: ${StatusLiteral.safeParse('active').success}`)
console.log(`  Enum: ${RoleEnum.safeParse('admin').success}`)

// Example 10: Transformations
console.log('\n10. Transformations')
const StringToNumber = z.string().transform((val) => val.length)
const TrimString = z.string().transform((val) => val.trim())

console.log(`  String length: ${StringToNumber.parse('hello')}`)
console.log(`  Trimmed: "${TrimString.parse('  hello  ')}"`)

// Example 11: Refinements
console.log('\n11. Refinements')
const PasswordSchema = z.string().refine(
  (val) => val.length >= 8,
  { message: 'Password must be at least 8 characters' }
)

const pwdResult = PasswordSchema.safeParse('short')
console.log(`  Short password valid: ${pwdResult.success}`)
if (!pwdResult.success) {
  console.log(`  Error: ${pwdResult.error.issues[0].message}`)
}

// Example 12: Object Methods
console.log('\n12. Object Methods')
const BaseUser = z.object({
  id: z.number(),
  name: z.string(),
})

const ExtendedUser = BaseUser.extend({
  email: z.string().email(),
})

const PartialUser = BaseUser.partial()
const PickedUser = ExtendedUser.pick({ name: true, email: true })

console.log(`  Extended keys: ${Object.keys(ExtendedUser._def.shape()).join(', ')}`)

// Example 13: Default Values
console.log('\n13. Default Values')
const ConfigSchema = z.object({
  debug: z.boolean().default(false),
  port: z.number().default(3000),
})

const config = ConfigSchema.parse({})
console.log(`  Config: ${JSON.stringify(config)}`)

// Example 14: Tuple
console.log('\n14. Tuple')
const CoordinateSchema = z.tuple([z.number(), z.number()])
const coordinate = CoordinateSchema.parse([10, 20])
console.log(`  Coordinate: ${JSON.stringify(coordinate)}`)

// Example 15: Type Inference
console.log('\n15. Type Inference')
type User = z.infer<typeof UserSchema>
type Person = z.infer<typeof PersonSchema>
console.log('  Type inference: User and Person types inferred from schemas')

// Example 16: Error Handling
console.log('\n16. Error Handling')
try {
  UserSchema.parse({ id: 'invalid', name: 123 })
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(`  Errors found: ${error.issues.length}`)
    console.log(`  First error: ${error.issues[0].message}`)
  }
}

// Example 17: Safe Parse
console.log('\n17. Safe Parse')
const result = UserSchema.safeParse({
  id: 1,
  name: 'Test',
  email: 'invalid-email',
  age: 25,
})

if (result.success) {
  console.log(`  Data: ${JSON.stringify(result.data)}`)
} else {
  console.log(`  Invalid: ${result.error.issues.length} errors`)
}

// Example 18: Records
console.log('\n18. Records')
const StringRecord = z.record(z.string())
const record = StringRecord.parse({
  key1: 'value1',
  key2: 'value2',
})
console.log(`  Record: ${JSON.stringify(record)}`)

// Example 19: Discriminated Union
console.log('\n19. Discriminated Union')
const ShapeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('circle'), radius: z.number() }),
  z.object({ kind: z.literal('square'), size: z.number() }),
])

const circle = ShapeSchema.parse({ kind: 'circle', radius: 5 })
console.log(`  Circle: ${JSON.stringify(circle)}`)

// Example 20: Complex Validation
console.log('\n20. Complex Validation')
const RegistrationSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  confirmPassword: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
  agreedToTerms: z.boolean(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords must match' }
)

const regResult = RegistrationSchema.safeParse({
  username: 'johndoe',
  password: 'password123',
  confirmPassword: 'password123',
  email: 'john@example.com',
  age: 25,
  agreedToTerms: true,
})

console.log(`  Registration valid: ${regResult.success}`)

console.log('\n=== Examples Complete ===')
