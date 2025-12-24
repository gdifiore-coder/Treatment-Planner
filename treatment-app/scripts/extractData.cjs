const fs = require('fs');
const path = require('path');

// File paths for the three treatment planners (relative to scripts folder)
const files = {
  child: '../../The Child Psychotherapy Treatment Planner (PracticePlanners) (Arthur E. Jongsma Jr., L. Mark Peterson etc.) (Z-Library).md',
  adolescent: '../../The Adolescent Psychotherapy Treatment Planner Includes DSM-5 Updates ( etc.) (Z-Library).md',
  sexualAbuse: '../../The+Sexual+Abuse+Victim+and+Sexual+Offender+Treatment+Planner,+with+DSM+5+Updates+(+PDFDrive+).md'
};

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\d+\.\s*/, '')
    .replace(/^###\s*/, '')
    .replace(/^##\s*/, '')
    .trim();
}

function isChapterTitle(line, nextLines) {
  const upperLine = line.toUpperCase();
  const cleanLine = line.replace(/^#+\s*/, '').trim();

  // Skip known non-chapter headers
  if (upperLine.includes('BEHAVIORAL DEFINITIONS') ||
      upperLine.includes('LONG-TERM GOALS') ||
      upperLine.includes('SHORT-TERM OBJECTIVES') ||
      upperLine.includes('THERAPEUTIC INTERVENTIONS') ||
      upperLine.includes('DIAGNOSTIC SUGGESTIONS') ||
      upperLine.includes('APPENDIX') ||
      upperLine.includes('INTRODUCTION') ||
      upperLine.includes('CONTENTS') ||
      upperLine.includes('PREFACE') ||
      upperLine.includes('ACKNOWLEDGMENTS') ||
      upperLine.includes('SAMPLE TREATMENT') ||
      upperLine.includes('REFERENCES') ||
      upperLine.includes('---') ||
      upperLine.includes('COPYRIGHT') ||
      upperLine.includes('WILEY') ||
      cleanLine.length < 4 ||
      cleanLine.length > 80) {
    return false;
  }

  // A chapter title is usually followed by BEHAVIORAL DEFINITIONS within a few lines
  if (line.startsWith('## ')) {
    const lookAhead = nextLines.slice(0, 30).join(' ').toUpperCase();
    if (lookAhead.includes('BEHAVIORAL DEFINITIONS')) {
      return true;
    }
  }

  return false;
}

function extractData(content, demographic) {
  const data = [];
  const lines = content.split('\n');

  let currentProblem = null;
  let definitions = [];
  let goals = [];
  let interventions = [];
  let diagnoses = [];

  let inDefinitions = false;
  let inGoals = false;
  let inInterventions = false;
  let inDiagnoses = false;

  let textBuffer = '';

  function saveProblem() {
    if (currentProblem && currentProblem.length > 3) {
      // Only save if we have meaningful content
      if (definitions.length > 0 || interventions.length > 0) {
        data.push({
          problem: currentProblem,
          demographic,
          definitions: definitions.filter(d => d.length > 15).slice(0, 20),
          goals: goals.filter(g => g.length > 15).slice(0, 10),
          interventions: interventions.filter(i => i.length > 20).slice(0, 60),
          diagnoses: diagnoses.slice(0, 25)
        });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();
    const nextLines = lines.slice(i + 1, i + 50);

    // Check for new chapter
    if (isChapterTitle(line, nextLines)) {
      // Save previous problem
      saveProblem();

      // Start new problem
      currentProblem = line.replace(/^#+\s*/, '').trim();
      definitions = [];
      goals = [];
      interventions = [];
      diagnoses = [];
      inDefinitions = false;
      inGoals = false;
      inInterventions = false;
      inDiagnoses = false;
      textBuffer = '';
      continue;
    }

    // Detect section changes
    if (upperLine.includes('BEHAVIORAL DEFINITIONS')) {
      inDefinitions = true;
      inGoals = false;
      inInterventions = false;
      inDiagnoses = false;
      textBuffer = '';
      continue;
    } else if (upperLine.includes('LONG-TERM GOALS')) {
      inDefinitions = false;
      inGoals = true;
      inInterventions = false;
      inDiagnoses = false;
      textBuffer = '';
      continue;
    } else if (upperLine.includes('SHORT-TERM OBJECTIVES') || upperLine.includes('THERAPEUTIC INTERVENTIONS')) {
      inDefinitions = false;
      inGoals = false;
      inInterventions = true;
      inDiagnoses = false;
      textBuffer = '';
      continue;
    } else if (upperLine.includes('DIAGNOSTIC SUGGESTIONS')) {
      inDefinitions = false;
      inGoals = false;
      inInterventions = false;
      inDiagnoses = true;
      textBuffer = '';
      continue;
    }

    // Skip certain lines
    if (line === '---' || line.match(/^[\d]+$/) ||
        line.includes('THE CHILD PSYCHOTHERAPY TREATMENT PLANNER') ||
        line.includes('THE ADOLESCENT PSYCHOTHERAPY TREATMENT PLANNER') ||
        line.includes('SEXUAL ABUSE VICTIM AND SEXUAL OFFENDER') ||
        line.startsWith('Indicates that') ||
        line.length === 0) {
      continue;
    }

    // Process content based on current section
    if (!currentProblem) continue;

    // Handle definitions
    if (inDefinitions) {
      const match = line.match(/^(\d+)\.\s+(.+)/);
      if (match) {
        if (textBuffer.length > 0) {
          definitions.push(cleanText(textBuffer));
          textBuffer = '';
        }
        textBuffer = match[2];
      } else if (textBuffer.length > 0 && line.length > 0 && !line.startsWith('#')) {
        textBuffer += ' ' + line;
      }
    }

    // Handle goals
    if (inGoals) {
      const match = line.match(/^(\d+)\.\s+(.+)/);
      if (match) {
        if (textBuffer.length > 0) {
          goals.push(cleanText(textBuffer));
          textBuffer = '';
        }
        textBuffer = match[2];
      } else if (textBuffer.length > 0 && line.length > 0 && !line.startsWith('#')) {
        textBuffer += ' ' + line;
      }
    }

    // Handle interventions - they appear with ### prefix or numbered
    if (inInterventions) {
      // Look for intervention markers
      const hasInterventionMarker = line.startsWith('###') ||
        (line.match(/^\d+\.\s+/) && (
          line.toLowerCase().includes('client') ||
          line.toLowerCase().includes('teach') ||
          line.toLowerCase().includes('assign') ||
          line.toLowerCase().includes('explore') ||
          line.toLowerCase().includes('assess') ||
          line.toLowerCase().includes('encourage') ||
          line.toLowerCase().includes('assist') ||
          line.toLowerCase().includes('refer') ||
          line.toLowerCase().includes('conduct') ||
          line.toLowerCase().includes('discuss') ||
          line.toLowerCase().includes('help') ||
          line.toLowerCase().includes('monitor') ||
          line.toLowerCase().includes('identify') ||
          line.toLowerCase().includes('train') ||
          line.toLowerCase().includes('instruct') ||
          line.toLowerCase().includes('review') ||
          line.toLowerCase().includes('process') ||
          line.toLowerCase().includes('reinforce') ||
          line.toLowerCase().includes('establish') ||
          line.toLowerCase().includes('develop') ||
          line.toLowerCase().includes('use') ||
          line.toLowerCase().includes('apply') ||
          line.toLowerCase().includes('provide')
        ));

      if (hasInterventionMarker) {
        if (textBuffer.length > 20) {
          interventions.push(cleanText(textBuffer));
        }
        textBuffer = cleanText(line);
      } else if (textBuffer.length > 0 && line.length > 0 && !line.startsWith('#')) {
        textBuffer += ' ' + line;
      }
    }

    // Handle diagnoses
    if (inDiagnoses) {
      const diagMatch = line.match(/^(F\d+[\.\d]*|Z\d+[\.\d]*|R\d+[\.\d]*)\s+(.+)/);
      if (diagMatch) {
        diagnoses.push({
          code: diagMatch[1],
          name: diagMatch[2].trim()
        });
      }
    }
  }

  // Save last problem
  if (textBuffer.length > 0) {
    if (inDefinitions) definitions.push(cleanText(textBuffer));
    else if (inGoals) goals.push(cleanText(textBuffer));
    else if (inInterventions && textBuffer.length > 20) interventions.push(cleanText(textBuffer));
  }
  saveProblem();

  return data;
}

// Main execution
function main() {
  const allData = {
    child: [],
    adolescent: [],
    sexualAbuse: []
  };

  // Process each file
  for (const [demographic, filePath] of Object.entries(files)) {
    const fullPath = path.join(__dirname, filePath);
    console.log(`Processing ${demographic}...`);

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      allData[demographic] = extractData(content, demographic);
      console.log(`  Found ${allData[demographic].length} problems/chapters`);

      // Log first problem's intervention count for debugging
      if (allData[demographic].length > 0) {
        const first = allData[demographic][0];
        console.log(`  First problem: "${first.problem}" - ${first.definitions.length} definitions, ${first.interventions.length} interventions`);
      }
    } catch (err) {
      console.error(`Error processing ${demographic}:`, err.message);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '../src/data/treatmentData.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));

  console.log(`\nData extracted to ${outputPath}`);

  // Summary stats
  let totalProblems = 0;
  let totalInterventions = 0;
  for (const [demo, problems] of Object.entries(allData)) {
    const demoInterventions = problems.reduce((sum, p) => sum + p.interventions.length, 0);
    totalProblems += problems.length;
    totalInterventions += demoInterventions;
    console.log(`  ${demo}: ${problems.length} problems, ${demoInterventions} interventions`);
  }
  console.log(`Total: ${totalProblems} problems, ${totalInterventions} interventions`);
}

main();
