import { Router } from "express";

const router = Router();

// TODO
router.get("/", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
