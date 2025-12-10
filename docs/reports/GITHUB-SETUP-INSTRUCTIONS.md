# GitHub Organization Setup Instructions

**Status:** Ready to Execute
**Prerequisites:** GitHub account with organization creation permissions
**Estimated Time:** 5-10 minutes

---

## Step 1: Authenticate GitHub CLI

The GitHub CLI (`gh`) is already installed on NODE0. You need to authenticate it with your GitHub account.

### Authentication Command

```bash
gh auth login
```

### Follow the Prompts

1. **What account do you want to log into?**
   - Select: `GitHub.com`

2. **What is your preferred protocol for Git operations?**
   - Select: `SSH` (recommended) or `HTTPS`

3. **Upload your SSH public key to your GitHub account?**
   - Select: `Yes` (if using SSH)
   - Or skip if you already have SSH keys configured

4. **How would you like to authenticate GitHub CLI?**
   - Select: `Login with a web browser` (easiest)
   - Or: `Paste an authentication token` (if you have a PAT)

5. **Copy the one-time code** displayed in terminal

6. **Press Enter to open browser** and paste the code

7. **Authorize GitHub CLI** in the browser

8. **Verification:**
   ```bash
   gh auth status
   ```
   Should show: "Logged in to github.com as [your-username]"

---

## Step 2: Create BIZRA Organization

Once authenticated, execute the automated organization setup script:

```bash
bash /c/BIZRA-NODE0/BIZRA-TOOLS/scripts/github-org-setup.sh
```

### What This Script Does

1. **Creates Organization** `bizra`
   - Display name: "BIZRA"
   - Description: "Complete AGI Ecosystem - 18.7x Compute Advantage"

2. **Creates 13 Public Repositories:**
   - bizra-apex (Core cognitive platform)
   - bizra-lab (Innovation hub)
   - bizra-intelligence (AI/ML platform)
   - bizra-blockchain (L1 blockchain)
   - bizra-os (Agentic OS)
   - bizra-seed (Foundation libraries)
   - bizra-poi (Proof-of-Impact protocol)
   - bizra-agent (Agent framework)
   - bizra-rag (HyperGraph RAG)
   - bizra-dag (BlockGraph DAG)
   - bizra-docs (Documentation)
   - bizra-devtools (Development tools)
   - bizra-web (Web interfaces)

3. **Sets Repository Metadata:**
   - Descriptions for each project
   - Homepage links (bizra.ai)
   - Public visibility

### Expected Output

```
========================================
  BIZRA GITHUB ORGANIZATION SETUP
========================================

[1/14] Creating GitHub organization: bizra
✓ Created organization

[2/14] Creating repository: bizra-apex (Core Platform)
✓ Created repository https://github.com/bizra/bizra-apex

[3/14] Creating repository: bizra-lab (Innovation Hub)
✓ Created repository https://github.com/bizra/bizra-lab

... (continues for all 13 repos)

========================================
  GITHUB SETUP COMPLETE!
========================================
```

---

## Step 3: Configure Git Remotes

For each of the 13 projects, add the GitHub remote:

```bash
cd /c/BIZRA-NODE0/BIZRA-PROJECTS

for dir in bizra-agent bizra-apex bizra-blockchain bizra-dag \
           bizra-devtools bizra-docs bizra-intelligence bizra-lab \
           bizra-os bizra-poi bizra-rag bizra-seed bizra-web; do
    echo "=== Configuring $dir ==="
    cd "$dir"
    git remote add origin git@github.com:bizra/$dir.git
    cd ..
done
```

### Verify Remotes

```bash
cd /c/BIZRA-NODE0/BIZRA-PROJECTS

for dir in bizra-*; do
    echo "=== $dir ==="
    cd "$dir"
    git remote -v
    cd ..
done
```

Expected output for each project:

```
origin  git@github.com:bizra/[project-name].git (fetch)
origin  git@github.com:bizra/[project-name].git (push)
```

---

## Step 4: Push All Projects to GitHub

Once remotes are configured, push all 13 projects:

```bash
cd /c/BIZRA-NODE0/BIZRA-PROJECTS

for dir in bizra-*; do
    echo "=== Pushing $dir ==="
    cd "$dir"
    git push -u origin main
    cd ..
done
```

