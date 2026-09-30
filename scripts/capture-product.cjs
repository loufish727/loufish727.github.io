const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const app = path.resolve(process.argv[2] || path.join(root, '../MaintainOps-team-location'));

async function main() {
  fs.mkdirSync(path.join(root, 'assets/icons'), { recursive: true });
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(app, 'src/render/iconDisplay.js'), 'utf8'), context);
  const icons = context.window.MaintainOpsIconDisplay;
  for (const name of ['work', 'assets', 'requests', 'planning', 'parts', 'procedures', 'messages', 'financial', 'newest', 'back', 'expand']) {
    const svg = (['newest', 'back', 'expand'].includes(name) ? icons.segmentIcon(name === 'expand' ? 'search' : name) : icons.navIcon(name))
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ');
    fs.writeFileSync(path.join(root, `assets/icons/${name}.svg`), svg);
  }
  fs.writeFileSync(path.join(root, 'assets/favicon.svg'), fs.readFileSync(path.join(root, 'assets/icons/assets.svg'), 'utf8').replace('currentColor', '#77d7ff'));
  const aliases = { work: 'work', equipment: 'assets', requests: 'requests', planning: 'planning', parts: 'parts', procedures: 'procedures', messages: 'messages', financial: 'financial', history: 'newest', arrow: 'back', down: 'back', expand: 'expand' };
  fs.writeFileSync(path.join(root, 'assets/icon-masks.css'), Object.entries(aliases).map(([name, source]) => {
    const svg = fs.readFileSync(path.join(root, `assets/icons/${source}.svg`), 'utf8');
    return `.icon-${name} { --icon: url("data:image/svg+xml,${encodeURIComponent(svg)}"); }`;
  }).join('\n') + '\n');
  const browser = await chromium.launch({ channel: process.env.MAINTAINOPS_CHROMIUM_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 920 }, deviceScaleFactor: 1 });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      const relative = url.pathname.replace(/^\//, '');
      if (url.hostname !== 'preview.maintainops.test' || !relative.startsWith('assets/')) return route.abort();
      const file = path.resolve(app, relative);
      if (!file.startsWith(path.join(app, 'assets') + path.sep) || !fs.existsSync(file)) return route.abort();
      return route.fulfill({ path: file });
    });
    await page.setContent('<!doctype html><html lang="en" data-theme="dark"><head><base href="https://preview.maintainops.test/"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-ui-section="mywork"><div id="preview"></div></body></html>');
    await page.addStyleTag({ path: path.join(app, 'styles.css') });
    for (const file of ['iconDisplay', 'workspaceNavigationDisplay', 'dashboardDisplay', 'workQueueDisplay', 'assetCardDisplay', 'planningDisplay']) {
      await page.addScriptTag({ path: path.join(app, `src/render/${file}.js`) });
    }
    // Only shell composition is local. Gauges, navigation and record markup come
    // directly from the app renderers; no backend, auth or production data loads.
    await page.addStyleTag({ content: '.app-shell{min-height:920px}.preview-workspace{padding:26px!important}.preview-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.preview-title h1{font-size:32px;margin:0}.preview-title p{color:#a9b7bf;margin:8px 0 0}.preview-section{margin-top:24px}.preview-brand{font-size:23px;font-weight:800;margin-bottom:6px}.preview-scope{font-size:13px;color:#a5b6c0;margin-bottom:28px}.preview-note{font-size:11px;color:#a5b6c0}.asset-list{grid-template-columns:repeat(2,minmax(0,1fr))}.work-list{grid-template-columns:repeat(3,minmax(0,1fr))}' });
    for (const view of ['work', 'equipment', 'planning']) {
      await page.evaluate(view => {
        const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
        const statusLabel = value => ({ open: 'New', in_progress: 'In Progress', blocked: 'Blocked', completed: 'Completed' }[value] || value);
        const section = { work: 'mywork', equipment: 'assets', planning: 'planning' }[view];
        const icon = window.MaintainOpsIconDisplay;
        const work = [
          { id: 'sample-1', title: 'Replace hydraulic return hose', description: 'Inspect the connection, replace the worn hose, and check for leaks.', status: 'in_progress', priority: 'high', type: 'corrective', asset_id: 'a1', assets: { name: 'Roll Former 01' }, created_at: '2026-09-29T12:00:00', due_at: '2026-09-30' },
          { id: 'sample-2', title: 'Weekly mobile lift inspection', description: 'Complete the equipment checks before the next shift.', status: 'open', priority: 'medium', type: 'preventive', asset_id: 'a2', assets: { name: 'Mobile Lift 02' }, created_at: '2026-09-29T12:00:00', due_at: '2026-10-01' },
          { id: 'sample-3', title: 'Fabricate a tooling storage rack', description: 'Add dedicated storage for the next tooling changeover.', status: 'open', priority: 'low', type: 'fabrication', asset_id: 'a3', assets: { name: 'Folder 01' }, created_at: '2026-09-28T12:00:00', due_at: '2026-10-02' },
        ];
        const navigation = window.MaintainOpsWorkspaceNavigationDisplay.createWorkspaceNavigation().render({
          items: [['mywork', 'My Work'], ['work', 'Work Orders'], ['planning', 'Planning'], ['requests', 'Requests'], ['assets', 'Equipment'], ['pm', 'PM'], ['procedures', 'Procedure Checklist'], ['parts', 'Parts'], ['team', 'Team'], ['messages', 'Messages'], ['conversions', 'Conversions'], ['performance', 'App Performance']],
          activeSection: section, scope: 'synthetic-example', escapeHtml, navIcon: icon.navIcon, renderBadge: () => '',
        });
        const dashboard = window.MaintainOpsDashboardDisplay.createDashboardDisplayHelpers({ escapeHtml, getActiveStatusFilter: () => 'active' });
        let content;
        if (view === 'work') {
          const cards = window.MaintainOpsWorkQueueDisplay.createWorkQueueDisplayHelpers({ escapeHtml, statusLabel,
            getDueState: () => null, getProcedureTemplates: () => [], getActiveWorkOrderId: () => '', cleanWorkOrderDescription: v => v,
            relationshipIcon: () => icon.navIcon('assets'), segmentIcon: icon.segmentIcon, isVendorAssigned: () => false,
            assignmentLabel: () => 'Maintenance Team', renderRelationshipChips: () => '', canAssignWorkOrderToMe: () => false,
            canManageTeam: () => false, STATUS_OPTIONS: ['open', 'in_progress', 'blocked', 'completed'],
          });
          content = dashboard.renderWorkloadStrip({ activeWork: 7, newWork: 4, inProgress: 2, blocked: 1, overdue: 1, completedAll: 42, completedMonth: 18, completedWeek: 6 }) + '<section class="preview-section"><div class="panel-header"><h2>Assigned To Me</h2><span>3 sample work orders</span></div><div class="work-list">' + work.map(cards.renderWorkOrderCard).join('') + '</div></section>';
        } else if (view === 'equipment') {
          const rows = [
            { id: 'a1', name: 'Roll Former 01', asset_type: 'primary', status: 'running', location: 'Production / Line 1', asset_tag: 'RF-001' },
            { id: 'a3', name: 'Folder 01', asset_type: 'primary', status: 'running', location: 'Fabrication', asset_tag: 'FL-001' },
            { id: 'a4', name: 'Uncoiler', asset_type: 'secondary', status: 'running', location: 'Production / Line 1', asset_tag: 'UC-001' },
            { id: 'a2', name: 'Mobile Lift 02', asset_type: 'forklift', status: 'degraded', location: 'Warehouse', asset_tag: 'ML-002' },
            { id: 'a5', name: 'Curving Unit 03', asset_type: 'traveling_machine', status: 'running', location: 'Production', location_id: 'north', asset_tag: 'CU-003' },
            { id: 'a6', name: 'Hydraulic Power Unit', asset_type: 'secondary', status: 'running', location: 'Production / Line 1', asset_tag: 'HP-001' },
          ];
          const assets = window.MaintainOpsAssetCardDisplay.createAssetCardDisplayHelpers({ escapeHtml,
            assetTypeLabel: v => ({ primary: 'Primary', secondary: 'Sub Equipment', forklift: 'Mobile Lift', traveling_machine: 'Traveling Equipment' }[v]),
            getWorkOrders: () => work, getActiveAssetId: () => '', getLocations: () => [{ id: 'north', name: 'North Facility' }],
            parentAssetFor: row => row.asset_type === 'secondary' ? rows[0] : null, childAssetsFor: id => id === 'a1' ? [rows[2], rows[5]] : [],
          });
          content = '<section><div class="panel-header"><h2>Equipment at a glance</h2><span>6 example records</span></div><div class="asset-list">' + rows.map(assets.renderAssetCard).join('') + '</div></section>';
        } else {
          const planning = window.MaintainOpsPlanningDisplay.createPlanningDisplayHelpers({ escapeHtml, LIST_ITEMS_PER_PAGE: 12,
            getPlanningPage: () => 1, getPlanningGroupOpen: () => true, renderListPagination: () => '', statusLabel, renderRelationshipChips: () => '',
          });
          content = planning.renderPlanningBoard({
            noDue: [{ kind: 'no_due', id: 'example', title: 'Add tooling storage labels', assetName: 'Folder 01', assignedTo: 'Maintenance Team', status: 'open', priority: 'low', createdAt: '2026-09-29T12:00:00' }],
            followUp: [{ kind: 'follow_up', id: 'example', title: 'Recheck hose connection', assetName: 'Roll Former 01', completedAt: 'Sep 29', resolution: 'Inspect after the next production run.' }],
            overdue: [], today: [{ title: 'Replace hydraulic return hose', assetName: 'Roll Former 01', dueAt: 'Sep 30', status: 'in_progress', priority: 'high' }],
            soon: [{ title: 'Weekly mobile lift inspection', assetName: 'Mobile Lift 02', dueAt: 'Oct 1', status: 'open', priority: 'medium' }],
            pm: [{ kind: 'pm', title: 'Inspect belts and guards', assetName: 'Roll Former 01', dueAt: 'Oct 2' }],
          });
        }
        document.body.dataset.uiSection = section;
        document.querySelector('#preview').innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="preview-brand">MAINTAIN OPS</div><div class="preview-scope">Example Workspace / North Facility</div><nav class="section-nav grouped-nav" aria-label="Workspace sections">${navigation}</nav></aside><main class="workspace preview-workspace"><header class="preview-title"><div><h1>${{ work: 'My Work', equipment: 'Equipment', planning: 'Planning' }[view]}</h1><p>North Facility</p></div><span class="preview-note">SAMPLE DATA</span></header>${content}</main></div>`;
      }, view);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      const png = await page.screenshot({ animations: 'disabled' });
      await sharp(png).webp({ quality: 91 }).toFile(path.join(root, `assets/workspace-${view}.webp`));
      console.log(`Captured ${view} with synthetic records`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
