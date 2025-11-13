# Elide Expert Quiz

Comprehensive knowledge test for Elide v1.0.0-beta11-rc1 with 500 questions.

🌐 **Live Quiz**: https://scorer-qvkzppkm1-m-v.vercel.app (will be at elide.top soon)

## Quick Start

```bash
cd scorer
npm install
npm run dev
# Open http://localhost:3000
```

## What's Included

- **500 questions** across 7 topics (Runtime, CLI, HTTP, Projects, Polyglot, Testing, Beta11, Advanced)
- **Web UI** with scoring, leaderboard, and SWE-bench style visualization
- **LLM-ready prompt** - copy questions + instructions directly from the Questions tab
- **Grading**: Master (95%+), Expert (85%+), Pass (70%+)
- **900 total points** (Easy 1pt, Medium 2pt, Hard 3pt)

## For LLMs

1. Visit the web UI
2. Go to the **Questions** tab
3. Copy the LLM prompt (includes all 500 questions + instructions)
4. Paste into your AI assistant
5. Submit answers via the web UI (or ask human to submit)

## For Humans

1. Visit the web UI
2. View questions or answer directly in the Submit tab
3. Submit and see detailed results with topic breakdown
4. Compare your score on the leaderboard

## Files

- `questions.md` - All 500 questions (56KB markdown)
- `scorer/` - Web UI + scoring logic
- `answers.md` - Answer key (gitignored to prevent LLM cheating)
- ✅ **Summary**: [SUMMARY.md](SUMMARY.md)

## Question Breakdown

- **Runtime & Core** (100q): Languages, interop, GraalVM, performance
- **CLI Commands** (80q): All elide commands, flags, workflows
- **HTTP & Servers** (80q): Beta11 native HTTP, fetch handlers, WSGI, Node.js http
- **Projects & Dependencies** (60q): elide.pkl, lockfiles, npm/maven/pip
- **Polyglot** (50q): Cross-language calls, Python/Java/Kotlin integration
- **Testing & Build** (40q): elide test, coverage, native-image, jib
- **Beta11 Features** (50q): Migration patterns, new APIs, WSGI
- **Advanced Topics** (40q): Performance tuning, security, edge cases

## Scoring

- **Total Points**: 1000 (weighted by difficulty)
- **Pass**: 700+ (70%)
- **Expert**: 850+ (85%)
- **Master**: 950+ (95%)

## Sources

All questions derived from:
- `elide help` system (packages/cli/.../META-INF/elide/help/*.md)
- elide-showcases documentation (BETA11_MIGRATION_GUIDE.md, README.md, etc.)
- Verified beta11-rc1 examples in elide-showcases/original/showcases/
- elide-dev/elide repository (PRs, issues, source code)

## Contributing

Questions should be:
- **Factual** - Based on documented behavior
- **Unambiguous** - One clear correct answer
- **Practical** - Test real-world knowledge
- **Current** - Reflect beta11-rc1 or later

To add questions:
1. Edit `questions.md`
2. Add answer + explanation to `answers.md`
3. Update question count in this README
4. Test with scorer

## License

CC-BY-4.0 - Free to use, modify, and share with attribution.

