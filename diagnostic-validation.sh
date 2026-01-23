#!/bin/bash
#
# Diagnostic Validation for Chi CTO Architecture
# Tests fundamental assumptions about how Chi CTO can invoke skills
#

set -e

echo "=== Chi CTO Architecture Diagnostic ==="
echo ""

# ASSUMPTION 1: Does Chi CTO (TypeScript) have access to Skill tool?
echo "[1] Can Chi CTO TypeScript code invoke Skill tool?"
echo "    Checking: Is Skill available in Node.js context?"
node -e "
try {
  require('skillTool');
  console.log('    ✅ Skill tool available in Node.js');
} catch (e) {
  console.log('    ❌ Skill tool NOT available in Node.js');
  console.log('    Reason: Skills are Claude-only, not Node.js');
}
"
echo ""

# ASSUMPTION 2: Can spawned workers see skills?
echo "[2] Can spawned workers (Claude in Warp tab) see skills?"
echo "    Checking: Do skill files exist and are readable?"
if [ -d ~/.claude/skills ]; then
  skillCount=$(ls -1 ~/.claude/skills | wc -l)
  echo "    ✅ Skills directory exists with $skillCount skills"
  echo "    First 5 skills:"
  ls -1 ~/.claude/skills | head -5 | sed 's/^/       - /'
else
  echo "    ❌ Skills directory not found"
fi
echo ""

# ASSUMPTION 3: Can workers write files back to orchestrator?
echo "[3] Can workers write results back to chi-cto project?"
testFile="/Users/rodericandrews/_PAI/projects/chi-cto/.chi-cto-diagnostic-test"
echo "    Testing: Write to $testFile"
mkdir -p "$(dirname "$testFile")"
echo "test=$(date)" > "$testFile"
if [ -f "$testFile" ]; then
  echo "    ✅ Workers CAN write files"
  rm "$testFile"
else
  echo "    ❌ Workers CANNOT write files"
fi
echo ""

# ASSUMPTION 4: Does spawnFeatureBuilderAgent actually call a skill?
echo "[4] Does spawnFeatureBuilderAgent() invoke a skill?"
echo "    Checking source code..."
if grep -q "Skill(" /Users/rodericandrews/_PAI/projects/chi-cto/src/orchestrator.ts; then
  echo "    ✅ Found Skill invocation"
elif grep -q "invokeSkill\|callSkill\|executeSkill" /Users/rodericandrews/_PAI/projects/chi-cto/src/orchestrator.ts; then
  echo "    ✅ Found skill execution call"
else
  echo "    ❌ No skill invocation found in orchestrator.ts"
  echo "    Checking what it actually does..."
  grep -A 5 "async function spawnFeatureBuilderAgent" /Users/rodericandrews/_PAI/projects/chi-cto/src/orchestrator.ts | head -10 | sed 's/^/       /'
fi
echo ""

# ASSUMPTION 5: Are tests expecting stub code or real code?
echo "[5] Do tests expect real code or stub code?"
echo "    Checking test expectations..."
if grep -q "generateImplementation\|stub\|mock" /Users/rodericandrews/_PAI/projects/chi-cto/tests/orchestrator.test.ts; then
  echo "    ⚠️  Tests might expect generated stubs, not real code"
  grep -n "generateImplementation" /Users/rodericandrews/_PAI/projects/chi-cto/tests/orchestrator.test.ts | head -3 | sed 's/^/       /'
else
  echo "    ? Could not determine test expectations"
fi
echo ""

# ASSUMPTION 6: Is there any worker-to-orchestrator communication?
echo "[6] Is there a communication channel from workers back to orchestrator?"
echo "    Checking: How do workers report results?"
if grep -q "status.json\|handover.md" /Users/rodericandrews/_PAI/projects/chi-cto/src/warp-spawner.ts; then
  echo "    ✅ Workers write status.json/handover.md"
  echo "    But these are TEXT files, not executable code"
  echo "    Question: How does orchestrator convert text → actual code?"
else
  echo "    ❌ No worker output mechanism found"
fi
echo ""

# ASSUMPTION 7: Is there a skill registry?
echo "[7] Is there a skill registry that orchestrator can read?"
echo "    Checking: Can orchestrator discover available skills?"
if [ -f ~/.claude/skills/ChiCTO/SKILL.md ]; then
  echo "    ✅ Chi CTO SKILL.md exists (documents skills)"
  if grep -q "FeatureBuilder\|Brainstorming" ~/.claude/skills/ChiCTO/SKILL.md; then
    echo "    ✅ SKILL.md lists available skills"
    echo "    But is this READABLE by orchestrator code?"
    if grep -q "readSkillRegistry\|readSKILLmd\|discoverSkills" /Users/rodericandrews/_PAI/projects/chi-cto/src/*.ts; then
      echo "    ✅ Orchestrator reads skill registry"
    else
      echo "    ❌ Orchestrator does NOT read skill registry programmatically"
    fi
  fi
else
  echo "    ❌ Chi CTO SKILL.md not found"
fi
echo ""

echo "=== SUMMARY ==="
echo ""
echo "Key Finding: Chi CTO TypeScript code CANNOT invoke Skills directly."
echo "Skills only exist in Claude conversation contexts."
echo ""
echo "But: Spawned workers (Claude in Warp tabs) CAN invoke skills."
echo ""
echo "THE GAP: There's no mechanism for workers to return actual code"
echo "back to the orchestrator. Only status files and markdown."
echo ""
echo "Next: Determine if this is solvable or if architecture needs redesign."
