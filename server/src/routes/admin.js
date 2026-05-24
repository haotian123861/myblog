import { Router } from "express";
import { requireAuth, requireAdmin, toSafeUser } from "../middleware/auth.js";
import { getAllUsers, setUserRole, deleteUser } from "../db.js";

const router = Router();

router.get("/users", requireAuth, requireAdmin, (req, res) => {
  const users = getAllUsers().map(toSafeUser);
  res.json({ success: true, data: users });
});

router.put("/users/:id/role", requireAuth, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ success: false, error: "角色无效" });
  }
  setUserRole(req.params.id, role);
  res.json({ success: true });
});

router.delete("/users/:id", requireAuth, requireAdmin, (req, res) => {
  deleteUser(req.params.id);
  res.json({ success: true });
});

export default router;
