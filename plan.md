# plan

repo small. clean. one branch (main). no dupes, no conflicts, tree clean before this work.

## what broken

nothing broken found. no todo, no fixme, no placeholder text in src. build config, tailwind,
vite all look wired up.

## what half-built

- no readme. repo have no setup instruction for new dev.
- no test. zero test file in whole project.
- resume link point to google drive file, not hosted in repo. link rot risk, no fallback if
  drive file move or permission change.
- inline style everywhere (Contact.jsx, likely other section too) instead of tailwind class,
  even though tailwind installed and configured. two style system in one project.
- social link (contact) hardcode by hand in array, no central config file for site-wide
  constant like email, handle.

## next step for real feature work

1. write readme. cover install, dev, build command. five minute job, big payoff for anyone
   else touching repo.
2. pick one style approach and stick with it. either move inline style in Contact.jsx (and
   check other section) to tailwind class, or drop tailwind if not gonna use it consistent.
3. add at least one smoke test or build check in CI so broken build get caught before merge.
4. self-host resume PDF in public/ instead of drive link. remove dependency on external drive
   permission staying open.
5. pull shared constant (email, social handle, links) into one file, import where needed.

## branch and push note

branch created fresh off main for this pass. work already in sync with origin, nothing to
merge. pushed straight, no force, no branch delete, no PR opened.
