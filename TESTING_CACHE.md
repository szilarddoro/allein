# Testing the LRU Cache

This document explains how to test the completion cache in the allein markdown editor.

## Automated Tests

Run the test suite:
```bash
pnpm vitest src/pages/editor/completion/CompletionCache.test.ts
```

## Manual Testing in the App

### Test 1: Basic Cache Hit
**Goal:** Verify that repeated phrases are cached

1. Start the app: `pnpm tauri dev`
2. Open a markdown file
3. Type: "The quick brown"
4. Wait for completion (will hit Ollama - should see glowing border in DEV mode)
5. Accept the completion (press Tab)
6. **Clear the line** (select all and delete)
7. Type: "The quick brown" again
8. **Expected:** Completion appears instantly (no glowing border, no delay)
9. **Verify:** Check browser console for cache hit logs (if we add them)

### Test 2: Prefix Matching
**Goal:** Verify that typing more matches cached prefixes

1. Type: "hello w" and get completion "orld"
2. Accept it so line reads "hello world"
3. Clear the line
4. Type: "hello wo"
5. **Expected:** Should get "rld" instantly (remaining part)
6. Type one more letter: "hello wor"
7. **Expected:** Should get "ld" instantly

### Test 3: Case Insensitivity
**Goal:** Verify cache matches regardless of case

1. Type: "The Quick Brown" (mixed case)
2. Get and accept completion
3. Clear line
4. Type: "the quick brown" (all lowercase)
5. **Expected:** Should get cached completion instantly

### Test 4: LRU Eviction (Harder to Test)
**Goal:** Verify old entries are evicted

1. Type 500+ unique phrases (cache capacity)
2. The first few phrases should eventually be evicted
3. Retyping evicted phrases should hit Ollama again

### Test 5: Cache Persistence Across Files
**Goal:** Verify cache is shared across documents

1. In File A: Type "The quick brown" and get completion
2. Switch to File B
3. Type "The quick brown"
4. **Expected:** Should get cached completion instantly

## Debugging Cache

### Add Console Logging

Add temporary logging to see cache behavior:

```typescript
// In useInlineCompletion.ts, after cache check:
const cachedCompletion = cache.get(textBeforeCursor)
console.log('Cache lookup:', {
  prefix: textBeforeCursor,
  hit: !!cachedCompletion,
  completion: cachedCompletion,
})
```

### Check Cache Size

Add to browser console:
```javascript
// In dev tools console
window.__completionCache = cache
window.__completionCache.size() // Check how many entries
```

## Expected Behavior

✅ **Cache Hit:**
- Instant suggestion (no loading indicator)
- No Ollama API call
- Feels instantaneous

❌ **Cache Miss:**
- 350ms debounce delay
- Loading indicator (glowing border in DEV)
- Ollama API call
- Result is cached for next time

## Performance Benchmarks

With cache:
- **First completion:** ~1-2 seconds (Ollama API call)
- **Subsequent same completion:** <10ms (instant)
- **Memory usage:** ~50KB for 500 entries

Without cache:
- **Every completion:** ~1-2 seconds (Ollama API call)

## Common Issues

**Issue:** Cache not working
- Check if `getCompletionCache()` is being called
- Verify `cache.put()` is called after successful completions
- Check prefix normalization (trim, lowercase)

**Issue:** Wrong completions
- Cache might return outdated completions
- Solution: Clear cache or restart app
- Future: Add TTL (time-to-live) for entries
