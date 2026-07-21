import { Router } from "express";
import { addressController } from "../controllers/addressController";
import { verifyToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { createAddressSchema, updateAddressSchema } from "../validators/addressValidator";

const router = Router();

// Protect all address routes
router.use(verifyToken as any);

// GET /api/addresses
router.get("/", asyncHandler(addressController.getAddresses));

// GET /api/addresses/:id
router.get("/:id", asyncHandler(addressController.getAddressById));

// POST /api/addresses
router.post("/", validate(createAddressSchema), asyncHandler(addressController.createAddress));

// PUT /api/addresses/:id
router.put("/:id", validate(updateAddressSchema), asyncHandler(addressController.updateAddress));

// DELETE /api/addresses/:id
router.delete("/:id", asyncHandler(addressController.deleteAddress));

// PATCH /api/addresses/:id/default
router.patch("/:id/default", asyncHandler(addressController.setDefaultAddress));

export default router;
