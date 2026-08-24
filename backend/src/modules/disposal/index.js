/**
 * Disposal Module Index (Barrel Export)
 * Tasks: BE-136, BE-137, BE-138, BE-139, BE-140
 */

import disposalRoutes from './disposal.routes.js'
import * as disposalService from './disposal.service.js'
import * as disposalController from './disposal.controller.js'

export { disposalRoutes, disposalService, disposalController }
export default disposalRoutes
