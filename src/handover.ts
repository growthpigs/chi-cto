// src/handover.ts

export interface HandoverData {
  sessionId: string;
  startTime: string;
  tokenBudget: number;
  tokenUsed: number;
  completedFeatures: string[];
  blockedFeatures: string[];
  currentFeature?: any;
  decisions: string[];
  notes: string;
}

export class HandoverBuilder {
  /**
   * Build markdown handover from session state
   * Format: Human-readable, preserves all important state
   */
  static toMarkdown(data: HandoverData): string {
    return `---
## Chi CTO Session Handover

**Session ID:** ${data.sessionId}
**Start Time:** ${data.startTime}
**Token Budget:** ${data.tokenUsed} / ${data.tokenBudget}

### Completed
${data.completedFeatures.length > 0 ? data.completedFeatures.map(f => `- ✅ ${f}`).join('\n') : 'None'}

### Blocked
${data.blockedFeatures.length > 0 ? data.blockedFeatures.map(f => `- ⚠️ ${f}`).join('\n') : 'None'}

### Decisions Needed
${data.decisions.length > 0 ? data.decisions.map(d => `- [ ] ${d}`).join('\n') : 'None'}

### Notes
${data.notes || 'No notes'}

---
`;
  }

  /**
   * Parse markdown handover back to SessionState
   */
  static fromMarkdown(markdown: string): HandoverData {
    // Extract Session ID
    const sessionIdMatch = markdown.match(/\*\*Session ID:\*\*\s*(.+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1].trim() : 'unknown';

    // Extract Start Time
    const startTimeMatch = markdown.match(/\*\*Start Time:\*\*\s*(.+)/);
    const startTime = startTimeMatch ? startTimeMatch[1].trim() : new Date().toISOString();

    // Extract Token Budget line
    const tokenMatch = markdown.match(/\*\*Token Budget:\*\*\s*(\d+)\s*\/\s*(\d+)/);
    const tokenUsed = tokenMatch ? parseInt(tokenMatch[1], 10) : 0;
    const tokenBudget = tokenMatch ? parseInt(tokenMatch[2], 10) : 200000;

    // Extract Completed features
    const completedSection = markdown.match(/### Completed\n([\s\S]*?)(?=### Blocked|### Decisions|---)/);
    const completedFeatures = completedSection
      ? completedSection[1]
          .split('\n')
          .filter(line => line.startsWith('- ✅'))
          .map(line => line.replace('- ✅ ', '').trim())
          .filter(f => f.length > 0)
      : [];

    // Extract Blocked features
    const blockedSection = markdown.match(/### Blocked\n([\s\S]*?)(?=### Decisions|### Notes|---)/);
    const blockedFeatures = blockedSection
      ? blockedSection[1]
          .split('\n')
          .filter(line => line.startsWith('- ⚠️'))
          .map(line => line.replace('- ⚠️ ', '').trim())
          .filter(f => f.length > 0)
      : [];

    // Extract Decisions
    const decisionsSection = markdown.match(/### Decisions Needed\n([\s\S]*?)(?=### Notes|---)/);
    const decisions = decisionsSection
      ? decisionsSection[1]
          .split('\n')
          .filter(line => line.startsWith('- [ ]'))
          .map(line => line.replace('- [ ] ', '').trim())
          .filter(d => d.length > 0)
      : [];

    // Extract Notes
    const notesSection = markdown.match(/### Notes\n([\s\S]*?)(?=---|$)/);
    const notes = notesSection ? notesSection[1].trim() : 'No notes';

    return {
      sessionId,
      startTime,
      tokenBudget,
      tokenUsed,
      completedFeatures,
      blockedFeatures,
      decisions,
      notes
    };
  }
}
