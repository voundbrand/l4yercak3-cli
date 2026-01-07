# L4YERCAK3 CLI - Object Type Mappings

This document defines how external application models map to L4YERCAK3 object types.

---

## Overview

The CLI uses intelligent detection to map external application models to L4YERCAK3's universal ontology. Each L4YERCAK3 object type has specific properties and behaviors.

---

## L4YERCAK3 Object Types

### Core Object Structure

All objects in L4YERCAK3 follow this base structure:

```typescript
interface L4YERCAK3Object {
  _id: Id<"objects">;
  organizationId: Id<"organizations">;
  type: string;              // "contact", "event", "invoice", etc.
  subtype?: string;          // More specific categorization
  status: string;            // Lifecycle status
  displayName: string;       // Human-readable name
  customProperties: Record<string, any>;  // Type-specific data
  createdAt: number;
  updatedAt: number;
  createdBy?: Id<"users">;
}
```

---

## Type: `contact`

### Description
Represents a person in the CRM. Customers, leads, attendees, members.

### Status Values
- `active` - Normal contact
- `archived` - Archived/inactive
- `blocked` - Blocked from communications

### Custom Properties
```typescript
{
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  addresses?: Address[];
  tags?: string[];
  source?: string;           // "web", "import", "event", "api"
  marketingConsent?: boolean;
  notes?: string;
  customFields?: Record<string, any>;
}
```

### Detection Patterns

**Model Name Matches:**
- `user`, `User`, `users`
- `customer`, `Customer`
- `member`, `Member`
- `subscriber`, `Subscriber`
- `lead`, `Lead`
- `attendee`, `Attendee`
- `person`, `Person`
- `contact`, `Contact`

**Field Indicators (presence increases confidence):**
- `email` (required indicator)
- `firstName`, `lastName`, `name`
- `phone`, `phoneNumber`, `mobile`
- `company`, `companyName`, `organization`

### Example Mapping

```yaml
External Model: User
L4YERCAK3 Type: contact
Confidence: 95%

Field Mappings:
  email → email
  name → displayName
  firstName → customProperties.firstName
  lastName → customProperties.lastName
  phoneNumber → customProperties.phone
  company → customProperties.company
  createdAt → createdAt
```

---

## Type: `crm_organization`

### Description
Represents a company/business in the CRM. B2B clients, partners, vendors.

### Status Values
- `active` - Active organization
- `prospect` - Potential client
- `archived` - No longer active

### Custom Properties
```typescript
{
  name: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  taxId?: string;
  vatNumber?: string;
  addresses?: {
    billing?: Address;
    shipping?: Address;
  };
  primaryContactId?: Id<"objects">;
  annualRevenue?: number;
  notes?: string;
}
```

### Detection Patterns

**Model Name Matches:**
- `company`, `Company`
- `organization`, `Organization`
- `business`, `Business`
- `client`, `Client`
- `account`, `Account`
- `vendor`, `Vendor`
- `partner`, `Partner`

**Field Indicators:**
- `companyName`, `name`
- `taxId`, `vatNumber`, `ein`
- `website`, `url`
- `industry`
- `employees`, `employeeCount`

### Example Mapping

```yaml
External Model: Company
L4YERCAK3 Type: crm_organization
Confidence: 92%

Field Mappings:
  name → displayName
  website → customProperties.website
  taxId → customProperties.taxId
  industry → customProperties.industry
```

---

## Type: `event`

### Description
Represents gatherings - conferences, workshops, webinars, meetups.

### Subtypes
- `conference` - Multi-day conference
- `workshop` - Interactive session
- `webinar` - Online event
- `meetup` - Informal gathering
- `concert` - Performance event

### Status Values
- `draft` - Not yet published
- `published` - Open for registration
- `in_progress` - Currently happening
- `completed` - Event finished
- `cancelled` - Event cancelled

