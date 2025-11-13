// Tab switching
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  event.target.classList.add('active');

  // Load content based on tab
  if (tabName === 'leaderboard') {
    loadLeaderboard();
  } else if (tabName === 'questions') {
    loadQuestions();
  }
}

// Copy to clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  element.select();
  document.execCommand('copy');

  // Show feedback
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '✅ Copied!';
  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

// Show submit form
function showSubmitForm() {
  document.getElementById('quiz-form').style.display = 'block';
  document.getElementById('results').style.display = 'none';
}

// Parse answers from textarea
function parseAnswers(text) {
  const answers = {};
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (match) {
      const [, num, answer] = match;
      answers[parseInt(num)] = answer;
    }
  }
  
  return answers;
}

// Submit quiz
document.getElementById('quiz-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const quizVersion = document.getElementById('quiz-version').value;
  const answersText = document.getElementById('answers').value;
  const answers = parseAnswers(answersText);

  // Show loading
  document.getElementById('quiz-form').style.display = 'none';
  document.getElementById('results').innerHTML = '<div class="loading">Scoring your answers...</div>';
  document.getElementById('results').style.display = 'block';

  try {
    // Score answers
    const response = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, version: quizVersion })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Scoring failed');
    }

    const results = data.results;
    results.version = quizVersion; // Add version to results

    // Save to leaderboard
    await saveToLeaderboard(name, results, answers, quizVersion);

    // Display results
    displayResults(results);

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('results').innerHTML = `
      <div class="loading" style="color: red;">
        Error: ${error.message}
        <br><br>
        <button class="button" onclick="showSubmitForm()">Try Again</button>
      </div>
    `;
  }
});

// Display results
function displayResults(results) {
  document.getElementById('results').innerHTML = `
    <button class="button back-button" onclick="showSubmitForm()">Submit Another</button>
    
    <div class="score-card">
      <div>Your Score</div>
      <div class="score-big">${results.percentage}%</div>
      <div>${results.earnedPoints}/${results.totalPoints} points</div>
      <div class="grade">${results.grade}</div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${results.correct}</div>
        <div class="stat-label">Correct</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.incorrect}</div>
        <div class="stat-label">Incorrect</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.missing}</div>
        <div class="stat-label">Missing</div>
      </div>
    </div>
    
    <div class="topic-breakdown">
      <h2>By Topic</h2>
      <div id="topic-list"></div>
    </div>
  `;
  
  // Render topic breakdown
  const topicList = document.getElementById('topic-list');
  for (const [topic, stats] of Object.entries(results.byTopic)) {
    const percentage = ((stats.points / stats.maxPoints) * 100).toFixed(1);
    
    const topicItem = document.createElement('div');
    topicItem.className = 'topic-item';
    topicItem.innerHTML = `
      <div class="topic-header">
        <span>${topic}</span>
        <span>${stats.correct}/${stats.total} (${percentage}%)</span>
      </div>
      <div class="topic-bar">
        <div class="topic-fill" style="width: ${percentage}%">${percentage}%</div>
      </div>
    `;
    topicList.appendChild(topicItem);
  }
}

// Save to leaderboard
async function saveToLeaderboard(name, results, userAnswers, version) {
  try {
    const submission = {
      name,
      percentage: parseFloat(results.percentage),
      points: results.earnedPoints,
      totalPoints: results.totalPoints,
      grade: results.grade,
      timestamp: new Date().toISOString(),
      correct: results.correct,
      incorrect: results.incorrect,
      missing: results.missing,
      byTopic: results.byTopic,
      version: version || 'full',
      // Store answers for detailed view
      userAnswers: userAnswers
    };

    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  } catch (error) {
    console.error('Failed to save to leaderboard:', error);
  }
}

// Load leaderboard
async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-content');
  container.innerHTML = '<div class="loading">Loading leaderboard...</div>';
  
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    
    if (!data.success || !data.submissions || data.submissions.length === 0) {
      container.innerHTML = '<div class="loading">No submissions yet. Be the first!</div>';
      return;
    }
    
    // Sort by percentage descending
    const sorted = data.submissions.sort((a, b) => b.percentage - a.percentage);
    
    // Render SWE-bench style chart
    renderLeaderboardChart(sorted, container);
    
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    container.innerHTML = '<div class="loading" style="color: red;">Failed to load leaderboard</div>';
  }
}

