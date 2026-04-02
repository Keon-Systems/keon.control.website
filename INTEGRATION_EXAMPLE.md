# Integration Example: Using Team Alpha's API Infrastructure

Quick guide for Teams Bravo and Charlie on how to use the new API substrate.

## Basic Pattern

### 1. Import What You Need

```typescript
import { useApi } from '@/lib/state';
import { listReceipts, getExecution } from '@/lib/api';
import { mockReceipts, mockExecutions } from '@/lib/mock-data';
```

### 2. Use the `useApi` Hook

```typescript
function MyComponent() {
  const { data, isLoading, error, isUsingMock, refetch } = useApi({
    // Function to fetch from API
    fetcher: () => listReceipts({
      correlationId: 'abc-123',
      tenantId: 'tenant-1',
      limit: 50
    }),

    // Fallback data when API is unavailable
    mockData: { items: mockReceipts, nextPageToken: null },

    // Optional: Auto-refresh every 30 seconds
    refetchInterval: 30000,

    // Optional: Callbacks
    onSuccess: (data) => console.log('Loaded:', data),
    onError: (error) => console.error('Failed:', error),
  });

  // Handle states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      {/* Show indicator when using mock data */}
      {isUsingMock && (
        <div className="bg-yellow-500 p-2 mb-4">           
          ⚠️ Using mock data - API unavailable
        </div>
      )}

      {/* Your UI */}
      {data.items.map(receipt => (
        <div key={receipt.receiptId}>
          {receipt.receiptId}
        </div>
      ))}
    </div>
  );
}
```

## Real-World Examples

### Example 1: Receipts Table with Live Updates

```typescript
'use client';

import { useApi } from '@/lib/state';
import { listReceipts } from '@/lib/api';
import { mockReceipts } from '@/lib/mock-data';

export function ReceiptsTable({ correlationId }: { correlationId: string }) {
  const { data, isLoading, error, isUsingMock } = useApi({
    fetcher: () => listReceipts({ correlationId }),
    mockData: { items: mockReceipts, nextPageToken: null },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) return <div>Loading receipts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {isUsingMock && (
        <div className="border border-yellow-500 bg-yellow-500/10 p-3 mb-4">
          ⚠️ Demo Mode - Using mock data
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Kind</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((receipt) => (
            <tr key={receipt.receiptId}>
              <td>{receipt.receiptId}</td>
              <td>{receipt.kind}</td>
              <td>{new Date(receipt.timestampUtc).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 2: Execution Details with Manual Refresh

```typescript
'use client';

