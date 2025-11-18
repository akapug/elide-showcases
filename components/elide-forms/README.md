# @elide/forms

Advanced form library for Elide - Build complex forms with schema-based validation, multi-step wizards, and dynamic field rendering.

## Features

- 📝 **Schema-Based** - Define forms using JSON Schema, Zod, or Yup
- ✅ **Validation** - Built-in validators and custom validation
- 🔄 **Multi-Step Forms** - Wizard and stepper support
- 📤 **File Upload** - Drag-and-drop file uploads
- 🎯 **Dynamic Fields** - Conditional fields and dynamic arrays
- 💾 **Auto-Save** - Automatic form state persistence
- 🔥 **TypeScript** - Full type safety
- ⚡ **Performance** - Optimized re-renders with React Hook Form

## Installation

```bash
npm install @elide/forms
# or
yarn add @elide/forms
# or
pnpm add @elide/forms
```

## Component Categories (30+ components)

### Form Builders (5)
- SchemaForm - JSON Schema based forms
- ZodForm - Zod schema forms
- YupForm - Yup schema forms
- DynamicForm - Runtime form generation
- FormWizard - Multi-step form wizard

### Input Components (12)
- TextInput, EmailInput, PasswordInput
- NumberInput, PhoneInput, UrlInput
- DateInput, TimeInput, DateTimeInput
- ColorInput, FileInput, RichTextInput

### Selection Components (6)
- Select, MultiSelect, Autocomplete
- RadioGroup, CheckboxGroup, TagInput

### Advanced Components (7)
- ArrayField - Dynamic array inputs
- ObjectField - Nested object fields
- ConditionalField - Conditional rendering
- DependentField - Field dependencies
- RepeaterField - Repeatable field groups
- FileUploader - Advanced file upload
- SignaturePad - Digital signatures

## Quick Start

### Simple Form

```tsx
import { Form, TextInput, EmailInput, Button } from '@elide/forms';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().optional()
});

function ContactForm() {
  const handleSubmit = (data) => {
    console.log('Form data:', data);
  };

  return (
    <Form schema={schema} onSubmit={handleSubmit}>
      <TextInput name="name" label="Name" required />
      <EmailInput name="email" label="Email" required />
      <TextInput name="message" label="Message" multiline rows={4} />
      <Button type="submit">Send Message</Button>
    </Form>
  );
}
```

### Schema-Based Form

```tsx
import { SchemaForm } from '@elide/forms';

const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First Name' },
    lastName: { type: 'string', title: 'Last Name' },
    age: { type: 'number', minimum: 0, maximum: 120 },
    email: { type: 'string', format: 'email' },
    subscribe: { type: 'boolean', title: 'Subscribe to newsletter' }
  },
  required: ['firstName', 'lastName', 'email']
};

<SchemaForm
  schema={schema}
  onSubmit={(data) => console.log(data)}
  onError={(errors) => console.error(errors)}
/>
```

### Multi-Step Form Wizard

```tsx
import { FormWizard, WizardStep } from '@elide/forms';

function RegistrationWizard() {
  return (
    <FormWizard onComplete={handleComplete}>
      <WizardStep title="Personal Info" validationSchema={step1Schema}>
        <TextInput name="firstName" label="First Name" />
        <TextInput name="lastName" label="Last Name" />
        <DateInput name="birthDate" label="Birth Date" />
      </WizardStep>

      <WizardStep title="Contact Info" validationSchema={step2Schema}>
        <EmailInput name="email" label="Email" />
        <PhoneInput name="phone" label="Phone" />
      </WizardStep>

      <WizardStep title="Account Setup" validationSchema={step3Schema}>
        <TextInput name="username" label="Username" />
        <PasswordInput name="password" label="Password" />
        <PasswordInput name="confirmPassword" label="Confirm Password" />
      </WizardStep>

      <WizardStep title="Review & Submit">
        <ReviewStep />
      </WizardStep>
    </FormWizard>
  );
}
```

### Dynamic Array Fields

```tsx
import { Form, ArrayField, TextInput, Button } from '@elide/forms';

function SkillsForm() {
  return (
    <Form onSubmit={handleSubmit}>
      <ArrayField
        name="skills"
        label="Skills"
        min={1}
        max={10}
        addButtonText="Add Skill"
        removeButtonText="Remove"
      >
        {(index) => (
          <>
            <TextInput name={`skills.${index}.name`} label="Skill Name" />
            <Select name={`skills.${index}.level`} label="Level">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </Select>
          </>
        )}
      </ArrayField>
    </Form>
  );
}
```

