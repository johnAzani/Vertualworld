import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  DISTRICT_QUICK_DESTINATIONS,
  clearNavigationDestination,
  computeGpsGuidance,
  createNavigationUxState,
  findNearestQuickDestination,
  getQuickDestinationById,
  selectNavigationDestination,
  toggleSprintMode,
} from '../src/navigation-ux.js';

describe('navigation and user experience helpers', () => {
  it('defines quick destinations for all major Abuja districts and landmarks', () => {
    assert.ok(DISTRICT_QUICK_DESTINATIONS.length >= 6);
    const ids = new Set(DISTRICT_QUICK_DESTINATIONS.map((d) => d.id));
    for (const expectedId of ['home', 'mall', 'hall', 'stadium', 'cafe', 'circle']) {
      assert.ok(ids.has(expectedId), `Expected quick destination "${expectedId}"`);
      const dest = getQuickDestinationById(expectedId);
      assert.ok(dest);
      assert.equal(typeof dest.x, 'number');
      assert.equal(typeof dest.z, 'number');
      assert.ok(dest.taxiDestinationId.length > 0);
    }
  });

  it('toggles active GPS destinations and sprint mode cleanly', () => {
    const state = createNavigationUxState();
    assert.equal(state.activeDestinationId, null);
    assert.equal(state.sprintEnabled, false);

    const selected = selectNavigationDestination(state, 'mall');
    assert.equal(selected?.id, 'mall');
    assert.equal(state.activeDestinationId, 'mall');

    // Selecting the same destination again toggles GPS off
    const toggledOff = selectNavigationDestination(state, 'mall');
    assert.equal(toggledOff, null);
    assert.equal(state.activeDestinationId, null);

    selectNavigationDestination(state, 'hall');
    clearNavigationDestination(state);
    assert.equal(state.activeDestinationId, null);

    assert.equal(toggleSprintMode(state), true);
    assert.equal(state.sprintEnabled, true);
    assert.equal(toggleSprintMode(state), false);
    assert.equal(state.sprintEnabled, false);
  });

  it('computes bridge/flyover-aware GPS guidance, distance, and ETAs across separated districts', () => {
    const state = createNavigationUxState();
    selectNavigationDestination(state, 'hall');
    // Start in Unity Court Residential District (east side) heading to Three Arms Government District (northwest)
    const guidance = computeGpsGuidance(state, 61, -24, 0);
    assert.ok(guidance);
    assert.equal(guidance.destination.id, 'hall');
    assert.equal(guidance.arrived, false);
    assert.ok(guidance.waypoints.length >= 2, 'Cross-district GPS guidance should include bridge/flyover waypoints');
    assert.ok(guidance.routeDistanceMeters > 110);
    assert.ok(guidance.etaSprintSeconds > guidance.etaTaxiSeconds);
    assert.ok(guidance.routeSummary.includes('Via'), `Expected bridge summary in "${guidance.routeSummary}"`);

    // Arrive within arrivalRadius of destination
    const dest = getQuickDestinationById('hall');
    const arrivedGuidance = computeGpsGuidance(state, dest.x + 2, dest.z - 2, 0);
    assert.ok(arrivedGuidance);
    assert.ok(arrivedGuidance.directDistanceMeters <= dest.arrivalRadius);
    assert.equal(arrivedGuidance.arrived, true);
  });

  it('finds the nearest quick destination when clicking on the interactive Phone Map', () => {
    const nearStadium = findNearestQuickDestination(-46, -22, 34);
    assert.equal(nearStadium?.id, 'stadium');

    const nearMall = findNearestQuickDestination(59, 70, 34);
    assert.equal(nearMall?.id, 'mall');

    const farCorner = findNearestQuickDestination(-120, -120, 15);
    assert.equal(farCorner, null);
  });

  it('wires HUD quick-nav, live wallet balance pill, GPS banner, and touch sprint toggle into HTML and CSS', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

    assert.ok(html.includes('id="topbar-wallet-button"'));
    assert.ok(html.includes('id="topbar-wallet-balance"'));
    assert.ok(html.includes('id="district-nav-bar"'));
    assert.ok(html.includes('id="gps-guidance-banner"'));
    assert.ok(html.includes('id="phone-map-quick-destinations"'));
    assert.ok(html.includes('id="sprint-toggle-button"'));

    assert.ok(css.includes('.district-nav-bar'));
    assert.ok(css.includes('.gps-guidance-banner'));
    assert.ok(css.includes('.sprint-toggle-button'));
  });
});