import { useApi } from '@/lib/state';
import { getExecution } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ExecutionDetails({
  executionId,
  correlationId
}: {
  executionId: string;
  correlationId: string;
}) {
  const { data, isLoading, error, refetch } = useApi({
    fetcher: () => getExecution({ executionId, correlationId }),
    mockData: {
      executionId,
      link: { tenantId: 'mock-tenant', correlationId },
      timing: { startedAt: new Date().toISOString() },
      status: 'running',
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2>Execution: {executionId}</h2>
        <Button onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && <div className="text-red-500">Error: {error.message}</div>}

      {data && (
        <div>
          <p>Status: {data.status}</p>
          <p>Started: {new Date(data.timing.startedAt).toLocaleString()}</p>
          {data.timing.completedAt && (
            <p>Completed: {new Date(data.timing.completedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Incident Mode Integration (Team Bravo)

```typescript
'use client';

import { useApi } from '@/lib/state';
import { getSpine, listReceipts } from '@/lib/api';
import type { ReceiptSpine } from '@/lib/api';

export function IncidentGraph({ incidentId }: { incidentId: string }) {
  // Fetch the receipt spine (graph) for this incident
  const { data: spine, isLoading, error } = useApi({
    fetcher: () => getSpine({ correlationId: incidentId }),
    mockData: {
      correlationId: incidentId,
      nodes: [],
    } as ReceiptSpine,
  });

  // Fetch receipts for details
  const { data: receipts } = useApi({
    fetcher: () => listReceipts({
      correlationId: incidentId,
      limit: 100,
    }),
    mockData: { items: [], nextPageToken: null },
  });

  if (isLoading) return <div>Loading incident graph...</div>;
  if (error) return <div>Failed to load incident: {error.message}</div>;

  return (
    <div>
      <h3>Incident: {incidentId}</h3>
      <p>Nodes: {spine?.nodes.length || 0}</p>
      <p>Receipts: {receipts?.items.length || 0}</p>

      {/* Render your incident visualization */}
      <IncidentVisualization spine={spine} receipts={receipts} />
    </div>
  );
}
```

### Example 4: Search/Filter with Pagination (Team Charlie)

```typescript
'use client';

import { useState } from 'react';
import { usePaginatedApi } from '@/lib/state';
import { listExecutions } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ExecutionsList({ correlationId }: { correlationId: string }) {
  const [tenantFilter, setTenantFilter] = useState<string | undefined>();

  const {
    items,
    isLoading,
    error,
    hasMore,
    loadMore,
    isUsingMock
  } = usePaginatedApi({
    fetcher: () => listExecutions({
      correlationId,
      tenantId: tenantFilter,
      limit: 20,
    }),
    mockData: { items: [], nextPageToken: null },
  });

  return (
    <div>
      {isUsingMock && (
        <div className="bg-yellow-500 p-2 mb-4">⚠️ Using mock data</div>
      )}

      {/* Filter controls */}
      <input
        placeholder="Filter by tenant ID"
        value={tenantFilter || ''}
        onChange={(e) => setTenantFilter(e.target.value || undefined)}
      />

      {/* Results */}
      {items.map((execution) => (
        <div key={execution.executionId}>
          {execution.executionId} - {execution.status}
        </div>
      ))}

      {/* Load more button */}
      {hasMore && (
        <Button onClick={loadMore} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </Button>
      )}

      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

## Error Handling

### Handle Specific Errors

```typescript
import { NetworkError, NotFoundError, ApiError } from '@/lib/api';

const { data, error } = useApi({
  fetcher: () => getReceipt({ receiptId: 'xyz', correlationId: 'abc' }),
  mockData: mockReceiptData,
});

if (error) {
  if (error instanceof NotFoundError) {
    return <div>Receipt not found</div>;
  } else if (error instanceof NetworkError) {
    return <div>Network error - check backend</div>;
  } else if (error instanceof ApiError) {
    return <div>API error: {error.statusCode}</div>;
  }
}
```

### Direct API Calls (Outside React)

```typescript
import { getExecution, parseApiError } from '@/lib/api';

async function fetchExecutionData() {
  try {
    const execution = await getExecution({
      executionId: 'exec-123',
      correlationId: 'corr-456',
    });
    console.log('Execution:', execution);
  } catch (err) {
    const error = parseApiError(err);
    console.error('Failed:', error.message);
  }
}
```

## Global App State

Access global state anywhere:

```typescript
import { useAppState } from '@/lib/state';

function MyComponent() {
  const {
    tenantId,
    liveMode,
    systemMetrics,
    isLoading,
    error,
    setTenantId,
    setSystemMetrics,
    setError,
  } = useAppState();

  return (
    <div>
      <p>Current Tenant: {tenantId || 'None'}</p>
      <p>Mode: {liveMode ? 'Live' : 'Mock'}</p>
      <button onClick={() => setTenantId('new-tenant')}>
        Switch Tenant
      </button>
    </div>
  );
}
```

## Testing Tips

### Test with Backend

```bash
# Terminal 1: Start backend
cd src/Keon.Control.API
dotnet run

# Terminal 2: Frontend in live mode
cd src/Keon.Control.Website
echo "NEXT_PUBLIC_API_LIVE_MODE=true" > .env.local
npm run dev
```

### Test with Mocks

```bash
cd src/Keon.Control.Website
npm run dev
# No .env.local needed - defaults to mock mode
```

### Test Fallback Behavior

```bash
# Start frontend in live mode WITHOUT backend
cd src/Keon.Control.Website
echo "NEXT_PUBLIC_API_LIVE_MODE=true" > .env.local
npm run dev

# App should fallback to mocks gracefully
```

## Need Help?

- **API Client Docs**: `src/lib/api/README.md`
- **Team Alpha Deliverable**: `TEAM_ALPHA_DELIVERABLE.md`
- **Questions**: Ask Team Alpha

## Common Patterns

### Pattern: Conditional Fetching

```typescript
const { data } = useApi({
  fetcher: () => listReceipts({ correlationId }),
  mockData: { items: [] },
  enabled: Boolean(correlationId), // Only fetch if correlationId exists
});
```

### Pattern: Dependent Queries

```typescript
// First query
const { data: execution } = useApi({
  fetcher: () => getExecution({ executionId, correlationId }),
  mockData: mockExecution,
});

// Second query depends on first
const { data: trace } = useApi({
  fetcher: () => getExecutionTrace({ executionId, correlationId }),
  mockData: [],
  enabled: Boolean(execution), // Only fetch after execution loads
});
```

### Pattern: Optimistic Updates (Future)

```typescript
const { data, refetch } = useApi({
  fetcher: () => listReceipts({ correlationId }),
  mockData: { items: mockReceipts },
});

async function handleAction() {
  // Perform action
  await someApiCall();

  // Immediately refresh data
  await refetch();
}
```

---

Happy integrating! 🚀
