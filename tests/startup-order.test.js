import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('loads the persisted economy before resolving the saved rental residence', () => {
  const economyInitialization = mainSource.indexOf('const economy = loadEconomy(economyStorage);');
  const rentalResidenceLookup = mainSource.indexOf('const savedRentalHouse = economy.lease');

  assert.notEqual(economyInitialization, -1, 'the game economy should be initialized');
  assert.notEqual(rentalResidenceLookup, -1, 'startup should resolve the saved rental residence');
  assert.ok(
    economyInitialization < rentalResidenceLookup,
    'the economy must be initialized before startup reads a persisted rental lease',
  );
});