### Custom Properties
```typescript
{
  startDate: string;         // ISO 8601
  endDate: string;
  timezone?: string;
  location?: string;
  venue?: {
    name: string;
    address: Address;
    coordinates?: { lat: number; lng: number };
  };
  isOnline?: boolean;
  onlineUrl?: string;
  capacity?: number;
  registeredCount?: number;
  description?: string;
  agenda?: AgendaItem[];
  sponsors?: Sponsor[];
  speakers?: Speaker[];
  imageUrl?: string;
}
```

### Detection Patterns

**Model Name Matches:**
- `event`, `Event`
- `conference`, `Conference`
- `workshop`, `Workshop`
- `webinar`, `Webinar`
- `meetup`, `Meetup`
- `session`, `Session`

**Field Indicators:**
- `startDate`, `startTime`, `eventDate`
- `endDate`, `endTime`
- `location`, `venue`
- `capacity`, `maxAttendees`

### Example Mapping

```yaml
External Model: Event
L4YERCAK3 Type: event
Confidence: 100%

Field Mappings:
  title → displayName
  startDate → customProperties.startDate
  endDate → customProperties.endDate
  venue → customProperties.location
  maxCapacity → customProperties.capacity
```

---

## Type: `product`

### Description
Sellable items - tickets, physical goods, digital products, services.

### Subtypes
- `ticket` - Event ticket
- `physical` - Physical goods
- `digital` - Digital download/access
- `service` - Service offering
- `subscription` - Recurring product

### Status Values
- `draft` - Not yet available
- `active` - Available for purchase
- `sold_out` - No inventory
- `archived` - Discontinued

### Custom Properties
```typescript
{
  price: number;             // In cents
  currency: string;          // "EUR", "USD"
  quantity?: number;         // -1 for unlimited
  sold?: number;
  description?: string;
  images?: string[];
  sku?: string;
  taxCategory?: string;
  taxRate?: number;
  linkedEventId?: Id<"objects">;
  variants?: ProductVariant[];
  formId?: Id<"objects">;    // Registration form
}
```

### Detection Patterns

**Model Name Matches:**
- `product`, `Product`
- `item`, `Item`
- `sku`, `SKU`
- `offering`, `Offering`
- `service`, `Service`
- `ticket`, `Ticket` (maps to product with subtype="ticket")

**Field Indicators:**
- `price`, `amount`, `cost`
- `currency`
- `quantity`, `stock`, `inventory`
- `sku`, `productCode`

### Example Mapping

```yaml
External Model: Product
L4YERCAK3 Type: product
Confidence: 98%

Field Mappings:
  name → displayName
  priceInCents → customProperties.price
  stockCount → customProperties.quantity
  productCode → customProperties.sku
```

---

## Type: `ticket`

### Description
Event access ticket - issued after purchase, contains QR code.

### Status Values
- `valid` - Can be used
- `redeemed` - Already used/checked-in
- `cancelled` - Cancelled ticket
- `expired` - Past validity date

### Custom Properties
```typescript
{
  qrCode: string;            // Unique scannable code
  productId: Id<"objects">;
  eventId: Id<"objects">;
  attendeeName: string;
  attendeeEmail: string;
  purchasedAt: number;
  validFrom?: string;
  validUntil?: string;
  checkedIn?: boolean;
  checkedInAt?: number;
  checkedInBy?: Id<"users">;
  seatNumber?: string;
  registrationData?: Record<string, any>;
  pdfUrl?: string;
}
```

### Detection Patterns

**Model Name Matches:**
- `ticket`, `Ticket`
- `registration`, `Registration`
- `booking`, `Booking`
- `rsvp`, `RSVP`
- `admission`, `Admission`

**Field Indicators:**
- `qrCode`, `barcode`, `ticketCode`
- `eventId`, `event`
- `attendee`, `holder`
- `checkedIn`, `redeemed`

---

## Type: `invoice`

### Description
B2B/B2C invoice for billing.

