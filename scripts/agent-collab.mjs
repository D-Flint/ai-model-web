#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, '.agents', 'registry.json');
const ACTIVITY_PATH = path.join(ROOT_DIR, '.agents', 'activity.jsonl');

function normalizePath(p) {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', activeAgents: {}, claims: {}, recentTasks: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reading registry:', err.message);
    return { version: '1.0.0', activeAgents: {}, claims: {}, recentTasks: [] };
  }
}

function saveRegistry(data) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function appendActivity(event) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  }) + '\n';
  fs.appendFileSync(ACTIVITY_PATH, line, 'utf8');
}

function isPathConflict(targetPath, existingPath) {
  const normTarget = normalizePath(targetPath);
  const normExisting = normalizePath(existingPath);

  if (normTarget === normExisting) return true;
  if (normTarget.startsWith(normExisting + '/')) return true;
  if (normExisting.startsWith(normTarget + '/')) return true;

  return false;
}

const [,, command, ...args] = process.argv;

switch (command) {
  case 'register': {
    const [agentId, role, ...goalParts] = args;
    if (!agentId || !role) {
      console.error('Usage: node scripts/agent-collab.mjs register <agentId> <role> [goal]');
      process.exit(1);
    }
    const goal = goalParts.join(' ') || 'General tasks';
    const reg = loadRegistry();
    reg.activeAgents[agentId] = {
      role,
      goal,
      lastHeartbeat: new Date().toISOString(),
      status: 'active'
    };
    saveRegistry(reg);
    appendActivity({ agentId, action: 'REGISTER', target: role, details: goal });
    console.log(`[Collab] Agent "${agentId}" registered as [${role}]. Goal: ${goal}`);
    break;
  }

  case 'claim': {
    const [agentId, targetPath, ...descParts] = args;
    if (!agentId || !targetPath) {
      console.error('Usage: node scripts/agent-collab.mjs claim <agentId> <filePath> [task]');
      process.exit(1);
    }
    const task = descParts.join(' ') || 'File modification';
    const normTarget = normalizePath(targetPath);
    const reg = loadRegistry();

    // Check for conflicting claims
    for (const [claimedPath, claimInfo] of Object.entries(reg.claims)) {
      if (claimInfo.agentId !== agentId && isPathConflict(normTarget, claimedPath)) {
        console.error(`[CONFLICT BLOCKED] Path "${normTarget}" conflicts with existing claim by agent "${claimInfo.agentId}"!`);
        console.error(`Claimed Path: ${claimedPath}`);
        console.error(`Claimed For:  ${claimInfo.task}`);
        console.error(`Claimed At:   ${claimInfo.timestamp}`);
        process.exit(2);
      }
    }

    // Register claim
    reg.claims[normTarget] = {
      agentId,
      task,
      timestamp: new Date().toISOString()
    };
    if (reg.activeAgents[agentId]) {
      reg.activeAgents[agentId].lastHeartbeat = new Date().toISOString();
    }
    saveRegistry(reg);
    appendActivity({ agentId, action: 'CLAIM', target: normTarget, details: task });
    console.log(`[Collab] Agent "${agentId}" claimed "${normTarget}". Task: ${task}`);
    break;
  }

  case 'release': {
    const [agentId, targetPath] = args;
    if (!agentId) {
      console.error('Usage: node scripts/agent-collab.mjs release <agentId> [filePath]');
      process.exit(1);
    }
    const reg = loadRegistry();
    let releasedCount = 0;

    if (targetPath) {
      const normTarget = normalizePath(targetPath);
      if (reg.claims[normTarget] && reg.claims[normTarget].agentId === agentId) {
        delete reg.claims[normTarget];
        releasedCount++;
        appendActivity({ agentId, action: 'RELEASE', target: normTarget, details: 'Released lock' });
      }
    } else {
      for (const [claimedPath, claimInfo] of Object.entries(reg.claims)) {
        if (claimInfo.agentId === agentId) {
          delete reg.claims[claimedPath];
          releasedCount++;
          appendActivity({ agentId, action: 'RELEASE', target: claimedPath, details: 'Released lock' });
        }
      }
    }

    saveRegistry(reg);
    console.log(`[Collab] Agent "${agentId}" released ${releasedCount} claim(s).`);
    break;
  }

  case 'log': {
    const [agentId, action, target, ...detailsParts] = args;
    if (!agentId || !action || !target) {
      console.error('Usage: node scripts/agent-collab.mjs log <agentId> <action> <target> [details]');
      process.exit(1);
    }
    const details = detailsParts.join(' ') || '';
    appendActivity({ agentId, action, target, details });
    console.log(`[Collab] Logged: [${agentId}] ${action} ${target} - ${details}`);
    break;
  }

  case 'status':
  default: {
    const reg = loadRegistry();
    console.log('=== MULTI-AGENT COLLABORATION STATUS ===\n');

    console.log('Active Agents:');
    const agents = Object.entries(reg.activeAgents);
    if (agents.length === 0) {
      console.log('  (None registered)');
    } else {
      for (const [id, info] of agents) {
        console.log(`  - [${id}] Role: ${info.role} | Status: ${info.status} | Goal: ${info.goal}`);
      }
    }

    console.log('\nActive File Claims:');
    const claims = Object.entries(reg.claims);
    if (claims.length === 0) {
      console.log('  (No active locks)');
    } else {
      for (const [path, info] of claims) {
        console.log(`  - ${path} -> Claimed by [${info.agentId}] for: "${info.task}" (${info.timestamp})`);
      }
    }

    console.log('\nRecent Activity (Last 5 events):');
    if (fs.existsSync(ACTIVITY_PATH)) {
      const lines = fs.readFileSync(ACTIVITY_PATH, 'utf8').trim().split('\n').filter(Boolean);
      const recent = lines.slice(-5);
      for (const line of recent) {
        try {
          const ev = JSON.parse(line);
          console.log(`  [${ev.timestamp.slice(11, 19)}] [${ev.agentId}] ${ev.action}: ${ev.target} ${ev.details ? '(' + ev.details + ')' : ''}`);
        } catch {
          // ignore
        }
      }
    } else {
      console.log('  (No activity recorded)');
    }
    break;
  }
}