### Expected Output (per project)

```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (5/5), 1.23 KiB | 1.23 MiB/s, done.
Total 5 (delta 0), reused 0 (delta 0), pack-reused 0
To github.com:bizra/[project-name].git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Step 5: Verify GitHub Organization

### Check Organization Page

Visit: https://github.com/bizra

Should show:

- Organization name: "BIZRA"
- Description: "Complete AGI Ecosystem - 18.7x Compute Advantage"
- 13 public repositories
- All repositories with proper descriptions

### Check Each Repository

All 13 repositories should have:

- ✅ README.md displayed on main page
- ✅ .gitignore file
- ✅ Initial commit visible
- ✅ Main branch as default
- ✅ Repository description
- ✅ Homepage link (bizra.ai)

---

## Troubleshooting

### Issue: "You are not logged into any GitHub hosts"

**Solution:**

```bash
gh auth login
```

Follow authentication steps above.

### Issue: "Organization already exists"

**Solution:**
Script handles this gracefully with message:

```
Organization may already exist
```

Continue with repository creation.

### Issue: "Repository already exists"

**Solution:**
Script handles this gracefully with message:

```
Repository may already exist
```

Skips to next repository.

### Issue: "Permission denied (publickey)"

**Solution:**

1. Generate SSH key:

   ```bash
   ssh-keygen -t ed25519 -C "bizra-node0@bizra.ai"
   ```

2. Add to SSH agent:

   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Add public key to GitHub:

   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy output and add to https://github.com/settings/keys
   ```

4. Verify:
   ```bash
   ssh -T git@github.com
   ```

### Issue: "Failed to create organization"

**Possible Causes:**

- Account doesn't have permission to create organizations
- Organization name already taken
- Billing/payment issue

**Solution:**

1. Verify account permissions at https://github.com/settings/organizations
2. Try alternative organization name
3. Contact GitHub support if needed

---

## Alternative: Manual Organization Creation

If automated script fails, create organization manually:

1. **Go to:** https://github.com/settings/organizations
2. **Click:** "New organization"
3. **Choose:** Free plan
4. **Organization name:** `bizra`
5. **Contact email:** your-email@domain.com
6. **Create organization**

Then create repositories manually or run script for repos only.

---

## Success Criteria

✅ GitHub CLI authenticated successfully
✅ Organization `bizra` created
✅ All 13 repositories created and public
✅ All repositories have descriptions
✅ All repositories have homepage links
✅ All local projects have remotes configured
✅ All projects pushed to GitHub
✅ All repositories show README.md on main page

---

## Next Steps After GitHub Setup

1. **Configure Organization Settings**
   - Add profile picture/logo
   - Set organization description
   - Configure organization homepage
   - Set up teams and permissions

2. **Configure Repository Settings**
   - Enable Issues, Discussions, Wiki as needed
   - Set up branch protection rules
   - Configure webhooks for CI/CD
   - Add repository topics/tags

3. **Set Up CI/CD Pipelines**
   - GitHub Actions workflows
   - Automated testing
   - Deployment pipelines
   - Code quality checks

4. **Begin Day 3 Execution**
   - Execute WEEK1-DAY3-PLAN.md
   - Data organization
   - ARC-AGI dataset download
   - Integration testing

---

## Quick Reference Commands

```bash
# Authenticate GitHub CLI
gh auth login

# Create organization and repositories
bash /c/BIZRA-NODE0/BIZRA-TOOLS/scripts/github-org-setup.sh

# Configure all remotes
cd /c/BIZRA-NODE0/BIZRA-PROJECTS
for dir in bizra-*; do cd "$dir" && git remote add origin git@github.com:bizra/$dir.git && cd ..; done

# Push all projects
for dir in bizra-*; do cd "$dir" && git push -u origin main && cd ..; done

# Verify all remotes
for dir in bizra-*; do echo "=== $dir ===" && cd "$dir" && git remote -v && cd ..; done
```

---

**Ready to Execute:** YES
**Estimated Time:** 5-10 minutes total
**Prerequisites:** GitHub account authenticated

**Next:** Authenticate GitHub CLI and execute setup script
