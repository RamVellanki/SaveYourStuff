# 🚨 CRITICAL RULES - READ FIRST 🚨

## Git Workflow (MANDATORY - NEVER IGNORE)

### ⚠️ BEFORE STARTING ANY TASK:
1. **NEVER make changes directly to main branch**
2. **ALWAYS create feature branch first**: `git checkout -b feature/[descriptive-name]`
3. **Work on feature branch only**
4. **Get user approval BEFORE merging to main**

### 📋 Feature Development Checklist:
- ☐ Create feature branch: `git checkout -b feature/[name]`
- ☐ Make all changes on feature branch
- ☐ Commit progress regularly to feature branch
- ☐ Build and test on feature branch
- ☐ **Run all BDD financial tests before merge** (MANDATORY)
- ☐ **All tests must pass before merge** (CRITICAL)
- ☐ **Run database validation after any DB changes** (REQUIRED)
- ☐ Get user approval for merge
- ☐ Merge to main only after approval
- ☐ Push to remote after merge

### 🏷️ Branch Naming Convention:
- New features: `feature/categories-management`
- Bug fixes: `fix/navigation-issue`
- Improvements: `improve/performance-optimization`

---

## Code Standards (MANDATORY)

### ✅ ALWAYS DO:
- Run `npm run build` before committing
- Follow existing code patterns and conventions
- Use TypeScript properly with correct types
- Test functionality before marking complete

### ❌ NEVER DO:
- Add comments unless explicitly requested
- Make direct changes to main branch
- Create new files unless absolutely necessary
- Ignore compilation errors
- Make assumptions about libraries - check if they exist first

---

## Task Management (MANDATORY)

### 📝 Use TodoWrite Tool for Complex Tasks:
- Break down multi-step tasks into todos
- Mark todos as in_progress when starting
- Mark completed immediately after finishing
- Track progress transparently

### ⚡ Response Template for New Features:
```
I'll implement [feature] by:
1. 🔄 Creating feature branch: git checkout -b feature/[name]
2. [implementation steps]
3. 🔍 Getting your approval before merging to main

Proceeding with step 1...
```

## Project Architecture
- Refer to /ARCHITECTURE.md file for detailed project architecture

## Guidelines
- Follow the guidelines from /GUIDLINES.md file
- Refer to /ARCHITECTURE.md file for detailed project architecture
