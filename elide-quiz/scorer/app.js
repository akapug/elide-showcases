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
      body: JSON.stringify({ answers })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Scoring failed');
    }
    
    const results = data.results;
    
    // Save to leaderboard
    await saveToLeaderboard(name, results);
    
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
async function saveToLeaderboard(name, results) {
  try {
    const submission = {
      name,
      percentage: parseFloat(results.percentage),
      points: results.earnedPoints,
      totalPoints: results.totalPoints,
      grade: results.grade,
      timestamp: new Date().toISOString(),
      byTopic: results.byTopic
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
      <div style="
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
    
    chartContainer.appendChild(bar);
  });
}

// Load questions and LLM prompt
async function loadQuestions() {
  try {
    const response = await fetch('/api/questions');
    const questionsText = await response.text();

    // Set questions textarea
    document.getElementById('all-questions').value = questionsText;

    // Create LLM prompt
    const llmPrompt = `# Elide Expert Quiz - 500 Questions

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
- Master: 95%+ (855+ points)
- Expert: 85%+ (765+ points)
- Pass: 70%+ (630+ points)
- Total: 900 points (500 questions, varying difficulty)

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
500. A
\`\`\`

Good luck! 🚀`;

    document.getElementById('llm-prompt').value = llmPrompt;

  } catch (error) {
    console.error('Error loading questions:', error);
    document.getElementById('all-questions').value = 'Error loading questions. Please check the console.';
    document.getElementById('llm-prompt').value = 'Error loading questions. Please check the console.';
  }
}

// Load leaderboard on page load if on that tab
if (window.location.hash === '#leaderboard') {
  showTab('leaderboard');
}

