const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, 'app.js'), 'utf8');
const sandbox = { console, Date, JSON, Math };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const core = sandbox.GoalTrackerCore;
assert.ok(core, 'GoalTrackerCore must be exposed for the browser app and tests');

assert.deepEqual(Array.from(core.normalizeState({ goals: 'bad' }).goals), []);

assert.equal(
  core.calculateProgress([
    { title: 'A', completed: true },
    { title: 'B', completed: false },
  ]),
  50,
);
assert.equal(core.calculateProgress([]), 0);

assert.equal(core.isOverdue({ dueDate: '2020-01-01', status: 'active' }, '2020-01-02'), true);
assert.equal(core.isOverdue({ dueDate: '2020-01-01', status: 'completed' }, '2020-01-02'), false);

assert.equal(core.validateImport({ goals: [{ title: 'Valid' }] }).valid, true);
assert.equal(core.validateImport({ nope: true }).valid, false);
assert.equal(core.validateImport(null).valid, false);

const migrated = core.normalizeState({
  goals: [{ title: 'Mục tiêu lớn', steps: [{ title: 'Mục tiêu nhỏ A', completed: true }] }],
});
assert.equal(migrated.goals[0].children[0].title, 'Mục tiêu nhỏ A');
assert.equal(migrated.goals[0].children[0].status, 'completed');
assert.equal(core.calculateProgress(migrated.goals[0].children), 100);

console.log('All goal tracker core tests passed.');