### Status Values
- `draft` - Can be edited
- `sealed` - Locked, assigned number
- `sent` - Sent to client
- `paid` - Full payment received
- `partially_paid` - Partial payment
- `overdue` - Past due date
- `void` - Cancelled

### Custom Properties
```typescript
{
  invoiceNumber: string;
  clientId: Id<"objects">;   // Contact or CRM org
  clientName: string;
  clientEmail: string;
  clientAddress?: Address;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
  }[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;      // "net30", "net60", "due_on_receipt"
  paidAmount?: number;
  paidAt?: number;
  notes?: string;
  pdfUrl?: string;
  stripeInvoiceId?: string;
}
```

### Detection Patterns

**Model Name Matches:**
- `invoice`, `Invoice`
- `bill`, `Bill`
- `receipt`, `Receipt`

**Field Indicators:**
- `invoiceNumber`, `billNumber`
- `lineItems`, `items`
- `dueDate`, `paymentDue`
- `totalAmount`, `grandTotal`

---

## Type: `transaction`

### Description
Financial transaction record (from checkout).

### Subtypes
- `ticket_purchase` - Event ticket
- `product_purchase` - Product sale
- `service` - Service payment
- `subscription` - Recurring payment

### Status Values
- `pending` - Awaiting payment
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Money returned
- `invoiced` - Linked to invoice

### Custom Properties
```typescript
{
  lineItems: {
    productId: Id<"objects">;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxAmount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  paymentMethod: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  invoiceId?: Id<"objects">;
}
```

### Detection Patterns

**Model Name Matches:**
- `transaction`, `Transaction`
- `payment`, `Payment`
- `order`, `Order`
- `purchase`, `Purchase`
- `sale`, `Sale`

---

## Type: `form`

### Description
Data collection form (registration, survey, application).

### Subtypes
- `registration` - Event/product registration
- `survey` - Feedback/research
- `application` - Job/grant application
- `contact` - Contact form

### Status Values
- `draft` - Not accepting responses
- `published` - Accepting responses
- `archived` - Closed

### Custom Properties
```typescript
{
  fields: {
    id: string;
    type: string;           // "text", "email", "select", "checkbox", etc.
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];     // For select/radio/checkbox
    validation?: {
      pattern?: string;
      min?: number;
      max?: number;
    };
    conditionalDisplay?: {
      dependsOn: string;
      showWhen: any;
    };
  }[];
  responseCount?: number;
  linkedProductId?: Id<"objects">;
  linkedEventId?: Id<"objects">;
  confirmationMessage?: string;
  notifyEmail?: string;
}
```

### Detection Patterns

**Model Name Matches:**
- `form`, `Form`
- `survey`, `Survey`
- `questionnaire`, `Questionnaire`
- `application`, `Application`

---

## Type: `form_response`

### Description
Submitted form data.

### Status Values
- `partial` - Incomplete submission
- `complete` - Full submission
- `abandoned` - Started but not completed

### Custom Properties
```typescript
{
  formId: Id<"objects">;
  responses: Record<string, any>;
  submittedAt: number;
  submittedBy?: Id<"objects">;  // Contact if known
  ipAddress?: string;
  userAgent?: string;
}
```

---

## Type: `project`

### Description
Client project with milestones and tasks.

### Status Values
- `draft` - Planning phase
- `active` - In progress
- `on_hold` - Paused
- `completed` - Finished
- `cancelled` - Abandoned

### Custom Properties
```typescript
{
  clientId: Id<"objects">;   // Contact or CRM org
  clientName: string;
  description?: string;
  budget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;         // 0-100
  milestones?: {
    id: string;
    name: string;
    status: string;
    dueDate?: string;
    completedAt?: number;
  }[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    assigneeId?: Id<"users">;
    dueDate?: string;
    priority: string;
  }[];
  teamMembers?: {
    userId: Id<"users">;
    role: string;
  }[];
}
```

### Detection Patterns

**Model Name Matches:**
- `project`, `Project`
- `campaign`, `Campaign`
- `engagement`, `Engagement`
- `job`, `Job`

