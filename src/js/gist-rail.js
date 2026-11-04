// /gist: the same untangling spaghetti rope as the case study pages, parked in the
// right margin and driven by scroll. Wide screens only, matching case-study.js.
import { SpaghettiRail } from './three/SpaghettiRail.js';

const RAIL_MIN_WIDTH = 1200;

const canvas = document.getElementById('rail-canvas');
if (canvas && typeof THREE !== 'undefined' && window.innerWidth >= RAIL_MIN_WIDTH) {
    const rail = new SpaghettiRail(canvas).init();
    if (rail) document.body.classList.add('has-rail');
}
