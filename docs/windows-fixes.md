# Windows PowerShell Compatibility Fixes

## Problem

The default Claude Flow hooks used Unix/Linux commands (`cat`, `jq`, `tr`, `xargs`) that are not available in Windows PowerShell by default, causing "'cat' is not recognized" errors.

## Solution

Replaced Unix command pipelines with cross-platform Node.js helper scripts.

## Changes Made

### 1. Created Node.js Helper Scripts

All helper scripts are located in `.claude/helpers/`:

#### `pre-bash-hook.js`

- **Replaces**: `cat | jq -r '.tool_input.command' | xargs npx claude-flow hooks pre-command`
- **Function**: Validates bash commands before execution
- **Features**:
  - Reads JSON from stdin
  - Extracts command from tool_input
  - Calls `npx claude-flow@alpha hooks pre-command` with validation
  - 5-second timeout for safety
  - Silent fail on errors (doesn't break workflow)

#### `pre-edit-hook.js`

- **Replaces**: `cat | jq -r '.tool_input.file_path' | xargs npx claude-flow hooks pre-edit`
- **Function**: Prepares file editing operations
- **Features**:
  - Extracts file_path from tool input
  - Auto-assigns agents by file type
  - Loads context from memory
  - Cross-platform compatible

#### `post-bash-hook.js`

- **Replaces**: `cat | jq -r '.tool_input.command' | xargs npx claude-flow hooks post-command`
- **Function**: Tracks bash command execution
- **Features**:
  - Stores command results
  - Tracks performance metrics
  - Updates memory database

#### `post-edit-hook.js`

- **Replaces**: `cat | jq -r '.tool_input.file_path' | xargs npx claude-flow hooks post-edit`
- **Function**: Post-processes file edits
- **Features**:
  - Auto-formats code (if formatters available)
  - Updates memory with changes
  - Trains neural patterns

#### `pre-compact-hook.js`

- **Replaces**: `/bin/bash -c 'INPUT=$(cat); CUSTOM=$(echo "$INPUT" | jq ...)...'`
- **Function**: Provides guidance before context compaction
- **Features**:
  - Reminds about available agents
  - Shows GOLDEN RULE for concurrent execution
  - Cross-platform messaging

### 2. Updated `.claude/settings.json`

Changed all hook commands from Unix pipelines to Node.js scripts:

**Before:**

```json
"command": "cat | jq -r '.tool_input.command // empty' | tr '\\n' '\\0' | xargs -0 -I {} npx claude-flow@alpha hooks pre-command --command '{}' --validate-safety true --prepare-resources true"
```

**After:**

```json
"command": "node .claude/helpers/pre-bash-hook.js"
```

## Benefits

### ✅ Cross-Platform Compatibility

- Works on Windows PowerShell
- Works on Windows CMD
- Works on Linux/macOS
- Works in WSL
- Works in Git Bash

### ✅ No External Dependencies

- Uses Node.js (already required by Claude Flow)
- No need to install `jq`, `cat`, `xargs` separately
- No need for Unix-like environments

### ✅ Maintains Full Functionality

- All hook features preserved
- Same validation and safety checks
- Same memory and metrics tracking
- Same auto-formatting capabilities

### ✅ Error Handling

- Silent failures don't break workflows
- Timeouts prevent hanging
- Graceful degradation on errors

## Testing

### Test Pre-Bash Hook

```bash
# Should validate command and not throw errors
npx claude-flow@alpha hooks pre-command --command "npm test" --validate-safety true
```

### Test Pre-Edit Hook

```bash
# Should assign appropriate agent for file type
npx claude-flow@alpha hooks pre-edit --file "src/server.js" --auto-assign-agents true
```

### Test Post-Edit Hook

```bash
# Should update memory after edit
npx claude-flow@alpha hooks post-edit --file "src/server.js" --update-memory true
```

### Verify Hooks Work End-to-End

Create a test file and verify hooks execute:

```bash
# This should trigger pre-edit and post-edit hooks
echo "console.log('test')" > test.js
# Check .swarm/memory.db for stored results
```

## Troubleshooting

### If hooks still don't work:

1. **Verify Node.js is installed**:

   ```bash
   node --version
   # Should show v16+ or higher
   ```

2. **Check helper scripts exist**:

   ```bash
   ls .claude/helpers
   # Should show: pre-bash-hook.js, pre-edit-hook.js, post-bash-hook.js, post-edit-hook.js, pre-compact-hook.js
   ```

3. **Test helper scripts directly**:

   ```bash
   echo '{"tool_input":{"command":"echo test"}}' | node .claude/helpers/pre-bash-hook.js
   ```

4. **Check permissions** (Linux/macOS):

   ```bash
   chmod +x .claude/helpers/*.js
   ```

5. **Verify settings.json syntax**:
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf8')))"
   ```

## Alternative: Disable Hooks Temporarily

If you need to disable hooks while troubleshooting:

```json
{
  "env": {
    "CLAUDE_FLOW_HOOKS_ENABLED": "false"
  }
}
```

Or comment out specific hooks:

```json
{
  "hooks": {
    // "PreToolUse": [...],  // Commented out
    "PostToolUse": [...]
  }
}
```

## References

- **GitHub Issue**: [claude-flow#387](https://github.com/ruvnet/claude-flow/issues/387) - Windows compatibility
- **Original Unix commands**: Used Bash pipelines with `cat`, `jq`, `tr`, `xargs`
- **Node.js approach**: Cross-platform using `child_process.spawn` and JSON parsing

## Migration Notes

If you have custom hooks in your settings.json:

1. **Create a helper script** in `.claude/helpers/your-hook.js`
2. **Use Node.js** for JSON parsing instead of `jq`
3. **Use `spawn`** instead of `xargs` for command execution
4. **Add timeout** for safety (5 seconds recommended)
5. **Handle errors gracefully** with try-catch and `process.exit(0)`

## Success Indicators

When hooks are working correctly, you should see:

- ✅ No "'cat' is not recognized" errors
- ✅ Hook commands execute without delays
- ✅ Memory database gets updated (check `.swarm/memory.db`)
- ✅ Metrics tracked in hook execution
- ✅ Auto-formatting works on file edits

---

**Status**: ✅ Windows compatibility FIXED with Node.js helper scripts!
