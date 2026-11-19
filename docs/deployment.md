# Vercel and GitHub pipeline

## Initial connection

1. Import souma888/PlayForge in the intended Vercel account/team.
2. Framework: Next.js. Root: repository root. Node: 24.x.
3. Install: npm ci. Build: npm run build. Keep the framework's output default.
4. Production branch: main. Feature branches/PRs receive preview deployments through the Git integration.
5. Add environment variables only as services are implemented, separately for preview and production.

No Vercel project has been provisioned by this scaffold. No deployment tokens are needed
in GitHub Actions because Vercel's Git integration handles deployments.

## Validation and release gates

CI runs npm ci followed by type generation/type checks, game contract tests and next build.
The workflow uses a read-only GitHub token and contains no deployment secrets. The lockfile
pins resolved dependencies. CI runs on PRs and main pushes.

After the first workflow run, configure a GitHub ruleset requiring **Typecheck, test and build**
before merging into main. Require PRs if appropriate for the project's workflow. Repository
rules and Vercel connections are account settings and are not enabled by a workflow file.

CI and Vercel builds run independently by default: this scaffold does not claim that a main
push waits for GitHub CI before release. Configure Vercel Deployment Checks if supported by
the selected plan to gate releases, or adopt a staged production pipeline when a strict
test-before-release guarantee is needed. Avoid adding a second deployment workflow on top
of the Git integration without intentionally disabling duplicate deployments.

## Later verification

Add browser tests for actual game launch, navigation, input, save/load and room flows as
those features exist. Validate protected previews through supported Vercel authentication;
do not commit bypass credentials. Add error tracking and performance budgets when there
is a real gameplay flow to measure.

References: https://vercel.com/docs/git/vercel-for-github and
https://vercel.com/docs/deployment-checks.
