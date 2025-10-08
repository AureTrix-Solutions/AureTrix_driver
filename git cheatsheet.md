# Git Cheat Sheet: Local ↔ Remote (Fully Explained)

A complete practical reference that explains not just *what* Git commands do, but *why* and *when* to use them. Ideal for learning and daily reference.

---

## 1. Remotes and Setup
Connect your local repository to one hosted online (like GitHub).

git clone <url>  
→ Makes a full local copy of a remote repository so you can work offline.

git remote -v  
→ Lists remote connections (usually “origin” points to GitHub).

git remote add origin <url>  
→ Links your local repo to a remote one (used when you started locally).

git remote set-url origin <url>  
→ Changes the URL of the remote if it moved or you forked it.

git fetch --all --prune  
→ Downloads updates from all branches and cleans up deleted ones.

**Use when:** setting up or maintaining a connection between local and remote repos.

---

## 2. Inspect and Status
See exactly what’s happening in your repo before committing.

git status  
→ Tells you which files changed, which are staged, and which are new.

git diff  
→ Shows detailed line-by-line changes that are *not* yet staged.

git diff --staged  
→ Shows what’s staged and will go into the next commit.

git log --oneline --graph --decorate --all  
→ Displays your commit history as a readable visual tree.

**Use when:** you’re checking what’s been modified or before committing.

---

## 3. Branching and Publishing
Branches isolate work so you don’t break `main`.

git switch -c feature-name  
→ Creates and switches to a new branch to safely make changes.

git push --set-upstream origin feature-name  
→ Creates the same branch on GitHub and links your local one to it.

git branch -vv  
→ Shows all branches and what remote branches they track.

**Use when:** starting a new feature, fixing a bug, or publishing work to GitHub.

---

## 4. Keep main Up to Date
Stay in sync with GitHub before making changes.

git switch main  
git pull --ff-only origin main  
→ Updates your local main branch only if it can fast-forward (no messy merges).

**Use when:** before creating a new branch or merging work.

---

## 5. Start New Work Correctly
Always branch from the latest `main`.

git switch main  
git pull --ff-only origin main  
git switch -c feature-name  

→ Ensures your new branch is based on the latest version of `main`.

**Why it matters:** prevents conflicts and outdated work later.

---

## 6. Stage and Commit
A commit is a snapshot. You choose what goes into it.

git add <file>  
→ Stages specific files for the next commit.  

git add .  
→ Stages all changed files in the folder.  

git commit -m "Short message"  
→ Creates a commit containing staged changes.  

git commit -am "Message"  
→ Stages and commits all modified *tracked* files.  

**Use when:** you want to save progress logically and incrementally.

---

## 7. Sync Your Branch with Latest main
Keep your feature branch current with the latest `main`.

git fetch origin  
git rebase origin/main  
→ Replays your commits on top of the updated `main`.  

If conflicts occur:  
git add .  
git rebase --continue  

Then push the updated branch:  
git push --force-with-lease  

**Why it matters:** keeps history clean and avoids unnecessary merge commits.

---

## 8. Merge Feature into main (Command Line)
Integrate your branch when it’s finished.

git switch main  
git pull --ff-only origin main  
git merge --ff-only feature-name  
git push origin main  

→ Moves `main`’s pointer forward to include all your branch commits.

**Use when:** your branch can be fast-forwarded without conflict.

---

## 9. Merge via GitHub Pull Request
For visibility and review before merging.

1. Open a Pull Request (`feature` → `main`) on GitHub.  
2. Choose **“Rebase and merge”** (clean history) or **“Squash and merge”** (one commit).  
3. After merging:
   git switch main  
   git pull --ff-only origin main  

**Use when:** collaborating or when you want reviews on your work.

---

## 10. Flatten Commits (Clean History)
Combine multiple commits into one.

Interactive rebase (manual):  
git switch feature  
git fetch origin  
git rebase -i origin/main  
→ Mark later commits as `squash`, edit message, save, close editor.  
git push --force-with-lease  