### Conditional Fields

```tsx
import { Form, ConditionalField, Select, TextInput } from '@elide/forms';

function EmploymentForm() {
  return (
    <Form onSubmit={handleSubmit}>
      <Select name="employmentStatus" label="Employment Status">
        <option value="employed">Employed</option>
        <option value="unemployed">Unemployed</option>
        <option value="student">Student</option>
      </Select>

      <ConditionalField
        when={(values) => values.employmentStatus === 'employed'}
      >
        <TextInput name="companyName" label="Company Name" />
        <TextInput name="jobTitle" label="Job Title" />
        <NumberInput name="yearsOfExperience" label="Years of Experience" />
      </ConditionalField>

      <ConditionalField
        when={(values) => values.employmentStatus === 'student'}
      >
        <TextInput name="schoolName" label="School Name" />
        <TextInput name="major" label="Major" />
      </ConditionalField>
    </Form>
  );
}
```

### File Upload

```tsx
import { Form, FileUploader } from '@elide/forms';

function DocumentUpload() {
  return (
    <Form onSubmit={handleSubmit}>
      <FileUploader
        name="documents"
        label="Upload Documents"
        accept=".pdf,.doc,.docx"
        maxSize={10 * 1024 * 1024} // 10MB
        multiple
        maxFiles={5}
        preview
        onUpload={async (files) => {
          // Upload to server
          const formData = new FormData();
          files.forEach(file => formData.append('files', file));
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          return response.json();
        }}
      />
    </Form>
  );
}
```

### Form with Validation

```tsx
import { Form, useForm } from '@elide/forms';
import { z } from 'zod';

const schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

function SignUpForm() {
  const form = useForm({ schema });

  return (
    <Form {...form}>
      <TextInput name="username" label="Username" />
      <EmailInput name="email" label="Email" />
      <PasswordInput name="password" label="Password" />
      <PasswordInput name="confirmPassword" label="Confirm Password" />
      <Button type="submit">Sign Up</Button>
    </Form>
  );
}
```

### Auto-Save Form

```tsx
import { Form, useFormAutoSave } from '@elide/forms';

function DraftForm() {
  const autoSave = useFormAutoSave({
    key: 'draft-form',
    debounce: 1000,
    storage: 'localStorage',
    onSave: async (data) => {
      await fetch('/api/drafts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });

  return (
    <Form {...autoSave}>
      <TextInput name="title" label="Title" />
      <TextInput name="content" label="Content" multiline />
      {autoSave.lastSaved && (
        <div>Last saved: {autoSave.lastSaved.toLocaleTimeString()}</div>
      )}
    </Form>
  );
}
```

## Validation

### Built-in Validators

```tsx
import { validators } from '@elide/forms';

const customValidation = {
  email: validators.email(),
  phone: validators.phone(),
  url: validators.url(),
  creditCard: validators.creditCard(),
  date: validators.date({ min: new Date('2020-01-01'), max: new Date() }),
  number: validators.number({ min: 0, max: 100 }),
  string: validators.string({ minLength: 3, maxLength: 50 }),
  custom: validators.custom((value) => value === 'expected')
};
```

### Async Validation

```tsx
<TextInput
  name="username"
  label="Username"
  asyncValidate={async (value) => {
    const response = await fetch(`/api/check-username?username=${value}`);
    const { available } = await response.json();
    return available || 'Username already taken';
  }}
/>
```

## Hooks

- `useForm` - Form state management
- `useFormContext` - Access form context
- `useWatch` - Watch field values
- `useFieldArray` - Array field management
- `useFormAutoSave` - Auto-save functionality
- `useFormValidation` - Validation utilities
- `useFormSubmit` - Submit handling

## TypeScript Support

Full type safety:

```tsx
import type { FormData, FormSchema } from '@elide/forms';

interface UserForm extends FormData {
  name: string;
  email: string;
  age: number;
}

const schema: FormSchema<UserForm> = {
  // Fully typed schema
};
```

## License

MIT

## Contributing

Contributions welcome!
