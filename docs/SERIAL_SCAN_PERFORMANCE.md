# Serial / barcode scan performance (wholesale)

## Current bottlenecks

1. **Two API calls per in-stock serial**  
   For serial-like input we call `getFindBySerial` (sold check) first; it returns 404 when not sold. Then we call `getFindInStockSerial`. So every successful add = 2 round trips.

2. **Blocking UI**  
   The input waits for the full API + add-to-cart before clearing and refocusing. With 100+ serials you scan one, wait, then the next.

3. **Scanner timing**  
   Barcode scanners send characters + Enter very fast. React state updates are async, so `value` in the handler can be stale and the submitted term may be wrong or incomplete.

4. **Backend**  
   - No index on `Purchase.items.imeis` → full collection scan to find by serial.  
   - Three separate DB queries for “sold?” checks (SoldSerial, SerialHistory, SoldSerial returned-to-supplier) before the main Purchase lookup.

## Implemented (this pass)

- **In-stock first**: For serial-like input, call `getFindInStockSerial` first. If found, add to cart (1 round trip). Only call `getFindBySerial` when in-stock returns 404, to show “Already sold”.
- **Non-blocking submit**: On Enter we clear the input and refocus immediately, then run the add in the background. User can scan the next serial without waiting.
- **Scanner-safe value**: On Enter we submit `inputRef.current.value` (and trim) so we don’t rely on React state and avoid missing characters when the scanner fires quickly.
- **Backend index**: Index on `items.imeis` for the Purchase model so find-by-serial uses an index.
- **Backend parallel sold checks**: Run the three “sold?” lookups in parallel with `Promise.all` to cut latency.

## Further options (if still slow)

- **Batch endpoint**: `POST /api/purchases/find-in-stock-serials` with `{ serials: string[] }`. Frontend buffers e.g. 5–10 serials (or 100–200 ms) and sends one request; backend returns results for all; frontend adds all to cart. Best for paste lists and very fast scanning.
- **Dedicated scanner input**: A hidden input that only receives scanner data (no typeahead), so no filtering or suggestion logic runs on each keystroke.
- **Backend caching**: Cache “in stock” serial lookups (e.g. Redis or in-memory) with short TTL to avoid hitting the DB on every repeat scan in a session.