---

## Type: `template`

### Description
Reusable templates for PDFs, emails, pages.

### Subtypes
- `ticket_pdf` - Ticket PDF
- `invoice_pdf` - Invoice PDF
- `email` - Email template
- `sms` - SMS template
- `landing_page` - Web page

### Custom Properties
```typescript
{
  // For email
  subject?: string;
  htmlContent?: string;
  textContent?: string;

  // For PDF
  htmlTemplate?: string;
  cssStyles?: string;

  // Common
  variables: string[];       // Available merge fields
  previewImageUrl?: string;
}
```

---

## Type: `workflow`

### Description
Automation workflow with triggers and actions.

### Status Values
- `draft` - Not active
- `active` - Running
- `paused` - Temporarily disabled

### Custom Properties
```typescript
{
  trigger: {
    type: string;           // "contact_created", "form_submitted", etc.
    conditions?: Record<string, any>;
  };
  actions: {
    type: string;           // "send_email", "create_contact", etc.
    config: Record<string, any>;
    delay?: number;         // Minutes to wait
  }[];
  lastRunAt?: number;
  runCount?: number;
}
```

---

## Type: `page` (Web Publishing)

### Description
Published web page/portal.

### Subtypes
- `freelancer_portal` - Client portal
- `landing_page` - Marketing page
- `checkout_page` - Payment page
- `event_page` - Event info page

### Status Values
- `draft` - Not published
- `published` - Live
- `archived` - Taken down

### Custom Properties
```typescript
{
  slug: string;
  publicUrl: string;
  templateCode: string;
  themeCode: string;
  content: Record<string, any>;
  customCss?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  analyticsEnabled?: boolean;
  viewCount?: number;
}
```

---

## Type: `certificate`

### Description
Achievement/completion certificate.

### Status Values
- `issued` - Active certificate
- `revoked` - Invalidated

### Custom Properties
```typescript
{
  recipientId: Id<"objects">;  // Contact
  recipientName: string;
  title: string;
  description: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber: string;
  verificationUrl: string;
  pdfUrl?: string;
  linkedEventId?: Id<"objects">;
  linkedProductId?: Id<"objects">;
}
```

---

## Type: `benefit`

### Description
Membership/community benefit.

### Status Values
- `active` - Available
- `inactive` - Not available
- `archived` - Removed

### Custom Properties
```typescript
{
  title: string;
  description: string;
  category: string;
  redemptionInstructions?: string;
  partnerName?: string;
  partnerUrl?: string;
  discountCode?: string;
  discountPercentage?: number;
  validFrom?: string;
  validUntil?: string;
  imageUrl?: string;
}
```

---

## Mapping Confidence Calculation

The CLI calculates mapping confidence based on:

1. **Name Match Score (40%)**
   - Exact match: 100
   - Case-insensitive match: 90
   - Plural/singular variant: 85
   - Partial match: 60

2. **Field Presence Score (40%)**
   - Each indicator field present: +20
   - Required field (e.g., email for contact): +30
   - Cap at 100

3. **Type Compatibility Score (20%)**
   - Field types align with expected: +10 each
   - Cap at 100

**Final Score = (Name * 0.4) + (Fields * 0.4) + (Types * 0.2)**

**Thresholds:**
- 90%+ : Auto-accept
- 70-89%: Suggest with confirmation
- 50-69%: Show as option
- <50%: Custom mapping required

---

## Custom Mapping

For models that don't match standard patterns:

```yaml
# .l4yercak3/mappings.yaml

mappings:
  - localModel: Subscription
    layerCakeType: product
    subtype: subscription
    confidence: manual
    fieldMappings:
      planName: displayName
      monthlyPrice: customProperties.price
      features: customProperties.description
      status: status
    transforms:
      monthlyPrice: "value * 100"  # Convert to cents
```

---

*Document Version: 1.0*
*Last Updated: January 2025*
