import { router } from '/static/js/utils/router.js';

window.addEventListener('popstate', router);
window.addEventListener('load', router);