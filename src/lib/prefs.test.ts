import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampRail, RAIL_DEFAULT, RAIL_MAX, RAIL_MIN } from './prefs.ts'

test('clampRail keeps the rail inside its bounds', () => {
  assert.equal(clampRail(300), 300)
  assert.equal(clampRail(10), RAIL_MIN)
  assert.equal(clampRail(9999), RAIL_MAX)
  assert.equal(clampRail(300.6), 301)
})

test('clampRail falls back on garbage from storage', () => {
  assert.equal(clampRail(Number('wide')), RAIL_DEFAULT)
  assert.equal(clampRail(Infinity), RAIL_DEFAULT)
})