Squash merge (automatic):  
git switch main  
git pull --ff-only origin main  
git merge --squash feature  
git commit -m "Combined summary of work"  
git push origin main  

**Use when:** you want one clean commit summarizing your work.

---

## 11. Delete Old Branches
Clean up after merging.

git branch -d feature-name             # Delete local branch  
git push origin --delete feature-name  # Delete remote branch  

**Use when:** your feature branch has been merged and is no longer needed.

---

## 12. Fix Rejected Pushes
Handle push errors when others changed the remote.

git pull --rebase                      # Pull new changes and replay yours  
git push                               # Push again  

If you rebased or rewrote history:  
git push --force-with-lease            # Safe overwrite that checks for changes  

**Use when:** your branch and the remote are out of sync.

---

## 13. Undo and Recovery
Undo changes safely depending on what happened.

git restore <file>  
→ Undo unstaged edits (revert a file back to last commit).  

git restore --staged <file>  
→ Unstage a file but keep your edits.  

git revert <commit>  
→ Make a new commit that undoes an earlier one (safe for shared branches).  

git reflog  
→ Shows a log of every move of your HEAD pointer. Great for recovery.  

git reset --soft HEAD~1  
→ Undo last commit, keep all files staged.  

git reset --mixed HEAD~1  
→ Undo last commit, keep changes unstaged.  

git reset --hard HEAD~1  
→ Undo last commit and erase changes entirely.  

**Use when:** fixing mistakes. `reflog` is your safety net if you go too far.

---

## 14. Stash (Temporarily Save Work)
When you need to pause your work and switch branches safely.

git stash push -m "describe work"  
→ Saves all uncommitted changes (like a temporary shelf).  

git switch other-branch  
→ Move to a different branch freely.  

git stash list  
→ Shows all saved stashes.  

git stash pop  
→ Restores your most recent stash and removes it from the stash list.  

**Example:**  
You’re halfway through editing a file but need to switch to `main` to fix a bug.  
Use `stash push` to save your edits temporarily, switch, fix the bug, then `stash pop` to bring your edits back.

**Use when:** you need to quickly switch tasks but aren’t ready to commit.

---

## 15. Cherry-Pick and Fixup
Copy or improve specific commits.

git cherry-pick <commit>  
→ Apply a specific commit from another branch to your current one.  

git commit --fixup <commit>  
→ Make a new commit that “fixes up” a previous one.  

git rebase -i --autosquash main  
→ Automatically combine fixup commits with their targets.  

**Use when:** you want to apply or correct a specific change without merging the whole branch.

---

## 16. Tags and Releases
Mark important points in history (like versions).

git tag v1.0.0  
→ Create a tag for your current commit (usually a release).  

git push origin v1.0.0  
→ Push the tag to the remote repository.  

**Use when:** marking releases or stable checkpoints.

---

## 17. Fork Workflow
Keep your fork up-to-date with the original project.

git remote add upstream <original-url>  
→ Add a link to the original repo.  

git fetch upstream  
→ Get the latest changes from it.  

git switch main  
git merge --ff-only upstream/main  
git push origin main  

**Use when:** maintaining a fork of another repository.

---

## 18. VS Code Integration
Simplify your Git workflow.

- Use the **Source Control** panel for staging, committing, branching, and pushing.  
- During a rebase, save (Ctrl+S) and close the tab when Git opens a file.  
- Set VS Code as your Git editor:
  git config --global core.editor "code --wait"  

**Use when:** you want to handle Git operations visually instead of command-line.

---

## 19. Non-Negotiable Habits
- Always `fetch` before rebasing or merging.  
- Use `--ff-only` merges to keep history linear.  
- Use `--force-with-lease` instead of `--force`.  
- Run `git status` and `git log --oneline --graph` often.  
- When lost, `git reflog` is how you recover.  

**Remember:** Git is like a time machine. Almost everything can be undone safely if you commit often and use reflog wisely.
