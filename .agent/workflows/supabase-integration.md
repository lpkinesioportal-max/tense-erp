---
description: Rules for using Supabase as the primary data layer
---

# Supabase Integration Rules for TENSE ERP

## Overview
This project uses **Supabase (PostgreSQL)** as the primary database. All new features MUST use Supabase for data persistence. LocalStorage is only used as a fallback/cache layer.

## Environment Variables
Required environment variables (must exist in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations

## Client Usage

### Client-Side (React Components)
Use the shared Supabase client from `@/lib/supabase-client`:
```typescript
import { supabase } from '@/lib/supabase-client'

const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

### Server-Side (Server Actions, API Routes)
Use the SSR client from `@/lib/supabase-server`:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function myServerAction() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from('table_name').select('*')
}
```

## Data Layer Architecture

### Hierarchy
1. **Supabase (Primary)** - Source of truth for all data
2. **React Context (Runtime)** - In-memory state for UI reactivity
3. **LocalStorage (Fallback)** - Offline cache, sync when online

### Sync Strategy
- On app load: Fetch from Supabase → Update React Context
- On data change: Update Supabase → Update React Context → Cache to localStorage
- On Supabase failure: Fall back to localStorage data

## Table Naming Convention
- Use **snake_case** for table and column names
- Prefix with domain: `tense_` (e.g., `tense_professionals`, `tense_appointments`)
- Use plural for table names

## Core Tables (to be created)
| Entity | Table Name | Priority |
|--------|------------|----------|
| Professionals | `tense_professionals` | HIGH |
| Clients | `tense_clients` | HIGH |
| Users | `tense_users` | HIGH |
| Appointments | `tense_appointments` | HIGH |
| Transactions | `tense_transactions` | MEDIUM |
| Settlements | `tense_settlements` | MEDIUM |
| Products | `tense_products` | LOW |
| ServiceConfigs | `tense_service_configs` | LOW |

## Error Handling
Always handle Supabase errors gracefully:
```typescript
const { data, error } = await supabase.from('table').select('*')
if (error) {
  console.error('Supabase error:', error.message)
  // Fallback to localStorage
  return loadFromLocalStorage('key')
}
return data
```

## Row Level Security (RLS)
- All tables MUST have RLS enabled
- Use policies based on authenticated user or service role
- Test policies before deployment

## Migration Process
When migrating an entity from localStorage to Supabase:
1. Create the table in Supabase (use SQL migration scripts in `/scripts/`)
2. Add the Supabase client calls to `data-context.tsx`
3. Keep localStorage as fallback
4. Test thoroughly before removing localStorage dependency