// Render SWE-bench style chart
function renderLeaderboardChart(submissions, container) {
  const maxPercentage = Math.max(...submissions.map(s => s.percentage));
  
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="font-size: 2rem; margin-bottom: 10px;">Elide Expert Quiz</h2>
      <p style="color: #666; font-size: 1.1rem;">500 questions across 7 topics</p>
    </div>
    
    <div id="chart-container" style="margin-top: 40px;"></div>
  `;
  
  const chartContainer = document.getElementById('chart-container');
  
  submissions.forEach((submission, index) => {
    const barHeight = 60;
    const barColor = index === 0 ? '#10b981' : '#667eea'; // Green for #1, purple for others
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      margin-bottom: 20px;
      position: relative;
    `;
    
    bar.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600;">
        <span style="font-size: 1.1rem;">${submission.name}</span>
        <span style="color: #666;">${submission.points}/${submission.totalPoints} points</span>
      </div>
      <div class="leaderboard-bar" data-submission-id="${submission.id}" style="
        height: ${barHeight}px;
        background: ${barColor};
        width: ${(submission.percentage / maxPercentage) * 100}%;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.3rem;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        position: relative;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      ">
        <span>${submission.percentage.toFixed(2)}%</span>
        <span style="
          position: absolute;
          right: 15px;
          font-size: 0.9rem;
          opacity: 0.9;
        ">${submission.grade}</span>
      </div>
      <div style="margin-top: 5px; font-size: 0.85rem; color: #999;">
        ${new Date(submission.timestamp).toLocaleString()}
      </div>
    `;

    // Add click handler
    const barElement = bar.querySelector('.leaderboard-bar');
    barElement.addEventListener('mouseenter', () => {
      barElement.style.transform = 'scale(1.02)';
      barElement.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    barElement.addEventListener('mouseleave', () => {
      barElement.style.transform = 'scale(1)';
      barElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    barElement.addEventListener('click', () => {
      showSubmissionDetails(submission.id);
    });

    chartContainer.appendChild(bar);
  });
}

// Load questions and LLM prompt
async function loadQuestions() {
  try {
    // Get selected version
    const version = document.getElementById('questions-version')?.value || 'full';
    const questionsFile = version === 'human' ? 'questions-human.md' : 'questions.md';
    const totalQuestions = version === 'human' ? 50 : 500;
    const totalPoints = version === 'human' ? 75 : 900;

    // Fetch questions from GitHub (public, always available)
    const response = await fetch(`https://raw.githubusercontent.com/akapug/elide-showcases/master/elide-quiz/${questionsFile}`);
    const questionsText = await response.text();

    // Set questions textarea
    document.getElementById('all-questions').value = questionsText;

    // Create LLM prompt
    const quizTitle = version === 'human' ? 'Human Edition - 50 Questions' : '500 Questions';
    const llmPrompt = `# Elide Expert Quiz - ${quizTitle}

You are taking the Elide Expert Quiz, a comprehensive knowledge test covering Elide v1.0.0-beta11-rc1.

## Instructions

1. **Read all 500 questions below**
2. **Answer each question** to the best of your ability
3. **Use any tools available** to you (web search, documentation, MCP servers, etc.)
4. **Format your answers** exactly as shown:
   - Multiple choice: Just the letter (e.g., "1. B")
   - Multiple select: Comma-separated letters (e.g., "2. A,C,D")
   - Short answer: Brief text response (e.g., "3. elide serve")
5. **Submit your answers** at: ${window.location.origin}
   - If you have browser tools, navigate to the site and submit directly
   - Otherwise, provide your answers and ask the human to submit for you
6. **Predict your score** before seeing results (optional but encouraged!)

## Grading Scale
${version === 'human'
  ? `- Master: 95%+ (71+ points)
- Expert: 85%+ (64+ points)
- Pass: 70%+ (53+ points)
- Total: 75 points (50 questions, varying difficulty)`
  : `- Master: 95%+ (855+ points)
- Expert: 85%+ (765+ points)
- Pass: 70%+ (630+ points)
- Total: 900 points (500 questions, varying difficulty)`}

## Recommended Resources

**Primary Sources** (most authoritative):
- \`elide help\` CLI - Built-in documentation (install: \`curl -sSL --tlsv1.2 elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1\`)
- **GitHub Showcases**: https://github.com/akapug/elide-showcases
  - **CRITICAL**: Beta11-rc1 examples and patterns are HERE
  - Real working code for beta11-rc1 features
  - Migration guides and best practices
- GitHub: https://github.com/elide-dev/elide
  - Pull Requests (implementation details)
  - Issues (known bugs, feature requests)
  - Release Notes (changelog, breaking changes)
- Official Docs: https://docs.elide.dev

**IMPORTANT HINTS**:
1. **The quiz questions themselves contain many hints** - read them carefully!
2. **Beta11-rc1 is NOT widely released** - most public docs are for beta8-10
3. **Use the showcases repo** for beta11-rc1 specific answers
4. **Install Elide locally** if you have terminal access - \`elide help\` is invaluable
5. **Using all available tools is EXPECTED** - we want to see which tools help most!

**Note**: Agents with terminal access, web search, and MCP servers should perform significantly better. Document your approach!

## Questions

${questionsText}

## Submission Format

Submit your answers in this format:
\`\`\`
1. B
2. A,C,D
3. elide serve
4. B
...
${totalQuestions}. A
\`\`\`

## Post-Quiz Survey (Required)

After answering all 500 questions, include the following information:

**Total Time**: [X minutes thinking + Y minutes answering = Z total]

**Tools Available**:
- [ ] Terminal/shell access
- [ ] Web search
- [ ] MCP servers (list which ones)
- [ ] Code execution
- [ ] File system access
- [ ] Other: ___________

**Primary Sources Used** (rank by usefulness):
1.
2.
3.

**Research Strategy** (freeform):
[Describe your approach - did you install Elide locally? Read PRs? Use MCP? Web search? How did you handle uncertainty?]

**Predicted Score**: ___% (before seeing results)

Good luck! 🚀`;

    document.getElementById('llm-prompt').value = llmPrompt;

  } catch (error) {
    console.error('Error loading questions:', error);
    document.getElementById('all-questions').value = 'Error loading questions. Please check the console.';
    document.getElementById('llm-prompt').value = 'Error loading questions. Please check the console.';
  }
}

// Show submission details in modal
async function showSubmissionDetails(submissionId) {
  try {
    const response = await fetch(`/api/submission?id=${submissionId}`);
    const data = await response.json();

    if (!data.success) {
      alert('Failed to load submission details');
      return;
    }

    const { submission, comparison } = data;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
      position: relative;
    `;

    modalContent.innerHTML = `
      <button id="close-modal" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: 600;
      ">Close</button>

      <h2 style="margin-bottom: 20px;">${submission.name} - Detailed Results</h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <div style="font-size: 0.85rem; color: #666;">Score</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${submission.percentage.toFixed(2)}%</div>
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <div style="font-size: 0.85rem; color: #666;">Points</div>
          <div style="font-size: 1.5rem; font-weight: bold;">${submission.points}/${submission.totalPoints}</div>
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <div style="font-size: 0.85rem; color: #666;">Correct</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${submission.correct}</div>
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <div style="font-size: 0.85rem; color: #666;">Incorrect</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${submission.incorrect}</div>
        </div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <div style="font-size: 0.85rem; color: #666;">Missing</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${submission.missing}</div>
        </div>
      </div>

      <h3 style="margin-bottom: 15px;">Answer Comparison</h3>
      <div id="comparison-list" style="max-height: 500px; overflow-y: auto;"></div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Render comparison
    const comparisonList = document.getElementById('comparison-list');
    comparison.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        border: 2px solid ${item.isCorrect ? '#10b981' : '#ef4444'};
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        background: ${item.isCorrect ? '#f0fdf4' : '#fef2f2'};
      `;

      itemDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: ${item.isCorrect ? '#10b981' : '#ef4444'};">
          Question ${item.question} ${item.isCorrect ? '✓' : '✗'}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Your Answer:</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px;">${item.userAnswer}</code>
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Correct Answer:</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px;">${item.correctAnswer}</code>
        </div>
        <div style="font-size: 0.9rem; color: #666;">
          ${item.explanation}
        </div>
      `;

      comparisonList.appendChild(itemDiv);
    });

    // Close modal handlers
    document.getElementById('close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('Error loading submission details:', error);
    alert('Failed to load submission details');
  }
}

// Load leaderboard on page load if on that tab
// Updated: 2025-01-12 - Added submission details modal
if (window.location.hash === '#leaderboard') {
  showTab('leaderboard');
}

